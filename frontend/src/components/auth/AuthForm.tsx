import { useState, useRef } from "react";
import { useForm, FieldErrors, FieldError } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Card from "../ui/Card";
import { auth, RegisterData, LoginData } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

interface AuthFormProps {
  mode: "login" | "register";
}

type FormData = RegisterData | LoginData;

export default function AuthForm({ mode }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshUser } = useAuth();
  const isNavigating = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (isNavigating.current) return;

    try {
      setIsLoading(true);
      if (mode === "register") {
        await auth.register(data as RegisterData);
        toast.success("Registration successful! Please log in.");
        isNavigating.current = true;
        await router.push("/login");
      } else {
        const response = await auth.login(data as LoginData);
        if (response.success) {
          toast.success("Login successful!");
          // Force refresh the user state
          await refreshUser();
          // Use router.push instead of window.location
          isNavigating.current = true;
          await router.push("/chat");
        } else {
          throw new Error("Login failed");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
      isNavigating.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (error: FieldErrors<FormData>, field: string) => {
    const fieldError = error[field as keyof FormData];
    if (!fieldError) return undefined;
    if (typeof fieldError === "string") return fieldError;
    if ("message" in fieldError) return fieldError.message;
    return undefined;
  };

  return (
    <Card className="glass-card w-full max-w-md p-8">
      <h2 className="mb-8 text-2xl font-bold text-gray-900 text-center">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {mode === "register" && (
          <Input
            label="Username"
            type="text"
            error={getErrorMessage(errors, "username")}
            className="input-focus-ring"
            {...register("username")}
          />
        )}
        <Input
          label="Email"
          type="email"
          error={getErrorMessage(errors, "email")}
          className="input-focus-ring"
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          error={getErrorMessage(errors, "password")}
          className="input-focus-ring"
          {...register("password")}
        />
        <Button
          type="submit"
          className="w-full btn-primary py-3 text-base font-medium"
          isLoading={isLoading}
        >
          {mode === "login" ? "Sign In" : "Create Account"}
        </Button>
      </form>
    </Card>
  );
}
