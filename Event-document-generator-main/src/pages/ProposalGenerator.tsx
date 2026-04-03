import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileText, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { api, downloadBase64Pdf } from "@/lib/api";

interface ProposalData {
  collegeName: string;
  collegeAddress: string;
  clubName: string;
  authorityName: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  subject: string;
  targetAudience: string;
  budget: string;
  objective: string;
  eventSummary: string;
  keyPoints: string;
}

const initialState: ProposalData = {
  collegeName: "",
  collegeAddress: "",
  clubName: "",
  authorityName: "",
  eventTitle: "",
  eventDate: "",
  venue: "",
  subject: "",
  targetAudience: "",
  budget: "",
  objective: "",
  eventSummary: "",
  keyPoints: "",
};

const ProposalGenerator = () => {
  const [data, setData] = useState<ProposalData>(initialState);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFile, setGeneratedFile] = useState<{ fileName: string; pdfBase64: string } | null>(null);
  const [status, setStatus] = useState("");

  const update = (field: keyof ProposalData, value: string) => {
    setData((previous) => ({ ...previous, [field]: value }));
  };

  const generateProposal = async () => {
    setIsGenerating(true);
    setStatus("");

    try {
      const response = await api.generateProposal({
        ...data,
        keyPoints: data.keyPoints
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setGeneratedFile(response);
      setStatus("Proposal PDF generated successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to generate proposal.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedFile) {
      return;
    }

    downloadBase64Pdf(generatedFile.pdfBase64, generatedFile.fileName);
  };

  const previewRows = [
    ["College", data.collegeName || "College Name"],
    ["Club", data.clubName || "Club Name"],
    ["Authority", data.authorityName || "Authority Name"],
    ["Date", data.eventDate || "Event date"],
    ["Venue", data.venue || "Venue"],
    ["Budget", data.budget ? `Rs. ${data.budget}` : "Not set"],
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.header className="mb-8 flex items-center justify-between" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="brutal-btn-outline flex items-center gap-1 px-3 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Back
          </Link>
          <h1 className="text-xl font-bold uppercase tracking-tight">Proposal Generator</h1>
        </div>
        <div className="flex gap-3">
          <button onClick={generateProposal} className="brutal-btn-primary flex items-center gap-2 py-2" disabled={isGenerating}>
            {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} /> : <FileText className="h-4 w-4" strokeWidth={3} />}
            Generate PDF
          </button>
          <button onClick={handleDownload} className="brutal-btn-secondary flex items-center gap-2 py-2" disabled={!generatedFile}>
            <Download className="h-4 w-4" strokeWidth={3} />
            Download
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div className="space-y-4" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          {[
            ["collegeName", "College Name", "Pimpri Chinchwad College of Engineering"],
            ["collegeAddress", "College Address", "Nigdi, Pune, Maharashtra"],
            ["clubName", "Club Name", "Coding Club"],
            ["authorityName", "Addressed To", "The Principal"],
            ["eventTitle", "Event Title", "AI Innovation Summit"],
            ["subject", "Subject", "Proposal for AI Innovation Summit"],
            ["targetAudience", "Target Audience", "Second year and third year students"],
            ["venue", "Venue", "Seminar Hall A"],
            ["budget", "Estimated Budget", "35000"],
          ].map(([key, label, placeholder]) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">{label}</label>
              <input
                className="brutal-input"
                placeholder={placeholder}
                value={data[key as keyof ProposalData]}
                onChange={(event) => update(key as keyof ProposalData, event.target.value)}
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Event Date</label>
            <input className="brutal-input" type="date" value={data.eventDate} onChange={(event) => update("eventDate", event.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Objective</label>
            <textarea className="brutal-input min-h-[96px] resize-y" value={data.objective} onChange={(event) => update("objective", event.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Event Summary</label>
            <textarea className="brutal-input min-h-[120px] resize-y" value={data.eventSummary} onChange={(event) => update("eventSummary", event.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Key Points</label>
            <textarea
              className="brutal-input min-h-[100px] resize-y"
              placeholder={"One point per line\nExpected outcomes\nRequired approvals"}
              value={data.keyPoints}
              onChange={(event) => update("keyPoints", event.target.value)}
            />
          </div>
          {status ? <p className="font-mono text-xs text-muted-foreground">{status}</p> : null}
        </motion.div>

        <motion.div className="sticky top-6" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="brutal-card min-h-[620px] space-y-6">
            <div className="border-b-2 border-foreground pb-5">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Proposal Preview</p>
              <h2 className="mt-3 text-2xl font-bold uppercase">{data.eventTitle || "Event Proposal"}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{data.subject || "Generated subject line will appear here."}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {previewRows.map(([label, value]) => (
                <div key={label} className="brutal-border bg-muted/20 p-3">
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm font-bold">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Objective</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{data.objective || "State the event objective so the generated document can turn it into a formal proposal body."}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Summary</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{data.eventSummary || "Add the short event brief, audience, and what approval is needed."}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Key Points</p>
              <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                {data.keyPoints
                  .split("\n")
                  .map((item) => item.trim())
                  .filter(Boolean)
                  .map((item) => (
                    <p key={item}>- {item}</p>
                  ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProposalGenerator;
