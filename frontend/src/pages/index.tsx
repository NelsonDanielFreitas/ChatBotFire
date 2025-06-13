import { useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await auth.getMe();
        router.push("/chat");
      } catch (error) {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-400 border-t-transparent" />
    </div>
  );
}
