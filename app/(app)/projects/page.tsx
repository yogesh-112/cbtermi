"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Briefcase } from "lucide-react";
import { StatusBadge, Modal, EmptyState, toast } from "@/components/ui";
import { fmt, fmtDate } from "@/lib/utils";

const EMPTY = { name:"", contact_id:"", project_type:"", address:"", start_date:"", end_date:"", status:"active", description:"", budget:"" };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");

  const load=()=>{ setLoading(true); const q=filter?`?status=${filter}`:""; fetch(`/api/projects${q}`).then(r=>r.json()).then(d=>setProjects(d.projects??[])).finally(()=>setLoading(false)); };
  useEffect(()=>{ load(); },[filter]);
  useEffect(()=>{ fetch("/api/contacts").then(r=>r.json()).then(d=>setContacts(d.contacts??[])); },[]);

  const set=(k:keyof typeof form)=>(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>)=>setForm({...form,[k]:e.target.value});
  const save=async()=>{
    if(!form.name.trim()){ toast("Project name required","error"); return; }
    setSaving(true);
    const res=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,budget:form.budget?parseFloat(form.budget):null})});
    setSaving(false);
    if(res.ok){ toast("Project created"); setModal(false); setForm(EMPTY); load(); }
    else toast("Failed","error");
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Projects</h1>
        <button className="btn-green btn" onClick={()=>setModal(true)}><Plus size={16}/> New Project</button>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {["","active","on_hold","completed","cancelled"].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} className={`btn btn-sm ${filter===s?"btn-primary":"btn-ghost"}`}>{s||"All"}</button>
        ))}
      </div>
      <div className="table-wrapper">
        <table className="table-base">
          <thead><tr><th>Project</th><th className="hidden md:table-cell">Contact</th><th className="hidden lg:table-cell">Budget</th><th>Status</th><th className="hidden lg:table-cell">Start</th><th>Actions</th></tr></thead>
          <tbody>
            {loading?<tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading…</td></tr>
            :projects.length===0?<tr><td colSpan={6}><EmptyState icon={<Briefcase size={40}/>} title="No projects yet" description="Create your first project."/></td></tr>
            :projects.map(p=>(
              <tr key={p.id}>
                <td><Link href={`/projects/${p.id}`} className="font-medium text-brand-navy hover:underline">{p.name}</Link><p className="text-xs text-slate-400">{p.project_number}</p></td>
                <td className="hidden md:table-cell text-slate-500">{p.contacts?.full_name||"—"}</td>
                <td className="hidden lg:table-cell">{p.budget?fmt(p.budget):"—"}</td>
                <td><StatusBadge status={p.status}/></td>
                <td className="hidden lg:table-cell text-slate-500 text-xs">{fmtDate(p.start_date)}</td>
                <td><Link href={`/projects/${p.id}`} className="btn-outline btn btn-sm">View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title="New Project" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Project name *</label><input value={form.name} onChange={set("name")} placeholder="Kitchen Remodel" className="field"/></div>
          <div><label className="label">Contact</label>
            <select value={form.contact_id} onChange={set("contact_id")} className="field">
              <option value="">No contact</option>{contacts.map(c=><option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </div>
          <div><label className="label">Project type</label><input value={form.project_type} onChange={set("project_type")} placeholder="Remodel, Repair, etc." className="field"/></div>
          <div><label className="label">Budget</label><input type="number" step="0.01" value={form.budget} onChange={set("budget")} placeholder="0.00" className="field"/></div>
          <div><label className="label">Start date</label><input type="date" value={form.start_date} onChange={set("start_date")} className="field"/></div>
          <div><label className="label">Estimated end date</label><input type="date" value={form.end_date} onChange={set("end_date")} className="field"/></div>
          <div><label className="label">Status</label>
            <select value={form.status} onChange={set("status")} className="field">
              <option value="active">Active</option><option value="on_hold">On Hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div><label className="label">Address</label><input value={form.address} onChange={set("address")} className="field"/></div>
          <div className="md:col-span-2"><label className="label">Description</label><textarea value={form.description} onChange={set("description")} rows={2} className="field resize-none"/></div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button className="btn-ghost btn" onClick={()=>setModal(false)}>Cancel</button>
          <button className="btn-green btn" onClick={save} disabled={saving}>{saving?"Saving…":"Create Project"}</button>
        </div>
      </Modal>
    </div>
  );
}
