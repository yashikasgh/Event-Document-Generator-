import { useEffect, useMemo, useState } from "react";
import { FlaskConical, GraduationCap, Megaphone, PartyPopper, Plus, Trophy, Wrench } from "lucide-react";
import { toast } from "sonner";
import BudgetWorkspaceShell from "@/components/BudgetWorkspaceShell";
import { formatBudgetCurrency, loadBudgetCategories, loadBudgetRecords, saveBudgetCategories, StoredBudgetRecord } from "@/lib/budgetStorage";

const iconMap: Record<string, typeof PartyPopper> = {
  Fest: PartyPopper,
  Seminar: GraduationCap,
  Repair: Wrench,
  Research: FlaskConical,
  Infrastructure: Wrench,
  Sports: Trophy,
  Marketing: Megaphone,
  Hospitality: PartyPopper,
};

const BudgetCategoriesPage = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [records, setRecords] = useState<StoredBudgetRecord[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [expandedFolderId, setExpandedFolderId] = useState("");

  useEffect(() => {
    setCategories(loadBudgetCategories());
    setRecords(loadBudgetRecords());
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach((record) => map.set(record.category, (map.get(record.category) || 0) + 1));
    return map;
  }, [records]);

  const categoryRecords = useMemo(
    () => records.filter((record) => record.category === selectedCategory),
    [records, selectedCategory]
  );

  const addCategory = () => {
    const value = newCategory.trim();
    if (!value) {
      toast.error("Enter a category name first.");
      return;
    }
    const updated = Array.from(new Set([...categories, value]));
    setCategories(updated);
    saveBudgetCategories(updated);
    setNewCategory("");
    toast.success("Category added.");
  };

  return (
    <BudgetWorkspaceShell
      title="Categories"
      subtitle="Manage budget categories"
      actions={
        <div className="flex flex-col gap-3 sm:flex-row">
          <input className="brutal-input min-w-[220px] rounded-[18px]" placeholder="Add new category" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} />
          <button onClick={addCategory} className="brutal-btn-primary flex items-center gap-2 py-3">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Add New Category
          </button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => {
          const Icon = iconMap[category] || PartyPopper;
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-[24px] border-2 bg-card p-5 text-left ${selectedCategory === category ? "border-foreground brutal-shadow" : "border-foreground brutal-shadow-sm"}`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted brutal-border">
                <Icon className="h-6 w-6" strokeWidth={2.2} />
              </div>
              <h3 className="mt-5 text-xl font-bold">{category}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{counts.get(category) || 0} events</p>
            </button>
          );
        })}
      </div>

      {selectedCategory ? (
        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <h2 className="text-xl font-bold">{selectedCategory}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Click a folder to expand and view the expenses under it.</p>
          <div className="mt-5 space-y-4">
            {categoryRecords.length > 0 ? (
              categoryRecords.map((record) => (
                <div key={record.id} className="rounded-[18px] border border-foreground/10 bg-background">
                  <button onClick={() => setExpandedFolderId(expandedFolderId === record.id ? "" : record.id)} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left">
                    <div>
                      <p className="font-semibold">{record.title}</p>
                      <p className="text-sm text-muted-foreground">{record.date} | {record.items.length} expenses</p>
                    </div>
                    <p className="font-semibold">{formatBudgetCurrency(record.grandTotal)}</p>
                  </button>
                  {expandedFolderId === record.id ? (
                    <div className="border-t border-foreground/10 px-4 py-4">
                      {record.items.length > 0 ? (
                        <div className="grid gap-3 md:grid-cols-2">
                          {record.items.map((item) => (
                            <div key={item.id} className="rounded-[14px] border border-foreground/10 bg-card px-4 py-3">
                              <p className="font-medium">{item.label}</p>
                              <p className="mt-1 text-sm text-muted-foreground">{item.vendorName || record.vendor}</p>
                              <p className="mt-2 text-sm">{item.paymentMethod || record.paymentMethod}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No expenses added in this folder yet.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <div className="rounded-[18px] border-2 border-dashed border-foreground/20 px-5 py-10 text-center text-sm text-muted-foreground">
                No folders found for this category.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </BudgetWorkspaceShell>
  );
};

export default BudgetCategoriesPage;
