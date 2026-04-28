import { LEGAL_DISCLAIMER } from "./disclaimer.js";

function getModels() {
  const configuredList = (process.env.OPENROUTER_MODELS || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
  if (configuredList.length) return configuredList;

  const singleModel = (process.env.OPENROUTER_MODEL || "").trim();
  if (singleModel) return [singleModel];

  return ["openrouter/free"];
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");
    return JSON.parse(match[0]);
  }
}

function enforceDisclaimer(obj) {
  if (!obj.disclaimer) {
    obj.disclaimer = LEGAL_DISCLAIMER;
  }
  return obj;
}

async function callModel(model, prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY missing");

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter error: ${errText}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty model response");
  return content;
}

export async function runOpenRouter(prompt) {
  const models = getModels();
  let lastError;
  for (let i = 0; i < models.length; i += 1) {
    const model = models[i];
    try {
      const raw = await callModel(model, prompt);
      const parsed = extractJson(raw);
      return enforceDisclaimer(parsed);
    } catch (err) {
      lastError = err;
      await sleep(500 * (i + 1) ** 2);
    }
  }
  const error = new Error(lastError?.message || "All models failed");
  error.statusCode = 503;
  throw error;
}
