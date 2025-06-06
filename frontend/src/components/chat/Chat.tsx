import { useState, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import ChatList from "./ChatList";
import TypingIndicator from "./TypingIndicator";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  _id: string;
  content: string;
  sender: "user" | "bot";
  createdAt: string;
}

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start a new conversation when the component mounts
  useEffect(() => {
    const startNewConversation = async () => {
      if (!user?._id) {
        console.error("No user ID available");
        return;
      }

      try {
        const response = await api.post("/chat/conversations", {
          userId: user._id,
          title: "New Conversation",
        });
        setConversationId(response.data.data._id);
        setConversation(response.data.data);
      } catch (error) {
        console.error("Error starting conversation:", error);
      }
    };

    if (!conversationId) {
      startNewConversation();
    }
  }, [user, conversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!conversationId) return;

      try {
        setIsLoadingMessages(true);
        const response = await api.get(
          `/chat/conversations/${conversationId}/messages`
        );
        setMessages(response.data.data);
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  const handleSendMessage = async (content: string) => {
    if (!conversationId) {
      console.error("No conversation ID available");
      return;
    }

    try {
      setIsLoading(true);

      // Add user message immediately
      const userMessage: Message = {
        _id: Date.now().toString(),
        content,
        sender: "user",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send message to backend
      const response = await api.post("/chat/messages", {
        conversationId,
        content,
      });

      // Update conversation if title was generated
      if (response.data.data.conversation) {
        setConversation(response.data.data.conversation);
      }

      // Update messages with bot response
      setMessages((prev) => [...prev, response.data.data.botMessage]);

      // If there are relevant documents, you might want to display them
      if (response.data.data.relevantDocs) {
        console.log("Relevant documents:", response.data.data.relevantDocs);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: Message = {
        _id: Date.now().toString(),
        content:
          "Sorry, there was an error processing your message. Please try again.",
        sender: "bot",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (newConversationId: string) => {
    setConversationId(newConversationId);
    setMessages([]); // Clear messages before loading new ones
  };

  return (
    <div className="flex h-full">
      {/* Chat List Sidebar */}
      <div className="w-64 border-r border-gray-200">
        <ChatList
          onSelectChat={handleSelectChat}
          selectedChatId={conversationId}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-gray-500">Loading messages...</div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message._id}
                  content={message.content}
                  role={message.sender}
                  timestamp={new Date(message.createdAt)}
                />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
}
