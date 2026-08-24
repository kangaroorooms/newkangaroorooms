import { useState } from "react";
import ChatbotButton from "./ChatbotButton";
import ChatbotWindow from "./ChatbotWindow";

export default function Chatbot() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <ChatbotWindow
          onClose={() => setOpen(false)}
        />
      )}

      {!open && (
        <ChatbotButton
          onClick={() => setOpen(true)}
        />
      )}
    </>
  );
}