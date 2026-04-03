import { ChangeEvent, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, LoaderCircle, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { api, downloadBase64Pdf } from "@/lib/api";
import { COLLEGE_BRAND } from "@/lib/clubs";

interface Student {
  id: string;
  name: string;
  roll: string;
  year?: string;
  branch?: string;
  division?: string;
  selected?: boolean;
}

const AttendancePage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [clubName, setClubName] = useState("");
  const [collegeName, setCollegeName] = useState(COLLEGE_BRAND.name);
  const [collegeAddress, setCollegeAddress] = useState(COLLEGE_BRAND.address);
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");
  const [division, setDivision] = useState("");
  const [status, setStatus] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          (!year || student.year === year) &&
          (!branch || student.branch === branch) &&
          (!division || student.division === division)
      ),
    [branch, division, students, year]
  );

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsParsing(true);
    setStatus("");

    try {
      const response = await api.parseAttendance(file);
      setStudents(response.students.map((student) => ({ ...student, selected: true })));
      setStatus(`Parsed ${response.metadata.rowsParsed} students from ${response.metadata.sourceFile}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to parse file.");
    } finally {
      setIsParsing(false);
    }
  };

  const toggleStudent = (id: string) => {
    setStudents((previous) =>
      previous.map((student) => (student.id === id ? { ...student, selected: !student.selected } : student))
    );
  };

  const toggleAllVisible = (selected: boolean) => {
    const visibleIds = new Set(filteredStudents.map((student) => student.id));
    setStudents((previous) =>
      previous.map((student) => (visibleIds.has(student.id) ? { ...student, selected } : student))
    );
  };

  const exportAttendance = async () => {
    setIsExporting(true);
    setStatus("");

    try {
      const response = await api.exportAttendance({
        collegeName,
        collegeAddress,
        clubName,
        eventTitle,
        year,
        branch,
        division,
        students: filteredStudents.filter((student) => student.selected),
      });
      downloadBase64Pdf(response.pdfBase64, response.fileName);
      setStatus("Attendance sheet PDF exported successfully.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to export attendance sheet.");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedCount = filteredStudents.filter((student) => student.selected).length;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <motion.header className="mb-8 flex items-center justify-between" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="brutal-btn-outline flex items-center gap-1 px-3 py-2 text-xs">
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Back
          </Link>
          <h1 className="text-xl font-bold uppercase tracking-tight">Attendance Sheets</h1>
        </div>
        <button onClick={exportAttendance} className="brutal-btn-primary flex items-center gap-2 py-2" disabled={filteredStudents.length === 0 || isExporting}>
          {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={2.5} /> : <Download className="h-4 w-4" strokeWidth={3} />}
          Export PDF
        </button>
      </motion.header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <motion.div className="space-y-4" initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="brutal-card">
            <label className="brutal-btn-secondary inline-flex cursor-pointer items-center gap-2">
              <Upload className="h-4 w-4" strokeWidth={3} />
              {isParsing ? "Parsing..." : "Upload CSV / Excel"}
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleUpload} />
            </label>
            <p className="mt-4 text-sm text-muted-foreground">Upload a class list with columns like name, roll number, year, branch, or division. The backend will normalize it into a selectable roster.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["collegeName", collegeName, setCollegeName, "College Name"],
              ["collegeAddress", collegeAddress, setCollegeAddress, "College Address"],
              ["clubName", clubName, setClubName, "Club Name"],
              ["eventTitle", eventTitle, setEventTitle, "Event Title"],
              ["year", year, setYear, "Year filter"],
              ["branch", branch, setBranch, "Branch filter"],
              ["division", division, setDivision, "Division filter"],
            ].map(([key, value, setter, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">{label}</label>
                <input className="brutal-input" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} />
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => toggleAllVisible(true)} className="brutal-btn-outline py-2 text-xs">
              Select Visible
            </button>
            <button onClick={() => toggleAllVisible(false)} className="brutal-btn-outline py-2 text-xs">
              Deselect Visible
            </button>
          </div>

          {status ? <p className="font-mono text-xs text-muted-foreground">{status}</p> : null}
        </motion.div>

        <motion.div initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <div className="brutal-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">Student List</p>
                <p className="mt-2 text-sm text-muted-foreground">{filteredStudents.length} visible, {selectedCount} selected for export.</p>
              </div>
            </div>

            <div className="max-h-[640px] overflow-y-auto">
              <div className="grid grid-cols-[52px_1fr_120px_70px] gap-3 border-b-2 border-foreground pb-3 text-xs font-bold uppercase tracking-wider">
                <span>Select</span>
                <span>Name</span>
                <span>Roll</span>
                <span>Meta</span>
              </div>
              <div className="space-y-2 pt-3">
                {filteredStudents.map((student) => (
                  <button key={student.id} onClick={() => toggleStudent(student.id)} className="grid w-full grid-cols-[52px_1fr_120px_70px] gap-3 rounded-none border-2 border-foreground/15 bg-muted/10 p-3 text-left">
                    <span className="font-bold">{student.selected ? "Yes" : "No"}</span>
                    <span className="font-medium">{student.name}</span>
                    <span className="font-mono text-xs">{student.roll}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{[student.year, student.branch, student.division].filter(Boolean).join(" / ") || "-"}</span>
                  </button>
                ))}
                {filteredStudents.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Upload a roster to start building the attendance sheet.</p> : null}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AttendancePage;
