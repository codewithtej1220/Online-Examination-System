/**
 * Optional LLM access (Google Gemini REST API).
 * Everything that uses this has an offline fallback, so the app works without a key.
 * Configure with GEMINI_API_KEY and optionally GEMINI_MODEL in .env.
 */
const axios = require("axios");
const logger = require("../utils/logger");

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
}

function modelName() {
    return process.env.GEMINI_MODEL || "gemini-2.5-flash";
}

async function generate({ system, messages, json = false, temperature = 0.6 }) {
    const response = await axios.post(
        `${API_BASE}/${modelName()}:generateContent`,
        {
            systemInstruction: system ? { parts: [{ text: system }] } : undefined,
            contents: messages.map((message) => ({
                role: message.role === "assistant" ? "model" : "user",
                parts: [{ text: message.text }]
            })),
            generationConfig: {
                temperature,
                ...(json && { responseMimeType: "application/json" })
            }
        },
        {
            // Key goes in a header, never in the URL, so it can't leak into logs
            headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
            timeout: 30000
        }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("") || "";
    if (!text) throw new Error("Empty response from language model");
    return text;
}

/** Returns parsed JSON, or throws. */
async function generateJSON(prompt, system) {
    const text = await generate({ system, messages: [{ role: "user", text: prompt }], json: true, temperature: 0.7 });
    return JSON.parse(text);
}

/** Returns the reply text, or null when unavailable/failed (caller falls back). */
async function chat(system, messages) {
    if (!isConfigured()) return null;
    try {
        return await generate({ system, messages });
    } catch (error) {
        logger.warn(`LLM chat failed, using offline assistant: ${error.message}`);
        return null;
    }
}

module.exports = { isConfigured, generateJSON, chat, modelName };
