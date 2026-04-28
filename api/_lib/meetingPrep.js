import { LEGAL_DISCLAIMER } from "./disclaimer.js";

export function buildMeetingPrompt({ profile, analysis, meetingType }) {
  return `You are an expert special education advocate. Create a meeting prep kit for a ${meetingType} meeting. Return ONLY valid JSON with the exact schema below. No markdown.

Child context: ${profile.childName}, Grade: ${profile.grade}, State: ${profile.state}, Diagnoses: ${profile.diagnoses.join(", ")}.

IEP Analysis Summary: ${analysis?.summary || ""}.

Required JSON schema:
{
  "meetingOverview": "string — 2-3 sentences what to expect",
  "keyQuestions": [{
    "question": "string — exact words to say",
    "whyImportant": "string",
    "goodAnswer": "string — what school should say",
    "redFlagAnswer": "string — what to watch out for"
  }],
  "pushbackScripts": [{
    "situation": "string — when school says X",
    "whatToSay": "string — exact words",
    "legalBasis": "string — the law that supports this"
  }],
  "rightsReminder": ["string"],
  "emailTemplates": {
    "beforeMeeting": { "subject": "string", "body": "string" },
    "afterMeeting": { "subject": "string", "body": "string" },
    "ifSchoolSaysNo": { "subject": "string", "body": "string" }
  },
  "checklist": {
    "bringToMeeting": ["string"],
    "beforeMeeting": ["string"],
    "afterMeeting": ["string"]
  },
  "disclaimer": "${LEGAL_DISCLAIMER}"
}`;
}
