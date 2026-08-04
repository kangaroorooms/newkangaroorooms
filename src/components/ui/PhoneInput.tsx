import React from "react";
import { Phone as PhoneIcon } from "lucide-react";
import { FORM_STYLES } from "../../constants/designSystem";

interface PhoneInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  ariaDescribedBy?: string;
  autoComplete?: string;
  className?: string;
}

/**
 * PhoneInput - Reusable phone input component for Indian phone numbers
 * 
 * Features:
 * - Accepts only digits (removes non-numeric on input)
 * - Maximum 10 digits enforced
 * - Sanitizes pasted values
 * - inputMode="numeric" for mobile keyboards
 * - type="tel" for semantic HTML
 * - autocomplete="tel" for browser autofill
 * - Real-time validation support
 */
export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      id = "phone",
      value,
      onChange,
      onBlur,
      placeholder = "+91 98765 43210",
      error,
      disabled = false,
      label = "Phone",
      required = false,
      ariaDescribedBy,
      autoComplete = "tel",
      className = "",
    },
    ref
  ) => {
    const inputClass = FORM_STYLES.input;
    const labelClass = FORM_STYLES.label;

    // Handle input change - only allow digits, max 10
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Remove all non-numeric characters
      const digitsOnly = input.replace(/\D/g, "");
      
      // Limit to 10 digits
      const limited = digitsOnly.slice(0, 10);
      
      // Call parent onChange with sanitized value
      onChange(limited);
    };

    // Handle paste - sanitize pasted content
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pastedText = e.clipboardData.getData("text/plain");
      
      // Remove all non-numeric characters
      const digitsOnly = pastedText.replace(/\D/g, "");
      
      // Limit to 10 digits
      const limited = digitsOnly.slice(0, 10);
      
      // Prevent default paste and set our sanitized value
      e.preventDefault();
      
      // Update the field with sanitized content
      onChange(limited);
    };

    const errorClassName = error
      ? "border-red-400 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-900/30"
      : "";

    return (
      <div className={`${className}`}>
        {label && (
          <label htmlFor={id} className={labelClass}>
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            ref={ref}
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete={autoComplete}
            value={value}
            onChange={handleChange}
            onBlur={(e) => onBlur?.(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={10}
            className={`${inputClass} ${errorClassName} pl-10`}
            aria-invalid={Boolean(error)}
            aria-describedby={
              error ? (ariaDescribedBy || `${id}-error`) : ariaDescribedBy
            }
          />
        </div>
        {error && (
          <p
            id={ariaDescribedBy || `${id}-error`}
            className="mt-2 text-xs font-medium text-red-600 dark:text-red-400"
          >
            {error}
          </p>
        )}
        {!error && (
          <div className="mt-2 h-5" />
        )}
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";
