import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStripe, planForPriceId } from "@/lib/stripe";
import { sendEmail, paymentConfirmEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) return NextResponse.json({ message: "Missing signature" }, { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch {
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const cs = event.data.object;
      const mode = cs.metadata?.mode;
      const customerId = cs.customer as string;

      // Invoice payment mode
      if (mode === "invoice_payment") {
        const invoiceId = cs.metadata?.invoiceId;
        if (!invoiceId) break;
        const amountPaid = (cs.amount_total ?? 0) / 100;
        const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2 });

        const { data: inv } = await supabase
          .from("invoices")
          .select("id, invoice_number, total, amount_paid, amount_due, payment_intent_id, contacts(full_name, email), businesses(name)")
          .eq("id", invoiceId)
          .single();

        if (inv) {
          // Idempotency guard: skip if this payment intent was already applied
          if (inv.payment_intent_id === (cs.payment_intent as string)) break;
          const newPaid = (inv.amount_paid ?? 0) + amountPaid;
          const newDue = Math.max(0, (inv.total ?? 0) - newPaid);
          const newStatus = newDue <= 0 ? "paid" : "partially_paid";
          await supabase.from("invoices").update({
            amount_paid: newPaid,
            amount_due: newDue,
            status: newStatus,
            paid_at: newDue <= 0 ? new Date().toISOString() : undefined,
            payment_intent_id: cs.payment_intent as string,
            updated_at: new Date().toISOString(),
          }).eq("id", invoiceId);

          const contact = inv.contacts as any;
          const biz = inv.businesses as any;
          if (contact?.email) {
            await sendEmail({
              to: contact.email,
              subject: `Payment confirmed — Invoice ${inv.invoice_number}`,
              html: paymentConfirmEmail(contact.full_name ?? "Customer", biz?.name ?? "your contractor", inv.invoice_number, fmt(amountPaid)),
            });
          }
        }
        break;
      }

      // Subscription mode
      const businessId = cs.metadata?.businessId;
      const subscriptionId = cs.subscription as string;
      if (!businessId) break;
      await supabase.from("businesses").update({ stripe_customer_id: customerId }).eq("id", businessId);
      await supabase.from("subscriptions").upsert(
        { business_id: businessId, stripe_customer_id: customerId, stripe_subscription_id: subscriptionId, status: "active", updated_at: new Date().toISOString() },
        { onConflict: "business_id" }
      );
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const item = sub.items.data[0];
      const priceId = item?.price.id;
      const plan = planForPriceId(priceId ?? "");
      const [planName, cycle] = plan.split("_");
      const rawPeriodEnd = (sub as any).current_period_end ?? (item as any)?.current_period_end;
      const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null;
      const businessId = sub.metadata?.businessId;
      const row = {
        plan: planName,
        billing_cycle: cycle === "yearly" ? "yearly" : "monthly",
        stripe_price_id: priceId,
        status: sub.status,
        current_period_end: periodEnd,
        cancel_at_period_end: (sub as any).cancel_at_period_end ?? false,
        renews_at: periodEnd,
        updated_at: new Date().toISOString(),
      };
      if (businessId) {
        // Upsert by business so the first event works even if checkout.session.completed
        // hasn't stored the subscription id yet
        await supabase.from("subscriptions").upsert({
          ...row,
          business_id: businessId,
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
        }, { onConflict: "business_id" });
      } else {
        await supabase.from("subscriptions").update(row).eq("stripe_subscription_id", sub.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await supabase.from("subscriptions").update({
        status: "cancelled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    case "invoice.payment_failed": {
      const inv = event.data.object;
      const subscriptionId = (inv as any).subscription as string;
      if (subscriptionId) {
        await supabase.from("subscriptions").update({ status: "past_due", updated_at: new Date().toISOString() }).eq("stripe_subscription_id", subscriptionId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
