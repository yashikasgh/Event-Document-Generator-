import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";
import { clampText } from "../utils.js";

const formatInr = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const createProposalPrompt = (payload) => `
You are writing a formal college event proposal body.

Write 4 detailed professional paragraphs for an event proposal.
Keep the tone formal, administrative, and suitable for submission to college authorities.
Do not include headings, bullet points, signatures, salutations, or placeholders.
Use only the information provided below and expand it into polished proposal language.

College: ${payload.collegeName || "Pillai College of Engineering"}
Club: ${payload.clubName || "Student Club"}
Event title: ${payload.eventTitle || "Event"}
Event date: ${payload.eventDate || "To be announced"}
Venue: ${payload.venue || "College campus"}
Addressed to: ${payload.authorityName || "Respective authority"}
Subject: ${payload.subject || "Event proposal"}
Target audience: ${payload.targetAudience || "Students and faculty"}
Budget: ${payload.budget || "To be finalized"}
Objective: ${clampText(payload.objective || "", 700)}
Event summary: ${clampText(payload.eventSummary || "", 1200)}
Key points: ${(payload.keyPoints || []).join(", ")}
`.trim();

const fallbackProposalParagraphs = (payload) => [
  `This proposal is submitted on behalf of ${payload.clubName} for organizing the event "${payload.eventTitle}" at ${payload.venue || "the college venue"} on ${payload.eventDate || "the proposed date"}. The event is intended for ${payload.targetAudience || "students and faculty members"} and has been planned to create a structured and meaningful learning experience within the college environment.`,
  `The primary objective of the event is to ${payload.objective || "create a valuable academic and co-curricular experience for participants"}. Based on the details provided, the event will include ${payload.eventSummary || "well-coordinated activities, guided participation, and institution-aligned execution"} so that the intended outcomes are achieved in a professional and engaging manner.`,
  `The estimated budget for the event is ${payload.budget ? `Rs. ${Number(payload.budget).toLocaleString("en-IN")}` : "to be finalized"}. Administrative approval is requested for venue allocation, scheduling support, permissions, and any related logistics required for smooth execution. The organizing team will ensure that the event is conducted with discipline, proper coordination, and institutional compliance.`,
  `Through this event, ${payload.clubName} aims to contribute positively to student development and campus engagement. We therefore request approval to proceed with the proposed plan and assure that all arrangements, reporting, and post-event documentation will be carried out responsibly under faculty guidance.`,
];

export const generateProposalNarrative = async (payload) => {
  if (!config.geminiApiKey) {
    return {
      paragraphs: fallbackProposalParagraphs(payload),
      prompt: createProposalPrompt(payload),
      source: "template",
    };
  }

  try {
    const client = new GoogleGenerativeAI(config.geminiApiKey);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = createProposalPrompt(payload);
    const result = await model.generateContent([{ text: prompt }]);
    const text = result.response.text().trim();
    const paragraphs = text
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .slice(0, 4);

    return {
      paragraphs: paragraphs.length > 0 ? paragraphs : fallbackProposalParagraphs(payload),
      prompt,
      source: "gemini",
    };
  } catch {
    return {
      paragraphs: fallbackProposalParagraphs(payload),
      prompt: createProposalPrompt(payload),
      source: "template",
    };
  }
};

const generateTextWithGemini = async (prompt) => {
  if (!config.geminiApiKey) {
    return null;
  }

  try {
    const client = new GoogleGenerativeAI(config.geminiApiKey);
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([{ text: prompt }]);
    return result.response.text().trim();
  } catch {
    return null;
  }
};

