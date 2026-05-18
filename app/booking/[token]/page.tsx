"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Calendar, Clock, MapPin, User, Mail, Phone, CheckCircle, Loader2 } from "lucide-react";

export default function PublicBookingPage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"info"|"slots"|"confirm"|"success">("info");
  const [guest, setGuest] = useState({ name: "", email: "", phone: "", message: "" });
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/public/booking/${token}`)
      .then(r => {
        if (!r.ok) return r.json().then(d => { throw new Error(d.message); });
        return r.json();
      })
      .then(d => {
        setData(d);
        if (d.link.contact) {
          setGuest(p => ({ ...p, name: d.link.contact.full_name ?? "", email: d.link.contact.email ?? "", phone: d.link.contact.phone ?? "" }));
          setStep("slots");
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const book = async () => {
    if (!selectedSlot) return;
    if (!guest.name.trim() || !guest.email.trim()) return;
    setBooking(true);
    const res = await fetch(`/api/public/booking/${token}/select-slot`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot_id: selectedSlot, guest_name: guest.name, guest_email: guest.email, guest_phone: guest.phone, guest_message: guest.message }),
    });
    const d = await res.json();
    setBooking(false);
    if (res.ok) { setBooked(d.meeting); setStep("success"); }
    else setError(d.message ?? "Booking failed. Please try again.");
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#123B5D]" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar size={24} className="text-red-500" />
        </div>
        <h2 className="text-[18px] font-bold text-[#1f2937] mb-2">Link unavailable</h2>
        <p className="text-[14px] text-[#6b7280]">{error}</p>
      </div>
    </div>
  );

  if (step === "success") return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center card p-8">
        <CheckCircle size={48} className="text-[#3FA66B] mx-auto mb-4" />
        <h2 className="text-[20px] font-bold text-[#1f2937] mb-2">Meeting Confirmed!</h2>
        <p className="text-[14px] text-[#6b7280] mb-4">
          A confirmation email has been sent to <strong>{guest.email}</strong>.
        </p>
        <div className="text-[13px] text-[#374151] bg-[#f3f4f6] rounded-xl p-4">
          <p className="font-semibold">{data?.link?.title}</p>
          <p className="text-[#6b7280] mt-1">From {data?.business?.name}</p>
        </div>
      </div>
    </div>
  );

  const selectedSlotData = data?.slots?.find((s: any) => s.id === selectedSlot);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-[#123B5D] text-white px-4 py-5 text-center">
        <p className="text-[13px] text-white/70 mb-1">{data?.business?.name}</p>
        <h1 className="text-[20px] font-bold">{data?.link?.title}</h1>
        {data?.link?.purpose && <p className="text-[14px] text-white/80 mt-1">{data.link.purpose}</p>}
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 mt-4">
        {data?.link?.message_to_recipient && (
          <div className="bg-[#f0fdf4] border border-green-200 rounded-xl px-4 py-3 text-[14px] text-[#374151]">
            {data.link.message_to_recipient}
          </div>
        )}

        {/* Step: Contact Info (if no pre-selected contact) */}
        {step === "info" && (
          <div className="card p-5">
            <h2 className="font-semibold text-[16px] text-[#1f2937] mb-4">Your Information</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Full Name *</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input className="field pl-9" placeholder="Your name" value={guest.name} onChange={e => setGuest(p=>({...p,name:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input type="email" className="field pl-9" placeholder="your@email.com" value={guest.email} onChange={e => setGuest(p=>({...p,email:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="label">Phone (optional)</label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                  <input type="tel" className="field pl-9" placeholder="+1 (555) 000-0000" value={guest.phone} onChange={e => setGuest(p=>({...p,phone:e.target.value}))} />
                </div>
              </div>
              <button
                className="w-full py-3 rounded-xl font-semibold text-white text-[14px] transition-colors"
                style={{ background: "#123B5D" }}
                disabled={!guest.name.trim() || !guest.email.trim()}
                onClick={() => setStep("slots")}>
                Continue to Select Time
              </button>
            </div>
          </div>
        )}

        {/* Step: Select Slot */}
        {step === "slots" && (
          <div className="card p-5">
            <h2 className="font-semibold text-[16px] text-[#1f2937] mb-1">Select a Time</h2>
            <p className="text-[13px] text-[#6b7280] mb-4">{data?.slots?.length} slot(s) available</p>
            {data?.slots?.length === 0 ? (
              <p className="text-[14px] text-[#6b7280] text-center py-6">No available slots at this time.</p>
            ) : (
              <div className="space-y-2">
                {data.slots.map((slot: any) => (
                  <button key={slot.id}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedSlot === slot.id
                        ? "border-[#123B5D] bg-[#f0f5ff]"
                        : "border-[#e5e7eb] bg-white hover:border-[#c7d2fe]"
                    }`}>
                    <div className="flex items-start gap-3">
                      <Calendar size={16} className={selectedSlot === slot.id ? "text-[#123B5D] mt-0.5" : "text-[#6b7280] mt-0.5"} />
                      <div>
                        <p className={`font-semibold text-[14px] ${selectedSlot === slot.id ? "text-[#123B5D]" : "text-[#1f2937]"}`}>{slot.slot_date}</p>
                        <div className="flex flex-wrap gap-3 mt-0.5">
                          {slot.start_time && (
                            <span className="text-[12px] text-[#6b7280] flex items-center gap-1">
                              <Clock size={11} />{slot.start_time}{slot.end_time ? ` – ${slot.end_time}` : ""}
                            </span>
                          )}
                          {slot.meeting_type && <span className="text-[12px] text-[#6b7280]">{slot.meeting_type}</span>}
                          {slot.location && <span className="text-[12px] text-[#6b7280] flex items-center gap-1"><MapPin size={11} />{slot.location}</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedSlot && (
              <div className="mt-4">
                <div>
                  <label className="label">Message (optional)</label>
                  <textarea className="field" rows={2} placeholder="Any additional details…" value={guest.message} onChange={e => setGuest(p=>({...p,message:e.target.value}))} />
                </div>
                <button
                  className="w-full py-3 rounded-xl font-semibold text-white text-[14px] mt-3 transition-colors flex items-center justify-center gap-2"
                  style={{ background: "#3FA66B" }}
                  onClick={book}
                  disabled={booking}>
                  {booking ? <><Loader2 size={16} className="animate-spin" /> Booking…</> : "Confirm Booking"}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-[#9ca3af] pb-4">Powered by Clear Build USA</p>
      </div>
    </div>
  );
}
