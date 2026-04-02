import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Upload,
  Download,
  Trash2,
  CheckSquare,
  Square,
  FileSpreadsheet,
  UserCheck,
  UserX,
  X,
} from "lucide-react";

interface Student {
  id: string;
  name: string;
  roll: string;
  present: boolean;
}

const sampleStudents: Student[] = [
  { id: "1", name: "Aarav Sharma", roll: "CS101", present: false },
  { id: "2", name: "Priya Patel", roll: "CS102", present: false },
  { id: "3", name: "Rohan Gupta", roll: "CS103", present: false },
  { id: "4", name: "Ananya Singh", roll: "CS104", present: false },
  { id: "5", name: "Vikram Reddy", roll: "CS105", present: false },
  { id: "6", name: "Sneha Iyer", roll: "CS106", present: false },
  { id: "7", name: "Arjun Kumar", roll: "CS107", present: false },
  { id: "8", name: "Meera Nair", roll: "CS108", present: false },
];

const AttendancePage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [eventName, setEventName] = useState("");

  const loadSample = () => setStudents(sampleStudents);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split("\n").filter((l) => l.trim());
      const parsed: Student[] = lines.slice(1).map((line, i) => {
        const parts = line.split(",").map((p) => p.trim().replace(/"/g, ""));
        return {
          id: String(i + 1),
          name: parts[0] || `Student ${i + 1}`,
          roll: parts[1] || `R${i + 1}`,
          present: false,
        };
      });
      if (parsed.length > 0) setStudents(parsed);
    };
    reader.readAsText(file);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const togglePresent = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, present: !s.present } : s))
    );
  };

  const markAll = (present: boolean) => {
    setStudents((prev) => prev.map((s) => ({ ...s, present })));
  };

  const removeStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
  };

  const exportCSV = () => {
    const header = "Name,Roll,Status";
    const rows = students.map(
      (s) => `"${s.name}","${s.roll}","${s.present ? "Present" : "Absent"}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName || "attendance"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const presentCount = students.filter((s) => s.present).length;
  const totalCount = students.length;

  return (
    <div className="min-h-screen p-6 md:p-10">
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
          <h1 className="text-xl font-bold uppercase tracking-tight">Attendance Sheet</h1>
        </div>
        {students.length > 0 && (
          <button onClick={exportCSV} className="brutal-btn-primary flex items-center gap-2 py-2">
            <Download className="w-4 h-4" strokeWidth={3} />
            Export CSV
          </button>
        )}
      </motion.header>

      {students.length === 0 ? (
        /* Upload State */
        <motion.div
          className="max-w-xl mx-auto mt-10"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className={`brutal-card text-center py-16 transition-colors ${
              dragActive ? "bg-primary/10 ring-2 ring-primary" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <div className="w-20 h-20 bg-muted brutal-border mx-auto mb-6 flex items-center justify-center">
              <Upload className="w-10 h-10 text-muted-foreground" strokeWidth={2} />
            </div>
            <h2 className="text-xl font-bold uppercase mb-2">Upload Student List</h2>
            <p className="font-mono text-sm text-muted-foreground mb-6">
              Drag & drop a CSV file or click to browse
            </p>
            <p className="font-mono text-xs text-muted-foreground mb-1">
              Format: Name, Roll Number (one per line)
            </p>

            <div className="flex flex-col items-center gap-4 mt-6">
              <label className="brutal-btn-primary cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 inline mr-2" strokeWidth={3} />
                Choose CSV File
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={onFileInput}
                />
              </label>

              <span className="font-mono text-xs text-muted-foreground">— or —</span>

              <button onClick={loadSample} className="brutal-btn-outline text-sm">
                Load Sample Data
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* Table State */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* Event Name + Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="font-bold text-xs uppercase tracking-wider mb-1.5 block">
                Event Name
              </label>
              <input
                className="brutal-input max-w-sm"
                placeholder="Spring Fest 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="brutal-border bg-accent p-3 text-center min-w-[80px]">
                <p className="font-bold text-xl text-accent-foreground">{presentCount}</p>
                <p className="font-mono text-[10px] text-accent-foreground/70 uppercase">Present</p>
              </div>
              <div className="brutal-border bg-muted p-3 text-center min-w-[80px]">
                <p className="font-bold text-xl">{totalCount - presentCount}</p>
                <p className="font-mono text-[10px] text-muted-foreground uppercase">Absent</p>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => markAll(true)} className="brutal-btn-outline py-1.5 px-3 text-xs flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5" strokeWidth={3} />
              Mark All Present
            </button>
            <button onClick={() => markAll(false)} className="brutal-btn-outline py-1.5 px-3 text-xs flex items-center gap-1">
              <UserX className="w-3.5 h-3.5" strokeWidth={3} />
              Mark All Absent
            </button>
          </div>

          {/* Table */}
          <div className="brutal-border overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[40px_1fr_120px_60px_40px] bg-foreground text-primary-foreground px-4 py-3 font-bold text-xs uppercase tracking-wider">
              <span>#</span>
              <span>Name</span>
              <span>Roll</span>
              <span>Status</span>
              <span></span>
            </div>
            {/* Rows */}
            <AnimatePresence>
              {students.map((student, i) => (
                <motion.div
                  key={student.id}
                  className={`grid grid-cols-[40px_1fr_120px_60px_40px] px-4 py-3 items-center border-b border-foreground/10 ${
                    student.present ? "bg-accent/10" : ""
                  }`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0, height: 0 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>
                  <span className="font-bold text-sm">{student.name}</span>
                  <span className="font-mono text-xs">{student.roll}</span>
                  <button
                    onClick={() => togglePresent(student.id)}
                    className="flex items-center"
                  >
                    {student.present ? (
                      <CheckSquare className="w-5 h-5 text-accent" strokeWidth={2.5} />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
                    )}
                  </button>
                  <button
                    onClick={() => removeStudent(student.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              {totalCount} students · {presentCount} present · {totalCount - presentCount} absent
            </p>
            <button
              onClick={() => setStudents([])}
              className="brutal-btn-outline py-1.5 px-3 text-xs flex items-center gap-1 text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={3} />
              Clear All
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AttendancePage;
