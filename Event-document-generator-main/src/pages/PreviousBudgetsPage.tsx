import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import { StoredBudgetRecord, formatBudgetCurrency, loadBudgetRecords } from "@/lib/budgetStorage";

const PreviousBudgetsPage = () => {
  const [records, setRecords] = useState<StoredBudgetRecord[]>([]);
  const [expandedRecordId, setExpandedRecordId] = useState("");

  useEffect(() => {
    const loaded = loadBudgetRecords();
    setRecords(loaded);
    setExpandedRecordId(loaded[0]?.id ?? "");
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center gap-4">
          <Link to="/generate/budget" className="brutal-btn-outline flex items-center gap-1 px-3 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Back
          </Link>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight">Previous Budgets</h1>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Stored project folders and expenditure history</p>
          </div>
        </div>
      </motion.header>

      <div className="space-y-4">
        {records.map((record) => {
          const open = expandedRecordId === record.id;
          return (
            <div key={record.id} className="brutal-card !p-0 overflow-hidden">
              <button onClick={() => setExpandedRecordId(open ? "" : record.id)} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center bg-secondary brutal-border">
                    <FolderKanban className="h-5 w-5 text-secondary-foreground" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{record.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{record.category} | {record.date}</p>
                  </div>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
              </button>

              {open ? (
                <div className="border-t border-foreground/10 px-5 py-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["Vendor", record.vendor],
                      ["Payment Method", record.paymentMethod],
                      ["Receipt ID", record.receiptId],
                      ["Grand Total", formatBudgetCurrency(record.grandTotal)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[16px] border border-foreground/10 bg-muted/10 p-4">
                        <p className="font-mono text-[10px] uppercase text-muted-foreground">{label}</p>
                        <p className="mt-2 text-sm font-medium">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 overflow-x-auto rounded-[16px] border border-foreground/10">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-muted/20">
                        <tr>
                          <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Expense Type</th>
                          <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Description</th>
                          <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Qty</th>
                          <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Unit Price</th>
                          <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Tax</th>
                          <th className="px-4 py-3 text-left font-mono text-[10px] uppercase text-muted-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.items.map((item) => (
                          <tr key={item.id} className="border-t border-foreground/10">
                            <td className="px-4 py-3">{item.expenseType}</td>
                            <td className="px-4 py-3">{item.label}</td>
                            <td className="px-4 py-3">{item.quantity}</td>
                            <td className="px-4 py-3">{formatBudgetCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3">{formatBudgetCurrency(item.tax)}</td>
                            <td className="px-4 py-3 font-medium">{formatBudgetCurrency(item.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PreviousBudgetsPage;
