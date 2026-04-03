import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calculator, FolderKanban, LoaderCircle, Plus, Save, Sidebar, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  BUDGET_CATEGORIES,
  EXPENSE_TYPES,
  StoredBudgetRecord,
  formatBudgetCurrency,
  loadBudgetRecords,
  saveBudgetRecords,
} from "@/lib/budgetStorage";

type BudgetItem = {
  id: string;
  label: string;
  quantity: string;
  unitCost: string;
  notes: string;
  expenseType: string;
};

const createItem = (): BudgetItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  quantity: "1",
  unitCost: "0",
  notes: "",
  expenseType: EXPENSE_TYPES[0],
});

const BudgetPlannerPage = () => {
  const [projectTitle, setProjectTitle] = useState("");
  const [category, setCategory] = useState(BUDGET_CATEGORIES[0]);
  const [vendor, setVendor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [receiptId, setReceiptId] = useState("");
  const [expectedAttendees, setExpectedAttendees] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [sponsorshipAmount, setSponsorshipAmount] = useState("");
  const [discount, setDiscount] = useState("0");
  const [lineItems, setLineItems] = useState<BudgetItem[]>([{ ...createItem(), label: "Main expense" }]);
  const [records, setRecords] = useState<StoredBudgetRecord[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setRecords(loadBudgetRecords());
  }, []);

  useEffect(() => {
    if (records.length > 0) {
      saveBudgetRecords(records);
    }
  }, [records]);

  const updateItem = (id: string, key: keyof BudgetItem, value: string) => {
    setLineItems((previous) => previous.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const calculatedItems = useMemo(
    () =>
      lineItems.map((item) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitCost || 0);
        const amount = quantity * unitPrice;
        const tax = amount * 0.08;
        return {
          ...item,
          quantity,
          unitPrice,
          amount,
          tax,
        };
      }),
    [lineItems]
  );

  const subtotal = calculatedItems.reduce((sum, item) => sum + item.amount, 0);
  const taxTotal = calculatedItems.reduce((sum, item) => sum + item.tax, 0);
  const discountValue = Number(discount || 0);
  const grandTotal = subtotal + taxTotal - discountValue;

  const analyze = async () => {
    setIsLoading(true);
    setStatus("");

    try {
      const response = await api.analyzeBudget({
        expectedAttendees,
        durationHours,
        sponsorshipAmount,
        lineItems: lineItems.map((item) => ({
          label: item.label,
          quantity: item.quantity,
          unitCost: item.unitCost,
        })),
      });
      setResult(response);
      setStatus("Budget analysis generated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Budget analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecord = () => {
    const record: StoredBudgetRecord = {
      id: `${Date.now()}`,
      title: projectTitle || `${category} Project`,
      vendor: vendor || "Internal Budget Entry",
      date: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      category,
      paymentMethod: paymentMethod || "Pending allocation",
      receiptId: receiptId || `AUTO-${Date.now()}`,
      items: calculatedItems.map((item) => ({
        id: item.id,
        label: item.label || "Untitled item",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tax: Number(item.tax.toFixed(2)),
        amount: Number(item.amount.toFixed(2)),
        notes: item.notes,
        expenseType: item.expenseType,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      taxTotal: Number(taxTotal.toFixed(2)),
      discount: discountValue,
      grandTotal: Number(grandTotal.toFixed(2)),
    };

    setRecords((previous) => [record, ...previous]);
    saveBudgetRecords([record, ...records]);
    setStatus("Project folder saved under previous budgets.");
  };

  const totals = result?.totals as
    | {
        projectedTotalFormatted?: string;
        netBudgetFormatted?: string;
        costPerHeadFormatted?: string;
      }
    | undefined;
  const insights = (result?.insights as string[] | undefined) || [];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="brutal-btn-outline flex items-center gap-1 px-3 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Back
          </Link>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">Budget Estimation</h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Create project folders and enter multiple expenditures</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={saveRecord} className="brutal-btn-outline flex items-center gap-2 py-2 text-xs">
            <Save className="h-4 w-4" strokeWidth={2.5} />
            Save Project
          </button>
          <button onClick={analyze} className="brutal-btn-primary flex items-center gap-2 py-2" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} /> : <Calculator className="h-4 w-4" strokeWidth={3} />}
            Analyze Budget
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[240px_1fr]">
        <motion.aside className="space-y-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="brutal-card p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Budget Sidebar</p>
            <div className="mt-4 space-y-3">
              <Link to="/generate/budget/history" className="flex items-center gap-3 rounded-[16px] border border-foreground/10 bg-muted/10 px-4 py-4 transition-colors hover:bg-muted/20">
                <div className="flex h-10 w-10 items-center justify-center bg-secondary brutal-border">
                  <Sidebar className="h-4 w-4 text-secondary-foreground" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase">Expenditure History</p>
                  <p className="text-xs text-muted-foreground">{records.length} saved folders</p>
                </div>
              </Link>

              <div className="rounded-[16px] border border-foreground/10 bg-muted/10 px-4 py-4">
                <p className="text-sm font-bold uppercase">Current Folder</p>
                <p className="mt-2 text-xs text-muted-foreground">{projectTitle || "Untitled project folder"}</p>
              </div>
            </div>
          </div>
        </motion.aside>

        <motion.section initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="brutal-card">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center bg-primary brutal-border">
                <FolderKanban className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Project Folder</h2>
                <p className="mt-1 text-sm text-muted-foreground">Give the budget a folder title and category, then add the different expenditures inside it.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Folder Title</label>
                <input className="brutal-input" placeholder="Alegria 2026" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Category</label>
                <select className="brutal-input" value={category} onChange={(event) => setCategory(event.target.value)}>
                  {BUDGET_CATEGORIES.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Vendor / Owner</label>
                <input className="brutal-input" placeholder="Festival Finance Desk" value={vendor} onChange={(event) => setVendor(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Payment Method</label>
                <input className="brutal-input" placeholder="Corporate card / bank transfer" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Receipt ID</label>
                <input className="brutal-input" placeholder="REC-20241015-9876" value={receiptId} onChange={(event) => setReceiptId(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Expected Attendees</label>
                <input className="brutal-input" value={expectedAttendees} onChange={(event) => setExpectedAttendees(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Duration Hours</label>
                <input className="brutal-input" value={durationHours} onChange={(event) => setDurationHours(event.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sponsorship Amount</label>
                <input className="brutal-input" value={sponsorshipAmount} onChange={(event) => setSponsorshipAmount(event.target.value)} />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {lineItems.map((item) => {
                const actual = calculatedItems.find((entry) => entry.id === item.id);
                return (
                  <div key={item.id} className="rounded-[18px] border border-primary/25 p-4">
                    <div className="grid gap-3 md:grid-cols-[180px_1fr_100px_110px_auto]">
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase text-muted-foreground">Expense Type</label>
                        <select className="brutal-input" value={item.expenseType} onChange={(event) => updateItem(item.id, "expenseType", event.target.value)}>
                          {EXPENSE_TYPES.map((entry) => (
                            <option key={entry} value={entry}>
                              {entry}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase text-muted-foreground">Expense Name</label>
                        <input className="brutal-input" placeholder="Food stall setup / repairing / logistics" value={item.label} onChange={(event) => updateItem(item.id, "label", event.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase text-muted-foreground">Qty</label>
                        <input className="brutal-input" value={item.quantity} onChange={(event) => updateItem(item.id, "quantity", event.target.value)} />
                      </div>
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase text-muted-foreground">Unit Cost</label>
                        <input className="brutal-input" value={item.unitCost} onChange={(event) => updateItem(item.id, "unitCost", event.target.value)} />
                      </div>
                      <div className="flex items-end">
                        <button onClick={() => setLineItems((previous) => previous.filter((entry) => entry.id !== item.id))} className="brutal-btn-outline px-3 py-3 text-xs">
                          <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_repeat(4,minmax(0,1fr))]">
                      <div>
                        <label className="mb-1.5 block font-mono text-[10px] uppercase text-muted-foreground">Notes</label>
                        <textarea className="brutal-input min-h-[86px] resize-y" placeholder="Add approvals, vendor notes, or folder-specific comments" value={item.notes} onChange={(event) => updateItem(item.id, "notes", event.target.value)} />
                      </div>
                      <div className="rounded-[14px] bg-muted/20 p-3">
                        <p className="font-mono text-[10px] uppercase text-muted-foreground">Estimate</p>
                        <p className="mt-3 text-lg font-bold">{formatBudgetCurrency(actual?.amount || 0)}</p>
                      </div>
                      <div className="rounded-[14px] bg-muted/20 p-3">
                        <p className="font-mono text-[10px] uppercase text-muted-foreground">Tax</p>
                        <p className="mt-3 text-lg font-bold">{formatBudgetCurrency(actual?.tax || 0)}</p>
                      </div>
                      <div className="rounded-[14px] bg-muted/20 p-3">
                        <p className="font-mono text-[10px] uppercase text-muted-foreground">Actual to Date</p>
                        <p className="mt-3 text-lg font-bold">{formatBudgetCurrency(actual?.amount || 0)}</p>
                      </div>
                      <div className="rounded-[14px] bg-muted/20 p-3">
                        <p className="font-mono text-[10px] uppercase text-muted-foreground">Projected</p>
                        <p className="mt-3 text-lg font-bold">{formatBudgetCurrency(Math.max((actual?.amount || 0) * 0.18, 0))}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button onClick={() => setLineItems((previous) => [...previous, createItem()])} className="flex w-full items-center justify-center gap-2 border-2 border-dashed border-primary/50 bg-background px-4 py-4 font-bold uppercase tracking-wider text-primary">
                <Plus className="h-4 w-4" strokeWidth={3} />
                Add Expenditure Inside Folder
              </button>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[18px] bg-background p-4 brutal-border">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Folder Totals</p>
                <div className="mt-4 grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatBudgetCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tax Total</span>
                    <span>{formatBudgetCurrency(taxTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <input className="w-28 bg-transparent text-right outline-none" value={discount} onChange={(event) => setDiscount(event.target.value)} />
                  </div>
                  <div className="flex items-center justify-between border-t border-foreground/10 pt-2 text-base font-bold">
                    <span>Grand Total</span>
                    <span>{formatBudgetCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-[18px] bg-foreground p-5 text-primary-foreground brutal-border">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary-foreground/70">Budget Analysis</p>
                <div className="mt-4 grid gap-4">
                  {[
                    ["Projected Total", totals?.projectedTotalFormatted || formatBudgetCurrency(grandTotal)],
                    ["Net Budget", totals?.netBudgetFormatted || formatBudgetCurrency(grandTotal - Number(sponsorshipAmount || 0))],
                    ["Cost Per Head", totals?.costPerHeadFormatted || formatBudgetCurrency(expectedAttendees ? grandTotal / Number(expectedAttendees) : 0)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs uppercase tracking-[0.15em] text-primary-foreground/65">{label}</p>
                      <p className="mt-1 text-xl font-bold">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="brutal-card">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Insights</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
              {insights.length > 0 ? insights.map((insight) => <p key={insight}>- {insight}</p>) : <p>Run the analysis to get suggested cost breakdowns, contingency, and practical budgeting recommendations.</p>}
            </div>
          </div>

          {status ? <p className="font-mono text-xs text-muted-foreground">{status}</p> : null}
        </motion.section>
      </div>
    </div>
  );
};

export default BudgetPlannerPage;
