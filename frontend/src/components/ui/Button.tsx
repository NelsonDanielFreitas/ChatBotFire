import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-bg",
            "disabled:pointer-events-none disabled:opacity-50",
            {
              "bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500/20":
                variant === "primary",
              "bg-dark-card text-dark-text hover:bg-dark-bg focus-visible:ring-gray-500/20":
                variant === "secondary",
              "border border-dark-border bg-transparent text-dark-text hover:bg-dark-card focus-visible:ring-gray-500/20":
                variant === "outline",
              "h-8 px-3 text-sm": size === "sm",
              "h-10 px-4": size === "md",
              "h-12 px-6 text-lg": size === "lg",
            },
            className
          )
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
