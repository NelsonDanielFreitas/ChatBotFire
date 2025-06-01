import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={twMerge(
            clsx(
              "block w-full rounded-lg border border-gray-300 bg-white/50 px-4 py-3 text-gray-900 placeholder-gray-400 shadow-sm backdrop-blur-sm transition-all duration-200",
              "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20",
              {
                "border-red-300 focus:border-red-500 focus:ring-red-500/20":
                  error,
              },
              className
            )
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
