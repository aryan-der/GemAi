import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chats.js";
import { authenticateToken } from "./middleware.js";

dotenv.config({ path: "../.env" });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let cachedModelId = null;
let cachedModelIdAt = 0;
const MODEL_CACHE_MS = 10 * 60 * 1000; // 10 minutes

async function resolveGeminiModelId() {
    // Allow explicit override
    if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL;

    // Cache
    if (cachedModelId && Date.now() - cachedModelIdAt < MODEL_CACHE_MS) return cachedModelId;

    // Discover available models for this API key
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const res = await axios.get(url, { headers: { "Content-Type": "application/json" } });
    const models = res.data?.models || [];

    const generateContentModels = models.filter(
        (m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes("generateContent")
    );

    // Prefer common fast chat-capable models if present, otherwise take first supported one.
    const preferredOrder = [
        "models/gemini-2.0-flash",
        "models/gemini-2.0-flash-lite",
        "models/gemini-1.5-flash",
        "models/gemini-1.5-pro",
    ];
    const preferred =
        preferredOrder
            .map((name) => generateContentModels.find((m) => m.name === name))
            .find(Boolean) || null;

    const candidate = preferred || generateContentModels[0] || models[0];

    // Model "name" comes back like "models/gemini-1.5-flash"
    cachedModelId = candidate?.name || "models/gemini-1.5-flash";
    cachedModelIdAt = Date.now();
    return cachedModelId;
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);

// Optional debug endpoint to see what models your key supports
app.get("/api/gemini/models", authenticateToken, async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API key not configured" });
        }
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
        const response = await axios.get(url, { headers: { "Content-Type": "application/json" } });
        res.json(response.data);
    } catch (err) {
        const errorMessage = err.response?.data?.error?.message || "Failed to list models";
        res.status(500).json({ error: errorMessage });
    }
});

app.post("/api/gemini", authenticateToken, async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is not set in environment variables");
        return res.status(500).json({ error: "API key not configured" });
    }

    try {
        const makeBody = () => ({
            systemInstruction: {
                parts: [{
                    text: `You are GemAI, a powerful AI assistant. 
DETERMINE if the user wants to generate an image or see a picture.
- If YES: Extract the core subject and return ONLY a markdown image tag in this EXACT format: ![description](https://pollinations.ai/p/subject_name?width=1024&height=1024&seed=RANDOM_SEED&nologo=true). Replace 'subject_name' with a URL-encoded descriptive prompt and 'RANDOM_SEED' with a random integer. Do NOT include any other text.
- If NO: Respond to the user's query normally as a helpful AI assistant.`
                }]
            },
            contents: [{
                parts: [{ text: prompt }]
            }]
        });

        const postToGemini = async (modelName) => {
            return await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${process.env.GEMINI_API_KEY}`,
                makeBody(),
                { headers: { "Content-Type": "application/json" } }
            );
        };

        let modelName = await resolveGeminiModelId(); // e.g. "models/gemini-1.5-flash"
        let response;
        try {
            response = await postToGemini(modelName);
        } catch (err) {
            const msg = err.response?.data?.error?.message || "";
            const isModelNotFound =
                err.response?.status === 404 ||
                /model.*not found/i.test(msg) ||
                /not supported/i.test(msg);

            // If our cached model is invalid for this key, clear cache and retry with a fresh discovery.
            if (isModelNotFound && !process.env.GEMINI_MODEL) {
                cachedModelId = null;
                cachedModelIdAt = 0;
                modelName = await resolveGeminiModelId();
                response = await postToGemini(modelName);
            } else {
                throw err;
            }
        }

        const message = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        res.json({ message });
    } catch (err) {
        console.error("Gemini API Error Details:");
        console.error("Status:", err.response?.status);
        console.error("Data:", JSON.stringify(err.response?.data, null, 2));
        console.error("Message:", err.message);

        const errorMessage = err.response?.data?.error?.message || "Failed to fetch from Gemini API";
        res.status(500).json({ error: errorMessage });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));