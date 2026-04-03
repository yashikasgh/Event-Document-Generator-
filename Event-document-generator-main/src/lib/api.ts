const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8787/api";

type JsonOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function requestJson<T>(path: string, options: JsonOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed");
  }

  return response.json();
}

export const api = {
  health: () => requestJson<{ ok: boolean; service: string; date: string }>("/health"),
  generateProposal: (body: unknown) =>
    requestJson<{ fileName: string; pdfBase64: string; summary: Record<string, unknown>; narrative: string[] }>("/documents/proposal", {
      method: "POST",
      body,
    }),
  generateReport: (body: unknown) => requestJson<{ fileName: string; pdfBase64: string; summary: Record<string, unknown> }>("/documents/report", { method: "POST", body }),
  generateFlyer: (body: unknown) =>
    requestJson<{ prompt: string; provider: string; status: string; message?: string; creativeBrief?: string; imageBase64?: string | null }>("/flyers/generate", {
      method: "POST",
      body,
    }),
  analyzeBudget: (body: unknown) => requestJson<Record<string, unknown>>("/budget/analyze", { method: "POST", body }),
  generateTimeline: (body: unknown) => requestJson<{ timeline: Array<Record<string, unknown>> }>("/timelines/generate", { method: "POST", body }),
  compileSummary: (body: unknown) => requestJson<Record<string, unknown>>("/post-event/summary", { method: "POST", body }),
  parseAttendance: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/attendance/parse`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || "Attendance parsing failed");
    }

    return response.json() as Promise<{
      students: Array<{ id: string; name: string; roll: string; year?: string; branch?: string; division?: string; selected?: boolean }>;
      metadata: { sourceFile: string; rowsParsed: number; years: string[]; branches: string[]; divisions: string[] };
    }>;
  },
  exportAttendance: (body: unknown) => requestJson<{ fileName: string; pdfBase64: string }>("/attendance/export", { method: "POST", body }),
};

export const downloadBase64Pdf = (base64: string, fileName: string) => {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export const base64PdfToObjectUrl = (base64: string) => {
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  return URL.createObjectURL(blob);
};
