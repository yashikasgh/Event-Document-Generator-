import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, LoaderCircle, Palette, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

const stylePresets = ["Minimal Modern", "Festive College", "Clean Corporate", "Bold Youth"];

const FlyerGenerator = () => {
  const [formData, setFormData] = useState({
    clubName: "",
    theme: "",
    style: stylePresets[0],
    eventTitle: "",
    date: "",
    venue: "",
    details: "",
    contactNumbers: "",
    summary: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ prompt?: string; creativeBrief?: string; message?: string; status?: string } | null>(null);
  const [status, setStatus] = useState("");

  const update = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const generateFlyer = async () => {
    setIsGenerating(true);
    setStatus("");

    try {
      const response = await api.generateFlyer({
        ...formData,
        contactNumbers: formData.contactNumbers
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setResult(response);
      setStatus(response.status === "mocked" ? "Prompt generated. Add a Gemini API key to get live model output." : "Flyer prompt prepared successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to prepare flyer prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.header className="mb-8 flex items-center justify-between" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="brutal-btn-outline flex items-center gap-1 px-3 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Back
          </Link>
          <h1 className="text-xl font-bold uppercase tracking-tight">Flyer Generator</h1>
        </div>
        <button onClick={generateFlyer} className="brutal-btn-primary flex items-center gap-2 py-2" disabled={isGenerating}>
          {isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} /> : <Sparkles className="h-4 w-4" strokeWidth={3} />}
          Build Prompt
        </button>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div className="space-y-4" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Club Name</label>
            <input className="brutal-input" value={formData.clubName} onChange={(event) => update("clubName", event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Theme</label>
              <input className="brutal-input" value={formData.theme} onChange={(event) => update("theme", event.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Style</label>
              <select className="brutal-input" value={formData.style} onChange={(event) => update("style", event.target.value)}>
                {stylePresets.map((preset) => (
                  <option key={preset} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Event Title</label>
            <input className="brutal-input" value={formData.eventTitle} onChange={(event) => update("eventTitle", event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Date</label>
              <input className="brutal-input" value={formData.date} onChange={(event) => update("date", event.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Venue</label>
              <input className="brutal-input" value={formData.venue} onChange={(event) => update("venue", event.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Contact Numbers</label>
            <input className="brutal-input" placeholder="9876543210, 9123456780" value={formData.contactNumbers} onChange={(event) => update("contactNumbers", event.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Details</label>
            <textarea className="brutal-input min-h-[110px] resize-y" value={formData.details} onChange={(event) => update("details", event.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Short Summary</label>
            <textarea className="brutal-input min-h-[90px] resize-y" value={formData.summary} onChange={(event) => update("summary", event.target.value)} />
          </div>
          {status ? <p className="font-mono text-xs text-muted-foreground">{status}</p> : null}
        </motion.div>

        <motion.div className="space-y-6" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="brutal-card">
            <div className="flex items-center gap-3">
              <div className="brutal-border flex h-10 w-10 items-center justify-center bg-primary">
                <Palette className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Prompt Builder</p>
                <p className="text-sm text-muted-foreground">This backend route turns form data into a Gemini-ready flyer generation prompt.</p>
              </div>
            </div>
          </div>

          <div className="brutal-card min-h-[420px] space-y-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Generated Prompt</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{result?.prompt || "Submit the flyer details to get a production-ready prompt for Gemini image generation."}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">Creative Brief</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{result?.creativeBrief || result?.message || "When a Gemini API key is configured, the backend also produces a concise creative brief to feed into the image pipeline."}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FlyerGenerator;
