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

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);

app.post("/api/gemini", authenticateToken, async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                system_instruction: {
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
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        const message = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
        res.json({ message });
    } catch (err) {
        console.error("Full Error:", JSON.stringify(err.response?.data || err.message, null, 2));
        res.status(500).json({ error: "Failed to fetch from Gemini API" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));