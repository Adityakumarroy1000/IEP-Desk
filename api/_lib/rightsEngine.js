import { LEGAL_DISCLAIMER } from "./disclaimer.js";

export function buildRightsPrompt({ profile }) {
  return `You are an expert special education advocate. Provide federal and ${profile.state} rights for the child. Return ONLY valid JSON with the exact schema below. No markdown.

Child context: ${profile.childName}, Grade: ${profile.grade}, State: ${profile.state}, Diagnoses: ${profile.diagnoses.join(", ")}.

Required JSON schema:
{
  "federalRights": [{
    "right": "string", "description": "string", "howToRequest": "string"
  }],
  "commonAccommodations": [{
    "accommodation": "string",
    "description": "string",
    "whoBenefits": "string — why this helps this specific diagnosis"
  }],
  "stateSpecific": [{
    "right": "string", "description": "string"
  }],
  "redFlags": ["string — common violations to watch for"],
  "questionsToAsk": ["string — specific meeting questions"],
  "disclaimer": "${LEGAL_DISCLAIMER}"
}`;
}
