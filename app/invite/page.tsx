"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, XCircle, Building2, UserPlus } from "lucide-react";

type State = "loading" | "found" | "not_found" | "expired" | "wrong_email" | "already_member" | "accepted" | "error";

interface InviteDetails {
  email: string;
  role: string;
  business_name: string;
  invited_by: string;
  expires_at: string | null;
}

function InviteContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [state, setState] = useState<State>("loading");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [me, setMe] = useState<{ email: string } | null>(null);

  useEffect(() => {
    if (!token) { setState("not_found"); return; }

    Promise.all([
      fetch(`/api/invite?token=${token}`),
      fetch("/api/auth/me"),
    ]).then(async ([ir, mr]) => {
      if (ir.status === 404) { setState("not_found"); return; }
      if (ir.status === 410) { setState("expired"); return; }
      if (!ir.ok) { setState("error"); return; }

      const id = await ir.json();
      setInvite(id.invitation);

      if (mr.ok) {
        const md = await mr.json();
        setMe(md);
      }

      setState("found");
    }).catch(() => setState("error"));
  }, [token]);

  const accept = async () => {
    setAccepting(true);
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setAccepting(false);

    if (res.ok) {
      setState("accepted");
      setTimeout(() => router.push("/dashboard"), 2000);
    } else {
      const d = await res.json();
      if (d.message?.includes("different email")) setState("wrong_email");
      else setState("error");
    }
  };

  const roleLabel = (r: string) => ({ owner: "Owner", manager: "Manager", staff: "Staff", viewer: "Viewer" }[r] ?? r);

  return (
    <div className="min-h-screen bg-[#f6f6f3] flex items-center justify-center p-4">
      <div className="bg-white border border-[#e7e6e1] rounded-[20px] shadow-card w-full max-w-md px-8 py-8 text-center">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Image src="/logo.png" alt="Clear Build USA" width={32} height={32} className="rounded-xl object-contain" />
          <div className="text-left">
            <h1 className="text-[15px] font-bold text-[#0c1226] leading-tight" style={{ letterSpacing: "-0.02em" }}>Clear Build USA</h1>
            <p className="text-xs text-[#8a8fa3]">Team Invitation</p>
          </div>
        </div>

        {state === "loading" && (
          <p className="text-[#4a5168]">Loading invitation…</p>
        )}

        {state === "not_found" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#0c1226] mb-2">Invitation not found</h2>
            <p className="text-[#4a5168] text-sm mb-6">This invitation link is invalid or has already been used.</p>
            <Link href="/login" className="btn btn-primary w-full">Go to Login</Link>
          </>
        )}

        {state === "expired" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#0c1226] mb-2">Invitation expired</h2>
            <p className="text-[#4a5168] text-sm mb-6">This invitation link has expired. Ask the business owner to send a new invite.</p>
            <Link href="/login" className="btn btn-primary w-full">Go to Login</Link>
          </>
        )}

        {state === "found" && invite && (
          <>
            <div className="w-16 h-16 bg-brand-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus size={28} className="text-brand-navy" />
            </div>
            <h2 className="text-xl font-bold text-[#0c1226] mb-2">You&apos;re invited!</h2>
            <p className="text-[#4a5168] text-sm mb-1">
              <span className="font-semibold text-[#0c1226]">{invite.invited_by}</span> invited you to join
            </p>
            <p className="text-brand-navy font-bold text-lg mb-1">{invite.business_name}</p>
            <p className="text-[#4a5168] text-sm mb-6">
              as <span className="font-semibold text-[#4a5168]">{roleLabel(invite.role)}</span>
            </p>

            {me ? (
              me.email.toLowerCase() === invite.email.toLowerCase() ? (
                <button onClick={accept} disabled={accepting} className="btn btn-primary w-full mb-3">
                  {accepting ? "Joining…" : `Accept Invitation`}
                </button>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800 mb-4 text-left">
                  This invitation was sent to <strong>{invite.email}</strong>.<br />
                  You&apos;re logged in as <strong>{me.email}</strong>.<br />
                  Please log in with the correct account.
                </div>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-[#4a5168] text-sm">Log in or register to accept this invitation.</p>
                <Link href={`/login?next=/invite%3Ftoken%3D${token}`} className="btn btn-primary w-full">
                  Log In to Accept
                </Link>
                <Link href={`/register?next=/invite%3Ftoken%3D${token}`} className="btn btn-outline w-full">
                  Create Account
                </Link>
              </div>
            )}
          </>
        )}

        {state === "accepted" && (
          <>
            <CheckCircle size={40} className="text-brand-green mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#0c1226] mb-2">Welcome aboard!</h2>
            <p className="text-[#4a5168] text-sm">You&apos;ve joined the business. Redirecting to dashboard…</p>
          </>
        )}

        {state === "wrong_email" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#0c1226] mb-2">Wrong account</h2>
            <p className="text-[#4a5168] text-sm mb-6">
              This invitation is for a different email address. Log out and log in with the correct account to accept.
            </p>
            <Link href="/login" className="btn btn-primary w-full">Log In</Link>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle size={40} className="text-red-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#0c1226] mb-2">Something went wrong</h2>
            <p className="text-[#4a5168] text-sm mb-6">Please try again or contact support.</p>
            <Link href="/login" className="btn btn-primary w-full">Go to Login</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function InvitePage() {
  return <Suspense><InviteContent /></Suspense>;
}
