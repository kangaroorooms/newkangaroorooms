import React, { useRef, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

/**
 * Lightweight action menu component for admin tables
 * Consolidates secondary actions into a compact dropdown
 * Improves table density by reducing button sprawl
 */
export function ActionMenu({
  items,
  label = 'Actions',
  disabled = false,
  size = 'sm',
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const getVariantClasses = (variant: string = 'default') => {
    const baseClasses = 'px-3 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-60';
    const sizeClass = size === 'sm' ? 'text-xs px-3 py-2' : 'text-sm px-4 py-2';

    switch (variant) {
      case 'success':
        return `${baseClasses} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40`;
      case 'warning':
        return `${baseClasses} bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/40`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600`;
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-60 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 ${
          disabled ? 'cursor-not-allowed' : ''
        }`}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
          <div className="divide-y divide-slate-100 py-1 dark:divide-slate-700">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                disabled={item.disabled}
                className={`block w-full text-left ${getVariantClasses(item.variant)} ${item.className || ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
