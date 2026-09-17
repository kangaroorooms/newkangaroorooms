export interface ChatbotResponse {
  success: boolean;
  answer: string;
  interaction_id: string;
  sources: {
    file: string;
  }[];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function sendChatMessage(
  message: string,
  previousInteractionId?: string | null
): Promise<ChatbotResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      previous_interaction_id: previousInteractionId ?? null,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      errorText || `Chatbot request failed: ${response.status}`
    );
  }

  return response.json();
}