export const generateBudgetAnalysisNarrative = async (payload) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const expectedBudget = Number(payload.expectedBudget || 0);
  const actualSpend = Number(payload.grandTotal || 0);
  const variance = actualSpend - expectedBudget;
  const largestExpense = items.reduce(
    (largest, item) => (Number(item.amount || 0) > Number(largest?.amount || 0) ? item : largest),
    items[0] || null
  );
  const vendorTotals = items.reduce((map, item) => {
    const key = item.vendorName || payload.vendor || "Unknown vendor";
    map.set(key, (map.get(key) || 0) + Number(item.amount || 0));
    return map;
  }, new Map());
  const topVendorEntry = [...vendorTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const expenseTypeTotals = items.reduce((map, item) => {
    const key = item.expenseType || "General";
    map.set(key, (map.get(key) || 0) + Number(item.amount || 0));
    return map;
  }, new Map());
  const topExpenseTypeEntry = [...expenseTypeTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const overspendText =
    variance > 0
      ? `The folder is overspent by ${formatInr(variance)} compared with the approved budget.`
      : variance < 0
        ? `The folder is under budget by ${formatInr(Math.abs(variance))}, which leaves room for pending operational costs.`
        : "The folder is exactly on the approved budget.";
  const prompt = `
You are an analyst for a college budget management system.

Analyze the following budget folder data and return:
1. A short executive summary paragraph.
2. 4 concise actionable insights.
3. A final recommendation paragraph.

Keep it professional and useful for faculty or student committee review.
Do not use markdown.

Folder title: ${payload.title || "Untitled folder"}
Category: ${payload.category || "General"}
Expected budget: ${payload.expectedBudget || 0}
Actual spend: ${payload.grandTotal || 0}
Budget variance: ${variance}
Vendor: ${payload.vendor || "Unknown"}
Description: ${clampText(payload.description || "", 800)}
Expenses:
${(payload.items || [])
  .map((item, index) => `${index + 1}. ${item.label} | amount ${item.amount} | vendor ${item.vendorName || "Unknown"} | type ${item.expenseType} | notes ${item.notes || "None"}`)
  .join("\n")}

If there is uploaded csv content, use it too:
${clampText(payload.csvSummary || "No CSV uploaded.", 2000)}
`.trim();

  const text = await generateTextWithGemini(prompt);
  if (!text) {
    const summaryParts = [
      `${payload.title || "This folder"} in the ${payload.category || "general"} category has recorded ${formatInr(actualSpend)} against an expected allocation of ${formatInr(expectedBudget)}.`,
      largestExpense ? `The largest single expense is ${largestExpense.label} at ${formatInr(largestExpense.amount)}.` : null,
      topVendorEntry ? `${topVendorEntry[0]} accounts for the highest vendor outflow at ${formatInr(topVendorEntry[1])}.` : null,
    ].filter(Boolean);

    return {
      source: "template",
      summary: summaryParts.join(" "),
      insights: [
        overspendText,
        largestExpense
          ? `${largestExpense.label} is the cost driver in this folder, contributing ${formatInr(largestExpense.amount)} to the spend profile.`
          : "This folder does not have enough expense entries yet to identify a dominant cost driver.",
        topExpenseTypeEntry
          ? `${topExpenseTypeEntry[0]} is the highest spending expense type at ${formatInr(topExpenseTypeEntry[1])}, so this is the first area to audit for savings or reallocation.`
          : "Expense-type tagging is still limited, so category-wise spend insights will improve as more entries are added.",
        topVendorEntry
          ? `${topVendorEntry[0]} is the most expensive vendor touchpoint so far, which makes it the best candidate for rate comparison or negotiation.`
          : "Vendor-level comparison is not available yet because the expense entries do not have enough vendor detail.",
      ],
      recommendation:
        variance > 0
          ? `Freeze non-essential additions in ${payload.title || "this folder"} until ${topExpenseTypeEntry?.[0] || "the main spend category"} is reviewed and the overspend of ${formatInr(variance)} is justified or reduced.`
          : `Continue tracking ${payload.title || "this folder"} with the current structure, and use the remaining ${formatInr(Math.abs(Math.min(variance, 0)))} strategically for pending items or contingency coverage.`,
    };
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    source: "gemini",
    summary: lines[0] || text,
    insights: lines.slice(1, 5),
    recommendation: lines.slice(5).join(" ") || lines[lines.length - 1] || text,
  };
};

export const generateBudgetEstimateNarrative = async (payload) => {
  const prompt = `
You are estimating a new college event budget using past event spending history.

Event type: ${payload.eventType}
Expected attendees: ${payload.attendees}

Historical folders:
${(payload.history || [])
  .map((record, index) => `${index + 1}. ${record.title} | category ${record.category} | expected ${record.expectedBudget || 0} | spent ${record.grandTotal || 0}`)
  .join("\n")}

Return:
1. One short summary paragraph.
2. A suggested total estimate as a plain number.
3. Four short breakdown items for Lighting, Food, Logistics, Misc.
4. Two practical recommendations.

Keep it plain text.
`.trim();

  const text = await generateTextWithGemini(prompt);
  if (!text) {
    const averageSpend =
      payload.history && payload.history.length > 0
        ? payload.history.reduce((sum, record) => sum + Number(record.grandTotal || 0), 0) / payload.history.length
        : 100000;
    const attendeeFactor = Math.max(Number(payload.attendees || 0), 1) * 220;
    const estimate = Math.round((averageSpend + attendeeFactor) / 2);
    return {
      source: "template",
      summary: `The estimate is based on previous ${payload.eventType} and related event records, adjusted for an audience size of ${payload.attendees}.`,
      estimatedTotal: estimate,
      breakdown: {
        Lighting: Math.round(estimate * 0.18),
        Food: Math.round(estimate * 0.32),
        Logistics: Math.round(estimate * 0.24),
        Misc: Math.round(estimate * 0.12),
      },
      recommendations: [
        "Lock the major vendors early to avoid last-minute pricing changes.",
        "Keep a contingency amount outside the visible line items for operational flexibility.",
      ],
    };
  }

  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const estimateMatch = text.match(/(\d[\d,]*)/);
  const estimatedTotal = estimateMatch ? Number(estimateMatch[1].replace(/,/g, "")) : 100000;
  return {
    source: "gemini",
    summary: lines[0] || text,
    estimatedTotal,
    breakdown: {
      Lighting: Math.round(estimatedTotal * 0.18),
      Food: Math.round(estimatedTotal * 0.32),
      Logistics: Math.round(estimatedTotal * 0.24),
      Misc: Math.round(estimatedTotal * 0.12),
    },
    recommendations: lines.slice(-2),
  };
};
