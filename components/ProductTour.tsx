"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, ChevronRight, ChevronLeft, SkipForward, CheckCircle, Sparkles } from "lucide-react";

const TOUR_STEPS = [
  { step: 1,  href: "/dashboard",     title: "Dashboard",           desc: "Your command center. See outstanding invoices, pending quotes, active projects, pipeline value, and real-time pending actions. Everything that needs your attention — in one place.", action: "Check your pending actions" },
  { step: 2,  href: "/contacts",      title: "Contacts & Leads",    desc: "Store every lead, customer, and contact here. Track lead status, heat score, and source. Convert leads to customers when they're ready to move forward.", action: "Add your first lead or contact" },
  { step: 3,  href: "/opportunities", title: "Opportunities",       desc: "Track your sales pipeline with Opportunities. Move prospects from Open → Qualified → Quoted → Won. See your total pipeline value and win rate at a glance.", action: "Create your first opportunity" },
  { step: 4,  href: "/quotes",        title: "Quotes & Change Orders", desc: "Build professional quotes with line items and taxes. Customers can approve online — no login needed. Use Change Orders to capture scope changes with full approval proof.", action: "Create your first quote" },
  { step: 5,  href: "/projects",      title: "Projects",            desc: "Link quotes, invoices, and team updates to projects. Track milestones, assign tasks, add team members, and monitor progress all in one place.", action: "Create a project" },
  { step: 6,  href: "/expenses",      title: "Expenses",            desc: "Track job costs, materials, subcontractor payments, and business expenses. Link expenses to projects for real profitability visibility. Filter and analyze by category.", action: "Log your first expense" },
  { step: 7,  href: "/invoices",      title: "Invoices",            desc: "Send professional invoices and track what's paid, outstanding, and overdue. Record partial payments and see the running balance on every invoice.", action: "Create an invoice" },
  { step: 8,  href: "/payments",      title: "Payments",            desc: "Record all incoming payments by method — cash, check, bank transfer, card. View daily receipts and reconcile what's been received against invoices.", action: "Record a payment" },
  { step: 9,  href: "/scheduling",    title: "Scheduling",          desc: "Create available time slots and share booking links with contacts. When a customer books, you both receive confirmation emails automatically.", action: "Create an availability slot" },
  { step: 10, href: "/notifications", title: "Notifications & Automation", desc: "Send messages via Email, SMS, or WhatsApp using reusable templates. Set up automation rules in Settings to trigger notifications on key events automatically.", action: "Send a notification" },
  { step: 11, href: "/team",          title: "Team",                desc: "Invite team members with role-based access. Owners have full access — assign Managers, Staff, and Crew with the right permissions for each person.", action: "Invite a team member" },
  { step: 12, href: "/settings",      title: "Settings",            desc: "Configure your business profile, logo, tax rates, numbering, payment terms, notification automation rules, email templates, integrations, and language preferences.", action: "Complete your business profile" },
  { step: 13, href: "/help",          title: "Help & Support",      desc: "Browse FAQs, watch video tutorials, troubleshoot common issues, or raise a support ticket. You can replay this tour anytime from the Help page.", action: "You're all set! 🎉" },
];

export default function ProductTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/tour/status")
      .then(r => r.json())
      .then(d => {
        if (!d.tour || d.tour.status === "not_started") {
          setTimeout(() => setShow(true), 1500);
        }
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const saveTour = (status: "skipped" | "completed") => {
    fetch("/api/tour/status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, completed_steps: TOUR_STEPS.slice(0, step + 1).map(s => s.step) }),
    });
  };

  const skip = () => { saveTour("skipped"); setShow(false); };
  const finish = () => { saveTour("completed"); setShow(false); };

  const next = () => {
    if (step < TOUR_STEPS.length - 1) {
      const nextStep = TOUR_STEPS[step + 1];
      if (pathname !== nextStep.href) router.push(nextStep.href);
      setStep(s => s + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) {
      const prevStep = TOUR_STEPS[step - 1];
      if (pathname !== prevStep.href) router.push(prevStep.href);
      setStep(s => s - 1);
    }
  };

  const goToStep = (s: number) => {
    const target = TOUR_STEPS[s];
    if (pathname !== target.href) router.push(target.href);
    setStep(s);
  };

  if (!show || !ready) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const progress = ((step + 1) / TOUR_STEPS.length) * 100;

  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-modal max-w-sm w-full p-6 animate-scale-in">
          <div className="w-12 h-12 bg-[#123B5D] rounded-full flex items-center justify-center mb-4">
            <Sparkles size={22} className="text-white" />
          </div>
          <h2 className="text-[20px] font-bold text-[#1f2937] mb-2">Welcome to Clear Build USA!</h2>
          <p className="text-[14px] text-[#6b7280] leading-relaxed mb-5">
            Let us give you a quick tour of the key features. It only takes a minute and you can skip any time.
          </p>
          <div className="flex gap-2">
            <button className="btn btn-outline flex-1" onClick={skip}>Skip tour</button>
            <button className="flex-1 py-2.5 rounded-xl bg-[#123B5D] text-white font-semibold text-[14px] hover:bg-[#0f2e4a] transition-colors" onClick={() => setStep(1)}>
              Start Tour →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 lg:bottom-6 lg:left-auto lg:translate-x-0 lg:right-6">
      <div className="bg-white rounded-2xl shadow-modal border border-[#e5e7eb] overflow-hidden animate-slide-in-bottom">
        {/* Progress bar */}
        <div className="h-1 bg-[#f3f4f6]">
          <div className="h-full bg-[#123B5D] transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-[#123B5D] bg-[#f0f5ff] px-2 py-0.5 rounded-full">
                  Step {step} of {TOUR_STEPS.length - 1}
                </span>
              </div>
              <h3 className="font-bold text-[15px] text-[#1f2937]">{current.title}</h3>
            </div>
            <button onClick={skip} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-[#6b7280] hover:bg-[#f3f4f6] transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>

          <p className="text-[13px] text-[#6b7280] leading-relaxed mb-3">{current.desc}</p>

          <div className="flex items-center gap-1 mb-4">
            <CheckCircle size={13} className="text-[#3FA66B]" />
            <span className="text-[12px] text-[#374151] font-medium">{current.action}</span>
          </div>

          {/* Step dots */}
          <div className="flex items-center gap-1 mb-3 justify-center">
            {TOUR_STEPS.slice(1).map((_, i) => (
              <button key={i} onClick={() => goToStep(i + 1)}
                className={`rounded-full transition-all ${
                  i + 1 === step ? "w-4 h-2 bg-[#123B5D]" : i + 1 < step ? "w-2 h-2 bg-[#3FA66B]" : "w-2 h-2 bg-[#e5e7eb] hover:bg-[#d1d5db]"
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {step > 1 && (
              <button onClick={prev} className="btn btn-outline btn-sm flex-1">
                <ChevronLeft size={13} /> Back
              </button>
            )}
            <button onClick={skip} className="btn btn-ghost btn-sm">
              <SkipForward size={13} /> Skip
            </button>
            <button onClick={next} className={`btn btn-sm flex-1 ${isLast ? "btn-primary" : "btn-primary"}`}>
              {isLast ? <><CheckCircle size={13} /> Finish</> : <>Next <ChevronRight size={13} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
