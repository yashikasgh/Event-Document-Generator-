import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config.js";
import { clampText } from "../utils.js";

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
    return {
      source: "template",
      summary: `${payload.title || "This folder"} currently reflects an actual spend of ${payload.grandTotal || 0} against an expected allocation of ${payload.expectedBudget || 0}. The recorded entries indicate how the budget has been distributed across vendors, expense types, and supporting notes.`,
      insights: [
        payload.grandTotal > payload.expectedBudget
          ? "The folder is currently above the planned budget and should be reviewed for controllable overspend."
          : "The folder is currently within the planned budget and remains financially manageable.",
        "Review the largest expense entries first, since they will have the biggest effect on savings or reallocation.",
        "Compare vendor-specific spending to identify whether repeat vendors are increasing total cost.",
        "Keep notes and payment methods updated so future audit and reporting flows stay accurate.",
      ],
      recommendation:
        payload.grandTotal > payload.expectedBudget
          ? "It is recommended to freeze non-essential spending in this folder until the overspending categories are validated."
          : "It is recommended to continue using this folder structure and maintain regular review checkpoints as new expenses are added.",
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
