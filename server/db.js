import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../db.json');

export const readDb = async () => {
    try {
        const data = await fs.readFile(dbPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { users: [], chats: [] };
    }
};

export const writeDb = async (data) => {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

export const findUserByEmail = async (email) => {
    const db = await readDb();
    return db.users.find(u => u.email === email);
};

export const findUserById = async (id) => {
    const db = await readDb();
    return db.users.find(u => u.id === id);
};

export const saveUser = async (user) => {
    const db = await readDb();
    db.users.push(user);
    await writeDb(db);
    return user;
};

export const getChatsByUserId = async (userId) => {
    const db = await readDb();
    return db.chats.filter(c => c.userId === userId);
};

export const saveChat = async (chat) => {
    const db = await readDb();
    const index = db.chats.findIndex(c => c.id === chat.id);
    if (index > -1) {
        db.chats[index] = chat;
    } else {
        db.chats.push(chat);
    }
    await writeDb(db);
    return chat;
};

export const deleteChat = async (chatId, userId) => {
    const db = await readDb();
    db.chats = db.chats.filter(c => !(c.id === chatId && c.userId === userId));
    await writeDb(db);
};

export const clearUserChats = async (userId) => {
    const db = await readDb();
    db.chats = db.chats.filter(c => c.userId !== userId);
    await writeDb(db);
};
