import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calculator, LoaderCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

type BudgetItem = { label: string; quantity: string; unitCost: string };

const BudgetPlannerPage = () => {
  const [expectedAttendees, setExpectedAttendees] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [sponsorshipAmount, setSponsorshipAmount] = useState("");
  const [lineItems, setLineItems] = useState<BudgetItem[]>([{ label: "Venue", quantity: "1", unitCost: "0" }]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateItem = (index: number, key: keyof BudgetItem, value: string) => {
    setLineItems((previous) => previous.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  };

  const analyze = async () => {
    setIsLoading(true);
    setStatus("");

    try {
      const response = await api.analyzeBudget({
        expectedAttendees,
        durationHours,
        sponsorshipAmount,
        lineItems,
      });
      setResult(response);
      setStatus("Budget analysis generated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Budget analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const totals = result?.totals as { projectedTotalFormatted?: string; netBudgetFormatted?: string; costPerHeadFormatted?: string } | undefined;
  const insights = (result?.insights as string[] | undefined) || [];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.header className="mb-8 flex items-center justify-between" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="brutal-btn-outline flex items-center gap-1 px-3 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Back
          </Link>
          <h1 className="text-xl font-bold uppercase tracking-tight">Budget Estimation</h1>
        </div>
        <button onClick={analyze} className="brutal-btn-primary flex items-center gap-2 py-2" disabled={isLoading}>
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} /> : <Calculator className="h-4 w-4" strokeWidth={3} />}
          Analyze Budget
        </button>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Attendees</label>
              <input className="brutal-input" value={expectedAttendees} onChange={(event) => setExpectedAttendees(event.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Duration Hours</label>
              <input className="brutal-input" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Sponsorship</label>
              <input className="brutal-input" value={sponsorshipAmount} onChange={(event) => setSponsorshipAmount(event.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            {lineItems.map((item, index) => (
              <div key={`${item.label}-${index}`} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px_120px]">
                <input className="brutal-input" placeholder="Line item" value={item.label} onChange={(event) => updateItem(index, "label", event.target.value)} />
                <input className="brutal-input" placeholder="Qty" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
                <input className="brutal-input" placeholder="Unit cost" value={item.unitCost} onChange={(event) => updateItem(index, "unitCost", event.target.value)} />
              </div>
            ))}
            <button onClick={() => setLineItems((previous) => [...previous, { label: "", quantity: "1", unitCost: "0" }])} className="brutal-btn-outline flex items-center gap-2 py-2 text-xs">
              <Plus className="h-3.5 w-3.5" strokeWidth={3} />
              Add Line Item
            </button>
          </div>
          {status ? <p className="font-mono text-xs text-muted-foreground">{status}</p> : null}
        </div>

        <div className="space-y-6">
          <div className="brutal-card grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["Projected Total", totals?.projectedTotalFormatted || "Rs. 0"],
              ["Net Budget", totals?.netBudgetFormatted || "Rs. 0"],
              ["Cost Per Head", totals?.costPerHeadFormatted || "Rs. 0"],
            ].map(([label, value]) => (
              <div key={label} className="brutal-border bg-muted/20 p-4">
                <p className="font-mono text-[10px] uppercase text-muted-foreground">{label}</p>
                <p className="mt-2 text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="brutal-card">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Insights</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              {insights.length > 0 ? insights.map((insight) => <p key={insight}>- {insight}</p>) : <p>Run the analysis to get suggested cost breakdowns, contingency, and practical budgeting recommendations.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlannerPage;
