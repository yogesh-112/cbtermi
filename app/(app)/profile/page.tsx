"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, Phone, Briefcase, DollarSign, Star, Clock, Edit2 } from "lucide-react";

const RECENT_WORK_COLORS = [
  "from-[#1a2f5a] to-[#2453E4]",
  "from-[#0f4c2a] to-[#3FA66B]",
  "from-[#4c1d95] to-[#7C3AED]",
  "from-[#92400e] to-[#D97706]",
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(d => setUser(d.user))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-[920px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-7 w-28 skeleton rounded mb-2" />
            <div className="h-4 w-56 skeleton rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
          <div className="card h-64 skeleton animate-pulse" />
          <div className="space-y-4">
            <div className="card h-36 skeleton animate-pulse" />
            <div className="card h-28 skeleton animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return (
    <div className="max-w-[920px]">
      <h1 className="page-title">Profile</h1>
      <p className="text-sm text-[#8a8fa3] mt-2">Could not load profile. Please refresh the page.</p>
    </div>
  );

  const initials = user.full_name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const skills: string[] = user.skills ? (Array.isArray(user.skills) ? user.skills : user.skills.split(",").map((s: string) => s.trim()).filter(Boolean)) : [];

  return (
    <div className="max-w-[920px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-desc">How you appear to your team and customers.</p>
        </div>
        <Link href="/profile/edit" className="btn btn-primary btn-sm gap-1.5">
          <Edit2 size={13} /> Edit profile
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Left: Avatar card */}
        <div className="card p-5 flex flex-col items-center text-center">
          <div className="w-[88px] h-[88px] bg-brand-navy rounded-full flex items-center justify-center mb-4">
            <span className="text-white text-[28px] font-bold tracking-tight">{initials}</span>
          </div>
          <h2 className="font-bold text-[16px] text-[#0c1226] leading-snug">{user.full_name}</h2>
          {(user.role || user.display_name) && (
            <p className="text-[12px] text-[#8a8fa3] mt-1">
              {user.role}{user.display_name ? ` · ${user.display_name}` : ""}
            </p>
          )}
          {user.role && (
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-green/10 text-brand-green capitalize">
              {user.role}
            </span>
          )}

          {/* Contact */}
          <div className="mt-5 w-full border-t border-[#f0efea] pt-4 text-left space-y-2">
            <p className="text-[10px] font-semibold text-[#8a8fa3] uppercase tracking-wider">Contact</p>
            {user.email && (
              <div className="flex items-center gap-2 text-[12px] text-[#4a5168]">
                <Mail size={12} className="flex-shrink-0 text-[#8a8fa3]" />
                <span className="truncate">{user.email}</span>
              </div>
            )}
            {user.phone && (
              <div className="flex items-center gap-2 text-[12px] text-[#4a5168]">
                <Phone size={12} className="flex-shrink-0 text-[#8a8fa3]" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Stats + About + Recent work */}
        <div className="space-y-4">
          {/* Activity stats */}
          <div className="card p-5">
            <p className="text-[13px] font-semibold text-[#0c1226] mb-4">Activity</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] text-[#8a8fa3] mb-1">Projects led</p>
                <p className="text-[22px] font-bold text-[#0c1226]">—</p>
                <p className="text-[11px] text-[#8a8fa3]">YTD</p>
              </div>
              <div>
                <p className="text-[11px] text-[#8a8fa3] mb-1">Revenue</p>
                <p className="text-[22px] font-bold text-[#0c1226]">—</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-brand-green rounded-full" />
                  <span className="text-[11px] text-[#8a8fa3]">YTD</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#8a8fa3] mb-1">Avg satisfaction</p>
                <p className="text-[22px] font-bold text-[#0c1226]">—</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <span className="text-[11px] text-[#8a8fa3]">— reviews</span>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-[#8a8fa3] mb-1">Response time</p>
                <p className="text-[22px] font-bold text-[#0c1226]">—</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-[#2453E4] rounded-full" />
                  <span className="text-[11px] text-[#8a8fa3]">customer chat</span>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="card p-5">
            <p className="text-[13px] font-semibold text-[#0c1226] mb-3">About</p>
            {user.about ? (
              <p className="text-[13px] text-[#4a5168] leading-relaxed mb-3">{user.about}</p>
            ) : (
              <p className="text-[13px] text-[#8a8fa3] italic mb-3">No bio added yet. <Link href="/profile/edit" className="text-brand-navy hover:underline">Add one</Link></p>
            )}
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#f0efea] text-[#4a5168] text-[12px] font-medium rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Recent work */}
          <div className="card p-5">
            <p className="text-[13px] font-semibold text-[#0c1226] mb-3">Recent work</p>
            <div className="grid grid-cols-4 gap-2">
              {RECENT_WORK_COLORS.map((grad, i) => (
                <div key={i} className={`bg-gradient-to-br ${grad} rounded-lg aspect-square flex items-end p-2`}>
                  <span className="text-white/60 text-[10px] font-medium">Photo {i + 1}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-[#8a8fa3] mt-3">
              Photos from completed projects will appear here.{" "}
              <Link href="/projects" className="text-brand-navy hover:underline">View projects</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
