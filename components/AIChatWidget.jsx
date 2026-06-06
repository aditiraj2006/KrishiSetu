import React, { useState } from 'react';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: 'ai', text: 'Hi! I am your KrishiSetu assistant. How can I help you today?' }]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages([...messages, userMsg]);
    setInput('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } catch (error) {
      console.error("Error fetching AI response", error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen && (
        <div className="w-80 h-96 bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col overflow-hidden mb-4">
          <div className="bg-[#2D8C4E] text-white p-3 font-bold">KrishiSetu Assistant</div>
          <div className="flex-1 p-3 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`mb-2 ${msg.role === 'ai' ? 'text-left text-gray-700' : 'text-right text-[#2D8C4E]'}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <div className="p-2 border-t flex">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border rounded p-2 text-sm" 
              placeholder="Ask about prices, conditions..."
            />
            <button onClick={handleSend} className="ml-2 bg-[#2D8C4E] text-white px-3 py-1 rounded">Send</button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#2D8C4E] text-white rounded-full p-4 shadow-lg hover:bg-green-700 transition-colors float-right"
      >
        💬
      </button>
    </div>
  );
}
