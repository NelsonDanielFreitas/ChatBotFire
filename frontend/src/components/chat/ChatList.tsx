import { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ChatListProps {
  onSelectChat: (conversationId: string) => void;
  selectedChatId: string | null;
}

export default function ChatList({
  onSelectChat,
  selectedChatId,
}: ChatListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user?._id) return;

      try {
        setIsLoading(true);
        const response = await api.get(`/chat/users/${user._id}/conversations`);
        setConversations(response.data.data);
      } catch (error) {
        console.error("Error fetching conversations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [user]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="text-gray-400">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-dark-text">
          Conversations
        </h2>
        {conversations.length === 0 ? (
          <div className="text-gray-400">No conversations yet</div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <button
                key={conversation._id}
                onClick={() => onSelectChat(conversation._id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedChatId === conversation._id
                    ? "bg-primary-900 text-primary-100"
                    : "hover:bg-dark-bg text-dark-text"
                }`}
              >
                <div className="font-medium truncate">{conversation.title}</div>
                <div className="text-sm text-gray-400">
                  {format(new Date(conversation.updatedAt), "MMM d, h:mm a")}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
