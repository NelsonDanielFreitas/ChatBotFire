import { NextPage } from "next";
import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import ChatLayout from "@/components/chat/ChatLayout";
import Chat from "@/components/chat/Chat";
import { useAuth } from "@/hooks/useAuth";

const ChatPage: NextPage = () => {
  const router = useRouter();
  const { user, loading, error, refreshUser } = useAuth();
  const isNavigating = useRef(false);
  const retryCount = useRef(0);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      if (
        !loading &&
        !user &&
        !isNavigating.current &&
        retryCount.current < 3
      ) {
        try {
          isNavigating.current = true;
          console.log("Checking auth, attempt:", retryCount.current + 1);
          await refreshUser();
          if (!user && mounted) {
            console.log("No user found after refresh, redirecting to login");
            await router.replace("/login");
          }
        } catch (error) {
          console.error("Auth check error:", error);
          if (mounted) {
            retryCount.current += 1;
            if (retryCount.current >= 3) {
              console.log("Max retries reached, redirecting to login");
              await router.replace("/login");
            }
          }
        } finally {
          if (mounted) {
            isNavigating.current = false;
          }
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [user, loading, router, refreshUser]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg">
        <div className="text-dark-text">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg">
        <div className="text-red-400">
          <p>Error: {error}</p>
          <button
            onClick={() => {
              retryCount.current = 0;
              refreshUser();
            }}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg">
        <div className="text-dark-text">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <ChatLayout>
      <Chat />
    </ChatLayout>
  );
};

export default ChatPage;
