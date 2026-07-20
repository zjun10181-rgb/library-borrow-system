import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          className={`w-full px-4 py-2.5 border border-divider rounded-lg bg-white text-ink placeholder:text-muted focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${error ? 'border-red-500' : ''} ${icon ? 'pl-12' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}