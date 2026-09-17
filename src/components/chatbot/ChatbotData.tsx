export interface ChatbotFAQ {
    id: string;
    question: string;
    keywords: string[];
    answer: string;
  }
  
  export const chatbotFAQs: ChatbotFAQ[] = [
    {
      id: "find-room",
      question: "How do I find a room?",
      keywords: ["find room", "search room", "find property", "search property"],
      answer:
        "Go to Find a Room, select your city and apply the available filters to find a suitable property."
    },
    {
      id: "list-property",
      question: "How do I list my property?",
      keywords: ["list property", "add property", "post property"],
      answer:
        "You can list your property by logging in as an Owner or Agent and using the property listing option."
    },
    {
      id: "book-visit",
      question: "How do I book a property visit?",
      keywords: ["book visit", "property visit", "schedule visit"],
      answer:
        "Open the property you are interested in and select the Book Your Visit option."
    },
    {
      id: "contact-owner",
      question: "How do I contact the owner?",
      keywords: ["contact owner", "owner contact", "call owner"],
      answer:
        "Open the property details page and use the available contact option to reach the owner."
    }
  ];