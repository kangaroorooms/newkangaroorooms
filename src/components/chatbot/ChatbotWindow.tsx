import { useState } from "react";
import { chatbotFAQs } from "./ChatbotData";

interface ChatbotWindowProps {
  onClose: () => void;
}

interface Message {
  id: number;
  sender: "bot" | "user";
  text: string;
}

export default function ChatbotWindow({
  onClose,
}: ChatbotWindowProps) {
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hi 👋 I'm the Homilivo Assistant. How can I help you?",
    },
  ]);

  const addMessage = (text: string, sender: "bot" | "user") => {
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now(),
        sender,
        text,
      },
    ]);
  };

  const handleQuestion = (question: string) => {
    addMessage(question, "user");

    const faq = chatbotFAQs.find((item) => {
      const normalizedQuestion = question.toLowerCase();

      return (
        item.question.toLowerCase() === normalizedQuestion ||
        item.keywords.some((keyword) =>
          normalizedQuestion.includes(keyword.toLowerCase())
        )
      );
    });

    setTimeout(() => {
      if (faq) {
        addMessage(faq.answer, "bot");
      } else {
        addMessage(
          "I don't have an answer for that yet. Please try one of the suggested questions.",
          "bot"
        );
      }
    }, 300);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const question = input.trim();

    if (!question) return;

    setInput("");
    handleQuestion(question);
  };

  return (
    <div
      className="
        fixed bottom-24 right-6 z-[100]
        flex h-[600px] w-[380px]
        max-w-[calc(100vw-32px)]
        flex-col overflow-hidden
        rounded-2xl border
        bg-white shadow-2xl
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900 px-4 py-4 text-white dark:bg-slate-800">
        <div>
          <h2 className="font-semibold">Homilivo Assistant</h2>
          <p className="text-xs text-slate-300">
            How can we help?
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Close chatbot"
          className="text-xl"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.sender === "user"
                ? "ml-auto max-w-[80%] rounded-xl bg-slate-900 px-3 py-2 text-sm text-white"
                : "max-w-[80%] rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            }
          >
            {message.text}
          </div>
        ))}
      </div>

      {/* Suggested questions */}
      <div className="border-t p-3 dark:border-slate-700">
        <p className="mb-2 text-xs text-slate-500">
          Popular questions
        </p>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {chatbotFAQs.map((faq) => (
            <button
              key={faq.id}
              onClick={() => handleQuestion(faq.question)}
              className="
                whitespace-nowrap rounded-full
                border px-3 py-2 text-xs
                hover:bg-slate-100
                dark:border-slate-600
                dark:hover:bg-slate-800
              "
            >
              {faq.question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t p-3 dark:border-slate-700"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question..."
          className="
            min-w-0 flex-1 rounded-lg
            border px-3 py-2 text-sm
            outline-none
            focus:ring-2 focus:ring-slate-400
            dark:border-slate-600
            dark:bg-slate-800
          "
        />

        <button
          type="submit"
          className="
            rounded-lg bg-slate-900
            px-4 py-2 text-white
            dark:bg-white dark:text-slate-900
          "
        >
          →
        </button>
      </form>
    </div>
  );
}