import { LEGAL_DISCLAIMER } from "../services/disclaimer.js";

const MAX_IEP_TEXT_CHARS = Number(process.env.MAX_IEP_TEXT_CHARS || 60000);

function clampIEPText(text) {
  const normalized = String(text || "").trim();
  if (normalized.length <= MAX_IEP_TEXT_CHARS) return normalized;
  return `${normalized.slice(0, MAX_IEP_TEXT_CHARS)}\n\n[TRUNCATED: original IEP text exceeded ${MAX_IEP_TEXT_CHARS} characters]`;
}

export function buildAnalyzeIEPPrompt({ profile, extractedText }) {
  const safeText = clampIEPText(extractedText);

  return `You are an expert special education advocate. Analyze the IEP text and return ONLY valid JSON with the exact schema below. Do not include markdown or extra commentary.\n\nChild context: ${profile.childName}, Grade: ${profile.grade}, State: ${profile.state}, Diagnoses: ${profile.diagnoses.join(", ")}.\n\nIEP TEXT:\n${safeText}\n\nRequired JSON schema:\n{\n  "summary": "string - 2-3 sentence plain English summary",\n  "overallScore": {\n    "score": number (1-10),\n    "explanation": "string - one sentence why this score"\n  },\n  "currentLevel": {\n    "summary": "string - where is child right now",\n    "concerns": ["string", "string"]\n  },\n  "goalsAnalysis": [{\n    "goal": "exact goal text as written",\n    "quality": "strong OR weak OR needs improvement",\n    "problem": "string - what is wrong, null if none",\n    "improvedVersion": "string - better version",\n    "plainEnglish": "string - what this means simply"\n  }],\n  "servicesAnalysis": [{\n    "service": "string", "frequency": "string",\n    "concern": "string or null", "plainEnglish": "string"\n  }],\n  "accommodationsAnalysis": {\n    "provided": ["string"],\n    "missing": ["string - accommodations not present but needed"],\n    "explanation": "string"\n  },\n  "redFlags": [{\n    "issue": "string", "whyItMatters": "string", "whatToDo": "string"\n  }],\n  "actionItems": ["string"],\n  "disclaimer": "${LEGAL_DISCLAIMER}"\n}`;
}
