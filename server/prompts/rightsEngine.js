import { LEGAL_DISCLAIMER } from "../services/disclaimer.js";

export function buildRightsPrompt({ profile }) {
  return `You are an expert special education advocate. Provide federal and ${profile.state} rights for the child. Return ONLY valid JSON with the exact schema below. No markdown.\n\nChild context: ${profile.childName}, Grade: ${profile.grade}, State: ${profile.state}, Diagnoses: ${profile.diagnoses.join(", ")}.\n\nRequired JSON schema:\n{\n  "federalRights": [{\n    "right": "string", "description": "string", "howToRequest": "string"\n  }],\n  "commonAccommodations": [{\n    "accommodation": "string",\n    "description": "string",\n    "whoBenefits": "string — why this helps this specific diagnosis"\n  }],\n  "stateSpecific": [{\n    "right": "string", "description": "string"\n  }],\n  "redFlags": ["string — common violations to watch for"],\n  "questionsToAsk": ["string — specific meeting questions"],\n  "disclaimer": "${LEGAL_DISCLAIMER}"\n}`;
}
