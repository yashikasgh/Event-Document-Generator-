import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import BudgetWorkspaceShell from "@/components/BudgetWorkspaceShell";
import { api } from "@/lib/api";
import { formatBudgetCurrency, loadBudgetCategories, loadBudgetRecords, StoredBudgetRecord } from "@/lib/budgetStorage";

type EstimateResponse = {
  summary?: string;
  estimatedTotal?: number;
  estimatedTotalFormatted?: string;
  breakdown?: Array<{ label: string; amount: number; amountFormatted: string }>;
  recommendations?: string[];
};

const BudgetEstimationPage = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [history, setHistory] = useState<StoredBudgetRecord[]>([]);
  const [eventType, setEventType] = useState("");
  const [attendees, setAttendees] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);

  useEffect(() => {
    const loadedCategories = loadBudgetCategories();
    setCategories(loadedCategories);
    setHistory(loadBudgetRecords());
    setEventType(loadedCategories[0] || "Fest");
  }, []);

  const generateEstimate = async () => {
    if (!eventType || !attendees) {
      toast.error("Select event type and number of people.");
      return;
    }
    setIsLoading(true);
    try {
      const response = (await api.estimateBudget({
        eventType,
        attendees: Number(attendees),
        history,
      })) as EstimateResponse;
      setEstimate(response);
      toast.success("Estimation generated from previous events.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Estimation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BudgetWorkspaceShell
      title="Estimation"
      subtitle="Estimate new event budgets using previous event history and attendee count"
      actions={
        <button onClick={generateEstimate} className="brutal-btn-primary flex items-center gap-2 py-3" disabled={isLoading}>
          {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.4} /> : null}
          Generate Estimate
        </button>
      }
    >
      <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Event Type</label>
            <select className="brutal-input rounded-[16px]" value={eventType} onChange={(event) => setEventType(event.target.value)}>
              {categories.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Number of People</label>
            <input className="brutal-input rounded-[16px]" value={attendees} onChange={(event) => setAttendees(event.target.value)} placeholder="200" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <h2 className="text-lg font-bold uppercase">Estimate Summary</h2>
          {estimate ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{estimate.summary}</p>
              <div className="rounded-[18px] border border-foreground/10 bg-background px-4 py-4">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="mt-2 text-3xl font-bold">{estimate.estimatedTotalFormatted || formatBudgetCurrency(estimate.estimatedTotal || 0)}</p>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-[18px] border-2 border-dashed border-foreground/20 px-5 py-10 text-center text-sm text-muted-foreground">
              Generate an estimate to see AI-backed suggestions from previous events.
            </div>
          )}
        </div>

        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <h2 className="text-lg font-bold uppercase">Suggested Breakdown</h2>
          {estimate?.breakdown?.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {estimate.breakdown.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-foreground/10 bg-background px-4 py-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold">{item.amountFormatted}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[18px] border-2 border-dashed border-foreground/20 px-5 py-10 text-center text-sm text-muted-foreground">
              No breakdown yet.
            </div>
          )}

          {estimate?.recommendations?.length ? (
            <div className="mt-5 space-y-2">
              {estimate.recommendations.map((entry) => (
                <div key={entry} className="rounded-[16px] border border-foreground/10 bg-background px-4 py-3 text-sm text-muted-foreground">
                  {entry}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </BudgetWorkspaceShell>
  );
};

export default BudgetEstimationPage;
