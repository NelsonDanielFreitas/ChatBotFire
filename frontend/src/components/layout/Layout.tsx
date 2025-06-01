import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "@/lib/api";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow">
        <nav className="mx-auto flex max-w-7xl items-center justify-between p-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-gray-900">
            ChatBot
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/chat" className="text-gray-600 hover:text-gray-900">
              Chat
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} ChatBot. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
