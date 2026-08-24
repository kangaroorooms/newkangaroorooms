interface ChatbotButtonProps {
    onClick: () => void;
  }
  
  export default function ChatbotButton({
    onClick,
  }: ChatbotButtonProps) {
    return (
      <button
        onClick={onClick}
        aria-label="Open Homilivo Assistant"
        className="
          fixed bottom-6 right-6 z-[100]
          flex h-14 w-14 items-center justify-center
          rounded-full
          bg-slate-900 text-white
          shadow-lg
          transition-transform
          hover:scale-105
          dark:bg-white dark:text-slate-900
        "
      >
        💬
      </button>
    );
  }