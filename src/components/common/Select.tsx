import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = '', ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 border border-divider rounded-lg bg-white text-ink focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all duration-200 ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {props.children}
      </select>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}