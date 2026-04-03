import { useEffect, useMemo, useState } from "react";
import { FileUp, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import BudgetWorkspaceShell from "@/components/BudgetWorkspaceShell";
import { api } from "@/lib/api";
import { StoredBudgetRecord, loadBudgetCategories, loadBudgetRecords } from "@/lib/budgetStorage";

const BudgetAnalysisPage = () => {
  const [records, setRecords] = useState<StoredBudgetRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    const loadedRecords = loadBudgetRecords();
    const loadedCategories = loadBudgetCategories();
    setRecords(loadedRecords);
    setCategories(loadedCategories);
    setSelectedCategory(loadedCategories[0] || "");
  }, []);

  const categoryFolders = useMemo(
    () => records.filter((record) => (selectedCategory ? record.category === selectedCategory : true)),
    [records, selectedCategory]
  );

  const selectedFolder = useMemo(
    () => categoryFolders.find((record) => record.id === selectedFolderId) || null,
    [categoryFolders, selectedFolderId]
  );

  const runFolderAnalysis = async () => {
    if (!selectedFolder) {
      toast.error("Select a folder to analyze.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.analyzeBudgetFolder({ folder: selectedFolder });
      setResult(response);
      toast.success("Folder analysis generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Folder analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const runCsvAnalysis = async () => {
    if (!selectedFolder || !csvFile) {
      toast.error("Select a folder and upload a CSV or Excel file first.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.analyzeBudgetCsv(csvFile, selectedFolder);
      setResult(response.analysis as Record<string, unknown>);
      toast.success("CSV analysis generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CSV analysis failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BudgetWorkspaceShell
      title="Analysis"
      subtitle="Analyze a selected budget folder or upload CSV data for AI-backed insights"
      actions={
        <>
          <button onClick={runFolderAnalysis} className="brutal-btn-outline py-3" disabled={isLoading}>Analyze Folder</button>
          <button onClick={runCsvAnalysis} className="brutal-btn-primary flex items-center gap-2 py-3" disabled={isLoading}>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.4} /> : <FileUp className="h-4 w-4" strokeWidth={2.4} />}
            Analyze CSV
          </button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <label className="mb-2 block text-sm font-medium">Category</label>
          <select
            className="brutal-input rounded-[16px]"
            value={selectedCategory}
            onChange={(event) => {
              setSelectedCategory(event.target.value);
              setSelectedFolderId("");
            }}
          >
            <option value="">Select category</option>
            {categories.map((entry) => (
              <option key={entry}>{entry}</option>
            ))}
          </select>
        </div>
        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <label className="mb-2 block text-sm font-medium">Budget / Folder ID</label>
          <select className="brutal-input rounded-[16px]" value={selectedFolderId} onChange={(event) => setSelectedFolderId(event.target.value)}>
            <option value="">Select folder</option>
            {categoryFolders.map((record) => (
              <option key={record.id} value={record.id}>
                {record.title} ({record.id})
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
          <label className="mb-2 block text-sm font-medium">Upload CSV / Excel</label>
          <input type="file" accept=".csv,.xls,.xlsx" className="brutal-input rounded-[16px]" onChange={(event) => setCsvFile(event.target.files?.[0] || null)} />
        </div>
      </div>

      <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
        <h2 className="text-lg font-bold uppercase">Selected Folder Snapshot</h2>
        {selectedFolder ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
            <div><p className="text-muted-foreground">Title</p><p className="font-semibold">{selectedFolder.title}</p></div>
            <div><p className="text-muted-foreground">Category</p><p className="font-semibold">{selectedFolder.category}</p></div>
            <div><p className="text-muted-foreground">Expense Count</p><p className="font-semibold">{selectedFolder.items.length}</p></div>
            <div><p className="text-muted-foreground">Folder ID</p><p className="font-semibold">{selectedFolder.id}</p></div>
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border-2 border-dashed border-foreground/20 px-5 py-10 text-center text-sm text-muted-foreground">
            Select a category and folder to start analysis.
          </div>
        )}
      </div>

      <div className="rounded-[24px] border-2 border-foreground bg-card p-5 brutal-shadow-sm">
        <h2 className="text-lg font-bold uppercase">Analysis Result</h2>
        {result ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-[18px] border border-foreground/10 bg-background px-4 py-4">
              <p className="font-semibold">Summary</p>
              <p className="mt-2 text-sm text-muted-foreground">{String(result.summary || "No summary available.")}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {Array.isArray(result.insights)
                ? (result.insights as string[]).map((insight) => (
                    <div key={insight} className="rounded-[18px] border border-foreground/10 bg-background px-4 py-4 text-sm text-muted-foreground">
                      {insight}
                    </div>
                  ))
                : null}
            </div>
            <div className="rounded-[18px] border border-foreground/10 bg-background px-4 py-4">
              <p className="font-semibold">Recommendation</p>
              <p className="mt-2 text-sm text-muted-foreground">{String(result.recommendation || "No recommendation available.")}</p>
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[18px] border-2 border-dashed border-foreground/20 px-5 py-10 text-center text-sm text-muted-foreground">
            No analysis generated yet.
          </div>
        )}
      </div>
    </BudgetWorkspaceShell>
  );
};

export default BudgetAnalysisPage;
