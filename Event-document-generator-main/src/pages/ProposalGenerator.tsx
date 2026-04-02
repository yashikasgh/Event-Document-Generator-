import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, Calendar, Building2, Users, MapPin } from "lucide-react";

interface ProposalData {
  eventName: string;
  organizer: string;
  date: string;
  venue: string;
  authority: string;
  budget: string;
  objective: string;
  description: string;
}

const emptyProposal: ProposalData = {
  eventName: "",
  organizer: "",
  date: "",
  venue: "",
  authority: "",
  budget: "",
  objective: "",
  description: "",
};

const ProposalPreview = ({ data }: { data: ProposalData }) => {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-card brutal-border p-8 min-h-[600px] font-sans text-sm leading-relaxed">
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b-2 border-foreground">
        <div className="w-12 h-12 bg-primary brutal-border mx-auto mb-3 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-bold uppercase tracking-tight">
          Event Proposal
        </h2>
        <p className="font-mono text-xs text-muted-foreground mt-1">{today}</p>
      </div>

      {/* Title */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold uppercase">
          {data.eventName || (
            <span className="text-muted-foreground/40">Event Name</span>
          )}
        </h3>
        <div className="h-1 w-16 bg-secondary mt-2" />
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="brutal-border p-3 bg-muted/30">
          <p className="font-mono text-xs text-muted-foreground uppercase">Organizer</p>
          <p className="font-bold mt-1">
            {data.organizer || <span className="text-muted-foreground/40">—</span>}
          </p>
        </div>
        <div className="brutal-border p-3 bg-muted/30">
          <p className="font-mono text-xs text-muted-foreground uppercase">Date</p>
          <p className="font-bold mt-1">
            {data.date || <span className="text-muted-foreground/40">—</span>}
          </p>
        </div>
        <div className="brutal-border p-3 bg-muted/30">
          <p className="font-mono text-xs text-muted-foreground uppercase">Venue</p>
          <p className="font-bold mt-1">
            {data.venue || <span className="text-muted-foreground/40">—</span>}
          </p>
        </div>
        <div className="brutal-border p-3 bg-muted/30">
          <p className="font-mono text-xs text-muted-foreground uppercase">Budget</p>
          <p className="font-bold mt-1">
            {data.budget ? `₹${data.budget}` : <span className="text-muted-foreground/40">—</span>}
          </p>
        </div>
      </div>

      {/* Authority */}
      <div className="mb-6">
        <p className="font-mono text-xs text-muted-foreground uppercase mb-1">
          Submitted To
        </p>
        <p className="font-bold text-base">
          {data.authority || (
            <span className="text-muted-foreground/40">Authority Name</span>
          )}
        </p>
      </div>

      {/* Objective */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-accent brutal-border flex items-center justify-center">
            <span className="text-accent-foreground text-xs font-bold">01</span>
          </div>
          <h4 className="font-bold uppercase text-sm">Objective</h4>
        </div>
        <p className="text-muted-foreground pl-8">
          {data.objective || (
            <span className="text-muted-foreground/30 italic">
              Describe the main objective of this event...
            </span>
          )}
        </p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-primary brutal-border flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">02</span>
          </div>
          <h4 className="font-bold uppercase text-sm">Description</h4>
        </div>
        <p className="text-muted-foreground pl-8 whitespace-pre-wrap">
          {data.description || (
            <span className="text-muted-foreground/30 italic">
              Provide a detailed description of the event, including activities,
              schedule, and expected outcomes...
            </span>
          )}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-10 pt-4 border-t-2 border-foreground flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-8 bg-primary" />
          <div className="h-3 w-5 bg-secondary" />
          <div className="h-3 w-3 bg-accent" />
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          Generated by DocuPrint
        </p>
      </div>
    </div>
  );
};

const ProposalGenerator = () => {
  const [data, setData] = useState<ProposalData>(emptyProposal);

  const update = (field: keyof ProposalData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExport = () => {
    const content = `
EVENT PROPOSAL
==============
Event: ${data.eventName}
Organizer: ${data.organizer}
Date: ${data.date}
Venue: ${data.venue}
Authority: ${data.authority}
Budget: ₹${data.budget}

OBJECTIVE
${data.objective}

DESCRIPTION
${data.description}

---
Generated by DocuPrint
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.eventName || "proposal"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fields: {
    key: keyof ProposalData;
    label: string;
    icon: typeof FileText;
    placeholder: string;
    textarea?: boolean;
  }[] = [
    { key: "eventName", label: "Event Name", icon: FileText, placeholder: "Annual Tech Symposium" },
    { key: "organizer", label: "Organizer", icon: Building2, placeholder: "Computer Science Dept." },
    { key: "date", label: "Date", icon: Calendar, placeholder: "March 15, 2026" },
    { key: "venue", label: "Venue", icon: MapPin, placeholder: "Main Auditorium" },
    { key: "authority", label: "Submitted To", icon: Users, placeholder: "Dr. Principal" },
    { key: "budget", label: "Budget (₹)", icon: FileText, placeholder: "25000" },
    { key: "objective", label: "Objective", icon: FileText, placeholder: "To promote awareness...", textarea: true },
    { key: "description", label: "Description", icon: FileText, placeholder: "This event will feature...", textarea: true },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      {/* Header */}
      <motion.header
        className="flex items-center justify-between mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <a href="/dashboard" className="brutal-btn-outline py-2 px-3 flex items-center gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" strokeWidth={3} />
            Back
          </a>
          <h1 className="text-xl font-bold uppercase tracking-tight">Proposal Generator</h1>
        </div>
        <button onClick={handleExport} className="brutal-btn-primary flex items-center gap-2 py-2">
          <Download className="w-4 h-4" strokeWidth={3} />
          Export
        </button>
      </motion.header>

      {/* Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <motion.div
          className="space-y-4"
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="brutal-border bg-muted/30 p-1.5 inline-block mb-2">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Input Fields
            </span>
          </div>
          {fields.map((f) => (
            <div key={f.key}>
              <label className="font-bold text-xs uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <f.icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                {f.label}
              </label>
              {f.textarea ? (
                <textarea
                  className="brutal-input min-h-[100px] resize-y"
                  placeholder={f.placeholder}
                  value={data[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className="brutal-input"
                  placeholder={f.placeholder}
                  value={data[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </motion.div>

        {/* Right: Live Preview */}
        <motion.div
          className="sticky top-6"
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="brutal-border bg-muted/30 p-1.5 inline-block mb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Live Preview
            </span>
          </div>
          <div className="max-h-[80vh] overflow-y-auto">
            <ProposalPreview data={data} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProposalGenerator;

import { supabase } from "@/lib/supabase"

async function saveEvent() {
  const { data, error } = await supabase.from("events").insert([
    {
      event_name: "Tech Fest",
      date: "2026-04-10",
      venue: "Auditorium",
      total_budget: 5000,
      total_attendees: 100
    }
  ])

  console.log(data, error)
}

<button onClick={saveEvent}>
  Save Event
</button>