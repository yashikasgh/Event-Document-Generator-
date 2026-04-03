import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, LoaderCircle, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { api, downloadBase64Pdf } from "@/lib/api";
import { COLLEGE_BRAND } from "@/lib/clubs";

interface Student {
  id: string;
  srNo?: string;
  admissionNo?: string;
  name: string;
  roll: string;
  year?: string;
  branch?: string;
  division?: string;
  selected?: boolean;
}

interface RosterRecord {
  id: string;
  fileName: string;
  uploadedAt: string;
  students: Student[];
  metadata: {
    sourceFile: string;
    rowsParsed: number;
    extractedColumns?: string[];
    years: string[];
    branches: string[];
    divisions: string[];
  };
}

const normalizeStudent = (student: Partial<Student>, index: number): Student => ({
  id: String(student.id || index + 1),
  srNo: student.srNo ? String(student.srNo) : "",
  admissionNo: student.admissionNo ? String(student.admissionNo) : student.roll ? String(student.roll) : "",
  name: student.name ? String(student.name) : "",
  roll: student.roll ? String(student.roll) : student.admissionNo ? String(student.admissionNo) : "",
  year: student.year ? String(student.year) : "",
  branch: student.branch ? String(student.branch) : "",
  division: student.division ? String(student.division) : "",
  selected: student.selected ?? true,
});

const normalizeRoster = (roster: Partial<RosterRecord>): RosterRecord => ({
  id: String(roster.id || `${Date.now()}`),
  fileName: String(roster.fileName || "Uploaded roster"),
  uploadedAt: String(roster.uploadedAt || new Date().toISOString()),
  students: Array.isArray(roster.students) ? roster.students.map((student, index) => normalizeStudent(student, index)) : [],
  metadata: {
    sourceFile: String(roster.metadata?.sourceFile || roster.fileName || "Uploaded roster"),
    rowsParsed: Number(roster.metadata?.rowsParsed || (Array.isArray(roster.students) ? roster.students.length : 0)),
    extractedColumns: Array.isArray(roster.metadata?.extractedColumns) ? roster.metadata.extractedColumns : [],
    years: Array.isArray(roster.metadata?.years) ? roster.metadata.years.map(String) : [],
    branches: Array.isArray(roster.metadata?.branches) ? roster.metadata.branches.map(String) : [],
    divisions: Array.isArray(roster.metadata?.divisions) ? roster.metadata.divisions.map(String) : [],
  },
});

const AttendancePage = () => {
  const [rosters, setRosters] = useState<RosterRecord[]>([]);
  const [selectedRosterId, setSelectedRosterId] = useState("");
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

  useEffect(() => {
    const hydrate = async () => {
      try {
        const response = await api.getAttendanceRosters();
        const rosterList = Array.isArray(response.rosters) ? response.rosters.map(normalizeRoster) : [];
        setRosters(rosterList);
        if (rosterList[0]) {
          setSelectedRosterId(rosterList[0].id);
          setStudents(rosterList[0].students);
          setYear("");
          setBranch("");
          setDivision("");
        }
      } catch {
        // Keep empty state if backend store is unavailable.
      }
    };

    hydrate();
  }, []);

  const selectedRoster = useMemo(
    () => rosters.find((roster) => roster.id === selectedRosterId) || null,
    [rosters, selectedRosterId]
  );

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
      const normalizedRoster = normalizeRoster(response.roster);
      setStudents(normalizedRoster.students);
      setRosters((previous) => [normalizedRoster, ...previous.filter((entry) => entry.id !== normalizedRoster.id)]);
      setSelectedRosterId(normalizedRoster.id);
      setYear("");
      setBranch("");
      setDivision("");
      setStatus(
        normalizedRoster.metadata.rowsParsed > 0
          ? `Parsed ${normalizedRoster.metadata.rowsParsed} students from ${normalizedRoster.metadata.sourceFile}.`
          : `No student rows were found in ${normalizedRoster.metadata.sourceFile}. Please check the file headers.`
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to parse file.");
    } finally {
      setIsParsing(false);
      event.target.value = "";
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
        instituteName: "Mahatma Education Society's",
        departmentName: branch ? `Department of ${branch}` : "Department",
        academicYear: "2025-26",
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
  const filterYears = selectedRoster?.metadata.years || [];
  const filterBranches = selectedRoster?.metadata.branches || [];
  const filterDivisions = selectedRoster?.metadata.divisions || [];

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
            <p className="mt-4 text-sm text-muted-foreground">
              Upload a CSV or Excel file with <span className="font-semibold">Sr.No</span>, <span className="font-semibold">Admission No</span>, and <span className="font-semibold">Name Of the Student</span>. The backend will convert it into a selectable roster.
            </p>
          {rosters.length > 0 ? (
              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Saved Rosters</label>
                <select
                  className="brutal-input"
                  value={selectedRosterId}
                  onChange={(event) => {
                    const rosterId = event.target.value;
                    setSelectedRosterId(rosterId);
                    const roster = rosters.find((entry) => entry.id === rosterId);
                    if (roster) {
                      setStudents(roster.students);
                      setYear("");
                      setBranch("");
                      setDivision("");
                    }
                  }}
                >
                  {rosters.map((roster) => (
                    <option key={roster.id} value={roster.id}>
                      {roster.fileName}
                    </option>
                  ))}
                </select>
                {selectedRoster?.metadata.extractedColumns?.length ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Extracted columns: {selectedRoster.metadata.extractedColumns.join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[
              ["collegeName", collegeName, setCollegeName, "College Name"],
              ["collegeAddress", collegeAddress, setCollegeAddress, "College Address"],
              ["clubName", clubName, setClubName, "Club Name"],
              ["eventTitle", eventTitle, setEventTitle, "Event Title"],
            ].map(([key, value, setter, label]) => (
              <div key={key}>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">{label}</label>
                <input className="brutal-input" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} />
              </div>
            ))}
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Year filter</label>
              <select className="brutal-input" value={year} onChange={(event) => setYear(event.target.value)}>
                <option value="">All years</option>
                {filterYears.map((entry) => (
                  <option key={entry}>{entry}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Branch filter</label>
              <select className="brutal-input" value={branch} onChange={(event) => setBranch(event.target.value)}>
                <option value="">All branches</option>
                {filterBranches.map((entry) => (
                  <option key={entry}>{entry}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider">Division filter</label>
              <select className="brutal-input" value={division} onChange={(event) => setDivision(event.target.value)}>
                <option value="">All divisions</option>
                {filterDivisions.map((entry) => (
                  <option key={entry}>{entry}</option>
                ))}
              </select>
            </div>
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
              <div className="grid grid-cols-[52px_72px_160px_1fr] gap-3 border-b-2 border-foreground pb-3 text-xs font-bold uppercase tracking-wider">
                <span>Select</span>
                <span>Sr.No</span>
                <span>Admission</span>
                <span>Name</span>
              </div>
              <div className="space-y-2 pt-3">
                {filteredStudents.map((student) => (
                  <button key={student.id} onClick={() => toggleStudent(student.id)} className="grid w-full grid-cols-[52px_72px_160px_1fr] gap-3 rounded-none border-2 border-foreground/15 bg-muted/10 p-3 text-left">
                    <span className="flex items-center">
                      <input
                        type="checkbox"
                        checked={!!student.selected}
                        onChange={() => toggleStudent(student.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 accent-black"
                      />
                    </span>
                    <span className="font-mono text-xs">{student.srNo || "-"}</span>
                    <span className="font-mono text-xs">{student.admissionNo || student.roll || "-"}</span>
                    <span className="font-medium">{student.name}</span>
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
