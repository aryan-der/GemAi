import React, { useState } from "react";

const InputForm = ({ onNewResponse }) => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input) return;
        setLoading(true);

        try {
            const res = await fetch("http://localhost:5000/api/gemini", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: input }),
            });
            const data = await res.json();
            const message = data.message || "No response";
            onNewResponse({ input, message });
            setInput("");
        } catch (err) {
            console.error(err);
            onNewResponse({ input, message: "Error: Unable to get response" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="w-full p-4 rounded-lg border border-gray-300 focus:ring-1 focus:ring-indigo-100 focus:outline-none shadow-sm"
                rows={4}
            />
            <button
                type="submit"
                className={`bg-indigo-600 text-white font-semibold py-3 rounded-lg shadow-md hover:bg-indigo-700 transition ${loading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                disabled={loading}
            >
                {loading ? "Generating..." : "Ask AI"}
            </button>
        </form>
    );
};

export default InputForm;
