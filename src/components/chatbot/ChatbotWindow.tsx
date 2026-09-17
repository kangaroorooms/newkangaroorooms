import { useState } from "react";
import { chatbotFAQs } from "./ChatbotData";
import { sendChatMessage } from "../../services/chatbot/chatbotApi";

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

  // Loading state while waiting for backend response
  const [isLoading, setIsLoading] = useState(false);

  // Stores the latest Gemini interaction ID
  // so follow-up questions keep conversation context
  const [interactionId, setInteractionId] = useState<string | null>(
    null
  );

  /**
   * Add a message to the chat.
   */
  const addMessage = (
    text: string,
    sender: "bot" | "user"
  ) => {
    setMessages((previous) => [
      ...previous,
      {
        id: Date.now() + Math.random(),
        sender,
        text,
      },
    ]);
  };

  /**
   * Send question to the Gemini File Search backend.
   */
  const handleQuestion = async (question: string) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    /**
     * Keep the existing 500 character limit.
     */
    if (trimmedQuestion.length > 500) {
      addMessage(
        "Please keep your question under 500 characters.",
        "bot"
      );
      return;
    }

    /**
     * Display user's message immediately.
     */
    addMessage(trimmedQuestion, "user");

    /**
     * Clear input after sending.
     */
    setInput("");

    /**
     * Show loading state.
     */
    setIsLoading(true);

    try {
      /**
       * Send message to:
       *
       * POST /api/chat
       *
       * If this is a follow-up question,
       * the previous Gemini interaction ID
       * is also sent.
       */
      const response = await sendChatMessage(
        trimmedQuestion,
        interactionId
      );

      /**
       * Save the new interaction ID.
       *
       * This will be used for the next question.
       */
      setInteractionId(response.interaction_id);

      /**
       * Display the answer returned by Gemini.
       */
      addMessage(response.answer, "bot");

      /**
       * Keep sources available for debugging.
       * We don't display them to the user yet.
       */
      console.log("Chatbot response:", response);
      console.log("Sources:", response.sources);
    } catch (error) {
      console.error("Chatbot API error:", error);

      /**
       * Show a safe error message to the user.
       */
      addMessage(
        "Sorry, I'm having trouble right now. Please try again.",
        "bot"
      );
    } finally {
      /**
       * Stop loading state whether
       * the request succeeds or fails.
       */
      setIsLoading(false);
    }
  };

  /**
   * Submit from input box.
   */
  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    const question = input.trim();

    if (!question) {
      return;
    }

    handleQuestion(question);
  };

  /**
   * FAQ button.
   *
   * FAQ questions now go directly
   * to the real Gemini backend.
   */
  const handleFAQClick = (
    question: string
  ) => {
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

      <div
        className="
          flex items-center justify-between
          bg-slate-900
          px-4 py-4
          text-white
          dark:bg-slate-800
        "
      >
        <div>
          <h2 className="font-semibold">
            Homilivo Assistant
          </h2>

          <div className="mt-1">
            <p className="text-xs text-slate-300">
              AI Assistant
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Close chatbot"
          className="
            text-xl
            text-slate-300
            transition
            hover:text-white
          "
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
                ? `
                  ml-auto
                  max-w-[80%]
                  rounded-xl
                  bg-slate-900
                  px-3 py-2
                  text-sm
                  text-white
                `
                : `
                  max-w-[80%]
                  rounded-xl
                  bg-slate-100
                  px-3 py-2
                  text-sm
                  text-slate-800
                  dark:bg-slate-800
                  dark:text-slate-100
                `
            }
          >
            {message.text}
          </div>
        ))}

        {/* Loading / Typing indicator */}

        {isLoading && (
          <div
            className="
              max-w-[80%]
              rounded-xl
              bg-slate-100
              px-3 py-2
              text-sm
              text-slate-500
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            Assistant is typing...
          </div>
        )}
      </div>

      {/* Suggested Questions */}

      <div className="border-t p-3 dark:border-slate-700">
        <p className="mb-2 text-xs text-slate-500">
          Popular questions
        </p>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {chatbotFAQs.map((faq) => (
            <button
              key={faq.id}
              onClick={() =>
                handleFAQClick(faq.question)
              }
              disabled={isLoading}
              className="
                whitespace-nowrap
                rounded-full
                border
                px-3 py-2
                text-xs
                transition
                hover:bg-slate-100
                disabled:cursor-not-allowed
                disabled:opacity-50
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
        className="
          flex gap-2
          border-t
          p-3
          dark:border-slate-700
        "
      >
        <input
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          maxLength={500}
          placeholder={
            isLoading
              ? "Assistant is thinking..."
              : "Ask a question..."
          }
          disabled={isLoading}
          className="
            min-w-0
            flex-1
            rounded-lg
            border
            px-3 py-2
            text-sm
            outline-none
            focus:ring-2
            focus:ring-slate-400
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-slate-600
            dark:bg-slate-800
          "
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="
            rounded-lg
            bg-slate-900
            px-4 py-2
            text-white
            transition
            hover:bg-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:bg-white
            dark:text-slate-900
          "
        >
          →
        </button>
      </form>
    </div>
  );
}

