import { NextPage } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

const LoginPage: NextPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-dark-text tracking-tight">
            Welcome back
          </h1>
          <p className="mt-3 text-base text-gray-400">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-medium text-primary-400 hover:text-primary-300 transition-colors duration-200"
            >
              Sign up
            </Link>
          </p>
        </div>
        <div className="animate-slide-up">
          <AuthForm mode="login" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
