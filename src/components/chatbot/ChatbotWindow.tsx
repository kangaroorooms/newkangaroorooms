import { useEffect, useRef, useState } from "react";
import { chatbotFAQs } from "./ChatbotData";
import {
  chatbotWebSocket,
  type ChatbotDoneResponse,
  type WebSocketStatus,
} from "../../services/chatbot/chatbotWebSocket";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatbotWindowProps {
  onClose: () => void;
}

interface Message {
  id: number;
  sender: "bot" | "user";
  text: string;
  streaming?: boolean;
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

  const [isLoading, setIsLoading] = useState(false);
  const [wsStatus, setWsStatus] =
    useState<WebSocketStatus>("disconnected");

  // Keeps track of the currently streaming bot message.
  const streamingMessageId = useRef<number | null>(null);

  /*
   * Register WebSocket callbacks and connect when
   * the chatbot window is opened.
   */
  useEffect(() => {
    chatbotWebSocket.setCallbacks({
      onStatusChange: (status) => {
        setWsStatus(status);

        if (status === "error" || status === "disconnected") {
          setIsLoading(false);
        }
      },

      onToken: (text) => {
        const messageId = streamingMessageId.current;

        if (!messageId) {
          return;
        }

        setMessages((previous) =>
          previous.map((message) =>
            message.id === messageId
              ? {
                ...message,
                text: message.text + text,
              }
              : message
          )
        );
      },

      onDone: (data: ChatbotDoneResponse) => {
        const messageId = streamingMessageId.current;

        setIsLoading(false);
        streamingMessageId.current = null;

        if (!messageId) {
          addMessage(data.message, "bot");
          return;
        }

        /*
         * The backend's done.message is the
         * authoritative final response.
         */
        setMessages((previous) =>
          previous.map((message) =>
            message.id === messageId
              ? {
                ...message,
                text: data.message,
                streaming: false,
              }
              : message
          )
        );

        console.log("Chatbot response:", data);
        console.log("Rooms:", data.rooms);
        console.log("Selected room:", data.selected_room);
        console.log("Sources:", data.sources);
      },

      onServerError: (detail) => {
        setIsLoading(false);
        streamingMessageId.current = null;

        addMessage(
          detail || "Sorry, something went wrong. Please try again.",
          "bot"
        );
      },

      onError: (error) => {
        console.error("Chatbot WebSocket error:", error);
        setIsLoading(false);
      },
    });

    chatbotWebSocket.connect();

    return () => {
      chatbotWebSocket.disconnect();
      chatbotWebSocket.clearSession();
      streamingMessageId.current = null;
    };
  }, []);

  /*
   * Add a normal chat message.
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

  /*
   * Send a message through the MCP WebSocket backend.
   */
  const handleQuestion = (question: string) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    /*
     * Backend contract allows 1-500 characters.
     */
    if (trimmedQuestion.length > 500) {
      addMessage(
        "Please keep your question under 500 characters.",
        "bot"
      );
      return;
    }

    /*
     * WebSocket must be connected before sending.
     */
    if (!chatbotWebSocket.isConnected()) {
      addMessage(
        "I'm still connecting. Please try again in a moment.",
        "bot"
      );
      return;
    }

    /*
     * Display user's message immediately.
     */
    addMessage(trimmedQuestion, "user");

    setInput("");
    setIsLoading(true);

    /*
     * Create one empty bot message.
     * Incoming WebSocket tokens will be appended to it.
     */
    const botMessageId = Date.now() + Math.random();

    streamingMessageId.current = botMessageId;

    setMessages((previous) => [
      ...previous,
      {
        id: botMessageId,
        sender: "bot",
        text: "",
        streaming: true,
      },
    ]);

    const sent = chatbotWebSocket.sendMessage(
      trimmedQuestion
    );

    if (!sent) {
      setIsLoading(false);
      streamingMessageId.current = null;

      setMessages((previous) =>
        previous.filter(
          (message) => message.id !== botMessageId
        )
      );

      addMessage(
        "Sorry, I couldn't send your message. Please try again.",
        "bot"
      );
    }
  };

  /*
   * Submit from input box.
   */
  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    handleQuestion(input);
  };

  /*
   * FAQ buttons use the same WebSocket flow.
   */
  const handleFAQClick = (question: string) => {
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

          <div className="mt-1 flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${wsStatus === "connected"
                  ? "bg-green-400"
                  : wsStatus === "connecting"
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
            />

            <p className="text-xs text-slate-300">
              {wsStatus === "connected"
                ? "AI Assistant"
                : wsStatus === "connecting"
                  ? "Connecting..."
                  : "Offline"}
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
            {message.text ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0">{children}</p>
                  ),

                  strong: ({ children }) => (
                    <strong className="font-semibold">{children}</strong>
                  ),

                  ul: ({ children }) => (
                    <ul className="mb-2 list-disc space-y-1 pl-5">
                      {children}
                    </ul>
                  ),

                  ol: ({ children }) => (
                    <ol className="mb-2 list-decimal space-y-1 pl-5">
                      {children}
                    </ol>
                  ),

                  li: ({ children }) => (
                    <li>{children}</li>
                  ),

                  h1: ({ children }) => (
                    <h1 className="mb-2 text-lg font-semibold">
                      {children}
                    </h1>
                  ),

                  h2: ({ children }) => (
                    <h2 className="mb-2 text-base font-semibold">
                      {children}
                    </h2>
                  ),

                  h3: ({ children }) => (
                    <h3 className="mb-1 text-sm font-semibold">
                      {children}
                    </h3>
                  ),

                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {children}
                    </a>
                  ),

                  code: ({ children }) => (
                    <code className="rounded bg-slate-200 px-1 py-0.5 text-xs dark:bg-slate-700">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.text}
              </ReactMarkdown>
            ) : message.streaming ? (
              "..."
            ) : null}
          </div>
        ))}

        {/* Typing indicator */}
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
              disabled={
                isLoading ||
                wsStatus !== "connected"
              }
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
            wsStatus !== "connected"
              ? "Connecting..."
              : isLoading
                ? "Assistant is thinking..."
                : "Ask a question..."
          }
          disabled={
            isLoading ||
            wsStatus !== "connected"
          }
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
          disabled={
            !input.trim() ||
            isLoading ||
            wsStatus !== "connected"
          }
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

