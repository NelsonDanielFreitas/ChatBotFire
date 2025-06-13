import { ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { DocumentIcon } from "@heroicons/react/24/outline";

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex h-screen bg-dark-bg">
      {/* Sidebar */}
      <div className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
        <div className="p-4 border-b border-dark-border">
          <h2 className="text-xl font-semibold text-dark-text">Fire Chat</h2>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center">
              <span className="text-primary-100 font-medium">
                {user?.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-dark-text">{user?.username}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 border-b border-dark-border">
          <button
            onClick={() => router.push("/pdf-upload")}
            className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-dark-text hover:bg-dark-bg rounded-lg transition-colors"
          >
            <DocumentIcon className="w-5 h-5" />
            <span>Upload PDF</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Chat history will go here */}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-dark-border">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm text-dark-text hover:bg-dark-bg rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-dark-bg">{children}</div>
    </div>
  );
}
