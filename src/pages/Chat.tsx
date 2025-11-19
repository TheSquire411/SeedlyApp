import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Bot, Send } from 'lucide-react';
import { ChatMessage, AppContextType } from '../types';
import { createGardenChat } from '../services/gemini';
import { Chat as GeminiChat, GenerateContentResponse } from "@google/genai";

const Chat: React.FC = () => {
  const { user, plants } = useOutletContext<AppContextType>();
  
  const [messages, setMessages] = useState<ChatMessage[]>([
      { id: '1', role: 'model', text: 'Hi! I\'m Seedly. Ask me anything about your garden or gardening in general! 🌿', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatTyping, setIsChatTyping] = useState(false);
  const chatSession = useRef<GeminiChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      if (!chatSession.current) {
          chatSession.current = createGardenChat(plants, user.location);
      }
  }, [plants, user.location]);

  useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
      if (!inputMessage.trim() || !chatSession.current) return;

      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: inputMessage,
          timestamp: new Date()
      };

      setMessages(prev => [...prev, userMsg]);
      setInputMessage("");
      setIsChatTyping(true);

      try {
          const response: GenerateContentResponse = await chatSession.current.sendMessage({ message: userMsg.text });
          
          const modelMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: response.text,
              timestamp: new Date()
          };
          setMessages(prev => [...prev, modelMsg]);
      } catch (error) {
          console.error("Chat error", error);
          const errorMsg: ChatMessage = {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: "I'm having trouble connecting to the garden network. Please try again.",
              timestamp: new Date()
          };
           setMessages(prev => [...prev, errorMsg]);
      } finally {
          setIsChatTyping(false);
      }
  }

  return (
    <div className="min-h-full flex flex-col pb-32 relative">
        <div className="sticky top-0 bg-[#F3F4F6] z-10 pb-4 pt-2">
             <h1 className="text-3xl font-bold text-gray-800">Garden Assistant</h1>
             <p className="text-gray-500">Ask me anything about your plants!</p>
        </div>

        <div className="flex-1 space-y-4 pb-4">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white mr-2 flex-shrink-0">
                            <Bot size={18} />
                        </div>
                    )}
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                        ? 'bg-lime-500 text-white rounded-br-none shadow-lg shadow-lime-200' 
                        : 'bg-white text-gray-700 rounded-bl-none shadow-sm border border-gray-100'
                    }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                </div>
            ))}
            {isChatTyping && (
                 <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center text-white mr-2">
                        <Bot size={18} />
                    </div>
                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex gap-1 items-center">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="fixed bottom-28 left-4 right-4">
            <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 flex items-center gap-2">
                <input 
                    type="text" 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask about your garden..."
                    className="flex-1 bg-transparent px-4 py-3 focus:outline-none text-gray-700 placeholder-gray-400"
                />
                <button 
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isChatTyping}
                    className="w-12 h-12 bg-lime-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:bg-gray-300 disabled:shadow-none"
                >
                    <Send size={20} />
                </button>
            </div>
        </div>
    </div>
  );
};

export default Chat;
