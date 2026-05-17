"use client";
import { GitPullRequestDraft } from "lucide-react";

export default function ChangeOrdersPage() {
  return (
    <div>
      <h1 className="page-title mb-1">Change Orders</h1>
      <p className="page-desc mb-8">Track and manage change orders for your projects</p>
      <div className="card p-12 text-center max-w-md mx-auto">
        <div className="w-14 h-14 bg-[#f0efea] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <GitPullRequestDraft size={24} className="text-[#8a8fa3]" />
        </div>
        <p className="font-semibold text-[#0c1226] mb-1">Change Orders coming soon</p>
        <p className="text-[13px] text-[#8a8fa3]">
          Create and track change orders tied to projects, send for customer approval, and convert to invoices.
        </p>
      </div>
    </div>
  );
}
