import { format } from "date-fns";

interface ChatMessageProps {
  content: string;
  role: "user" | "bot";
  timestamp: Date;
}

export default function ChatMessage({
  content,
  role,
  timestamp,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <div className="text-sm">{content}</div>
        <div
          className={`text-xs mt-1 ${
            isUser ? "text-primary-100" : "text-gray-500"
          }`}
        >
          {format(timestamp, "HH:mm")}
        </div>
      </div>
    </div>
  );
}
