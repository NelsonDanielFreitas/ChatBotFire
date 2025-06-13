import { AppProps } from "next/app";
import { Toaster } from "react-hot-toast";
import "@/styles/globals.css";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text">
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#2d2d2d",
            color: "#e5e5e5",
            border: "1px solid #404040",
          },
        }}
      />
    </div>
  );
}
