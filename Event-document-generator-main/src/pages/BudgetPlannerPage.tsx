import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import BudgetWorkspaceShell from "@/components/BudgetWorkspaceShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import {
  EXPENSE_TYPES,
  PAYMENT_METHODS,
  StoredBudgetRecord,
  formatBudgetCurrency,
  loadBudgetCategories,
  loadBudgetRecords,
  saveBudgetCategories,
  saveBudgetRecords,
} from "@/lib/budgetStorage";

type BudgetItemForm = {
  id: string;
  label: string;
  amount: string;
  purchaseDate: string;
  paymentMethod: string;
  notes: string;
  vendorName: string;
  expenseType: string;
};

const createExpense = (): BudgetItemForm => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  label: "",
  amount: "",
  purchaseDate: "",
  paymentMethod: PAYMENT_METHODS[0],
  notes: "",
  vendorName: "",
  expenseType: EXPENSE_TYPES[0],
});

const BudgetPlannerPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<string[]>([]);
  const [records, setRecords] = useState<StoredBudgetRecord[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [expectedBudget, setExpectedBudget] = useState("");
  const [description, setDescription] = useState("");
  const [lineItems, setLineItems] = useState<BudgetItemForm[]>([]);
  const [analysis, setAnalysis] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState("");

  useEffect(() => {
    const loadedCategories = loadBudgetCategories();
    const loadedRecords = loadBudgetRecords();
    setCategories(loadedCategories);
    setCategory(loadedCategories[0] || "");
    setRecords(loadedRecords);

    const draftId = searchParams.get("draft");
    if (!draftId) {
      return;
    }

    const draft = loadedRecords.find((record) => record.id === draftId);
    if (!draft) {
      return;
    }

    setCurrentDraftId(draft.id);
    setProjectTitle(draft.title);
    setCategory(draft.category);
    setExpectedBudget(String(draft.expectedBudget || ""));
    setDescription(draft.description || "");
    setLineItems(
      draft.items.length > 0
        ? draft.items.map((item) => ({
            id: item.id,
            label: item.label,
            amount: item.unitPrice ? String(item.unitPrice) : "",
            purchaseDate: item.purchaseDate || "",
            paymentMethod: item.paymentMethod || PAYMENT_METHODS[0],
            notes: item.notes || "",
            vendorName: item.vendorName || "",
            expenseType: item.expenseType || EXPENSE_TYPES[0],
          }))
        : []
    );
  }, [searchParams]);

  const addCategory = () => {
    const value = newCategory.trim();
    if (!value) return;
    const updated = Array.from(new Set([...categories, value]));
    setCategories(updated);
    setCategory(value);
    setNewCategory("");
    saveBudgetCategories(updated);
    toast.success("New category added.");
  };

  const updateItem = (id: string, key: keyof BudgetItemForm, value: string) => {
    setLineItems((current) => current.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const filledLineItems = useMemo(
    () => lineItems.filter((item) => item.label.trim() || item.amount || item.vendorName.trim() || item.notes.trim() || item.purchaseDate),
    [lineItems]
  );

  const totals = useMemo(() => {
    const subtotal = filledLineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const tax = subtotal * 0.08;
    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  }, [filledLineItems]);

  const createBudgetRecord = (): StoredBudgetRecord => ({
    id: currentDraftId || `${Date.now()}`,
    title: projectTitle || "Untitled Event",
    vendor: filledLineItems[0]?.vendorName || "Unassigned vendor",
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    category: category || categories[0] || "Fest",
    paymentMethod: filledLineItems[0]?.paymentMethod || PAYMENT_METHODS[0],
    receiptId: currentDraftId ? `BGT-${currentDraftId}` : `BGT-${Date.now()}`,
    description,
    expectedBudget: Number(expectedBudget || 0),
    items: filledLineItems.map((item, index) => ({
      id: item.id,
      label: item.label || `Expense ${index + 1}`,
      quantity: 1,
      unitPrice: Number(item.amount || 0),
      tax: Number((Number(item.amount || 0) * 0.08).toFixed(2)),
      amount: Number((Number(item.amount || 0) * 1.08).toFixed(2)),
      notes: item.notes,
      expenseType: item.expenseType,
      vendorName: item.vendorName,
      purchaseDate: item.purchaseDate,
      paymentMethod: item.paymentMethod,
      expenseId: `EXP-${Date.now()}-${index + 1}`,
    })),
    subtotal: Number(totals.subtotal.toFixed(2)),
    taxTotal: Number(totals.tax.toFixed(2)),
    discount: 0,
    grandTotal: Number(totals.total.toFixed(2)),
    isDraft: filledLineItems.length === 0,
  });

  const handleAnalyze = async () => {
    if (filledLineItems.length === 0) {
      toast.error("Add at least one expense before running analysis.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.analyzeBudget({
        expectedAttendees: "",
        durationHours: "",
        sponsorshipAmount: "0",
        lineItems: filledLineItems.map((item) => ({
          label: item.label,
          quantity: 1,
          unitCost: item.amount || 0,
        })),
      });
      const insights = Array.isArray(response.insights) ? (response.insights as string[]) : [];
      setAnalysis(insights.length ? insights : ["Analysis generated successfully."]);
      toast.success("Budget estimation generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not analyze budget.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!projectTitle.trim()) {
      toast.error("Enter an event name before saving the folder.");
      return;
    }

    const record = createBudgetRecord();
    const updated = currentDraftId
      ? records.map((entry) => (entry.id === currentDraftId ? record : entry))
      : [record, ...records];
    setRecords(updated);
    saveBudgetRecords(updated);
    if (!currentDraftId) {
      setCurrentDraftId(record.id);
      setSearchParams({ draft: record.id });
    }
    toast.success(record.isDraft ? "Budget folder draft saved. You can add expenses later." : "Budget saved to history.");
  };

  return (
    <BudgetWorkspaceShell
      title="Create Budget"
      subtitle="Clean event budget setup with expense entry and estimation support"
      actions={
        <>
          <button onClick={handleSave} className="brutal-btn-outline py-3">{currentDraftId ? "Update Budget" : "Save Folder"}</button>
          <button onClick={handleAnalyze} className="brutal-btn-primary flex items-center gap-2 py-3" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.4} /> : null}
            Analyze
          </button>
        </>
      }
    >
      <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Event Name</label>
            <input className="brutal-input rounded-[18px]" value={projectTitle} onChange={(event) => setProjectTitle(event.target.value)} placeholder="Alegria 2026" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Expected Budget</label>
            <input className="brutal-input rounded-[18px]" value={expectedBudget} onChange={(event) => setExpectedBudget(event.target.value)} placeholder="100000" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Category</label>
            <select className="brutal-input rounded-[18px]" value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((entry) => (
                <option key={entry}>{entry}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Add New Category</label>
            <div className="flex gap-3">
              <input className="brutal-input rounded-[18px]" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="New category" />
              <button onClick={addCategory} className="brutal-btn-outline px-4">Add</button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Description (Optional)</label>
            <textarea className="brutal-input min-h-[130px] rounded-[18px] resize-none" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Brief description of the event..." />
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Expense Entries</h2>
            <p className="text-sm text-muted-foreground">You can save the folder first, then add expense cards any time.</p>
          </div>
          <button onClick={() => setLineItems((current) => [...current, createExpense()])} className="brutal-btn-primary flex items-center gap-2 py-3">
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            Add Expense
          </button>
        </div>

        <div className="space-y-4">
          {lineItems.length === 0 ? (
            <div className="rounded-[20px] border-2 border-dashed border-foreground/20 px-5 py-10 text-center text-sm text-muted-foreground">
              No expenses added yet. Save the folder now, or add expenses whenever you're ready.
            </div>
          ) : null}
          {lineItems.map((item, index) => (
            <div key={item.id} className="rounded-[20px] border border-foreground/10 bg-background p-4">
              <div className="grid gap-4 lg:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">Title</label>
                  <input className="brutal-input rounded-[16px]" value={item.label} onChange={(event) => updateItem(item.id, "label", event.target.value)} placeholder="Expense title" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Amount</label>
                  <input className="brutal-input rounded-[16px]" value={item.amount} onChange={(event) => updateItem(item.id, "amount", event.target.value)} placeholder="₹0" />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Date</label>
                  <input type="date" className="brutal-input rounded-[16px]" value={item.purchaseDate} onChange={(event) => updateItem(item.id, "purchaseDate", event.target.value)} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Payment Method</label>
                  <select className="brutal-input rounded-[16px]" value={item.paymentMethod} onChange={(event) => updateItem(item.id, "paymentMethod", event.target.value)}>
                    {PAYMENT_METHODS.map((entry) => (
                      <option key={entry}>{entry}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Vendor</label>
                  <input className="brutal-input rounded-[16px]" value={item.vendorName} onChange={(event) => updateItem(item.id, "vendorName", event.target.value)} placeholder="Vendor" />
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr_auto]">
                <div>
                  <label className="mb-2 block text-sm font-medium">Type</label>
                  <select className="brutal-input rounded-[16px]" value={item.expenseType} onChange={(event) => updateItem(item.id, "expenseType", event.target.value)}>
                    {EXPENSE_TYPES.map((entry) => (
                      <option key={entry}>{entry}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Notes</label>
                  <input className="brutal-input rounded-[16px]" value={item.notes} onChange={(event) => updateItem(item.id, "notes", event.target.value)} placeholder="Optional notes" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => setPendingDeleteId(item.id)} className="brutal-btn-outline px-4 py-3 text-destructive">
                    <Trash2 className="h-4 w-4" strokeWidth={2.4} />
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm text-muted-foreground">Expense #{index + 1}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <h2 className="text-lg font-bold uppercase">Budget Summary</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatBudgetCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatBudgetCurrency(totals.tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-foreground/10 pt-3 font-semibold">
              <span>Total</span>
              <span>{formatBudgetCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <h2 className="text-lg font-bold uppercase">Estimation Insights</h2>
          {analysis.length > 0 ? (
            <div className="mt-4 space-y-3">
              {analysis.map((entry) => (
                <div key={entry} className="rounded-[18px] border border-foreground/10 bg-background px-4 py-3 text-sm text-muted-foreground">{entry}</div>
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-[18px] border-2 border-dashed border-foreground/20 px-5 py-10 text-center text-sm text-muted-foreground">
              {lineItems.length === 0 ? "Add at least one expense if you want analysis. Folder drafts can still be saved now." : "No estimate yet. Use Analyze to generate suggestions."}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId("")}>
        <AlertDialogContent className="rounded-[24px] border-2 border-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this expense?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the expense row from the current budget draft.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDeleteId("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLineItems((current) => current.filter((entry) => entry.id !== pendingDeleteId));
                setPendingDeleteId("");
                toast.success("Expense removed.");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </BudgetWorkspaceShell>
  );
};

export default BudgetPlannerPage;
