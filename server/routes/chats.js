import express from 'express';
import { getChatsByUserId, saveChat, deleteChat, clearUserChats } from '../db.js';
import { authenticateToken } from '../middleware.js';

const router = express.Router();

// Get all chats for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const chats = await getChatsByUserId(req.user.id);
        // Sort by updated timestamp descending and return last 5 or all? 
        // User asked for "display last 5 history" but we should return all and let frontend decide or handle pagination.
        res.json(chats.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch chats" });
    }
});

// Create or update a chat session
router.post('/', authenticateToken, async (req, res) => {
    const { id, title, messages } = req.body;
    if (!messages) return res.status(400).json({ error: "Messages are required" });

    const chat = {
        id: id || Date.now().toString(),
        userId: req.user.id,
        title: title || messages[0]?.content?.substring(0, 30) || "New Chat",
        messages,
        updatedAt: Date.now()
    };

    try {
        await saveChat(chat);
        res.status(201).json(chat);
    } catch (err) {
        res.status(500).json({ error: "Failed to save chat" });
    }
});

// Delete a specific chat
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        await deleteChat(req.params.id, req.user.id);
        res.json({ message: "Chat deleted" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete chat" });
    }
});

// Clear all chats for user
router.delete('/', authenticateToken, async (req, res) => {
    try {
        await clearUserChats(req.user.id);
        res.json({ message: "All chats cleared" });
    } catch (err) {
        res.status(500).json({ error: "Failed to clear chats" });
    }
});

export default router;
