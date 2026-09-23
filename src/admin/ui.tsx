import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Admin console design primitives. Deliberately separate from the consumer
 * site's ocean theme: light, dense, neutral surfaces with one teal accent.
 */

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50';

export const labelClass = 'block text-xs font-medium text-slate-600 mb-1';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '', padded = true }: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          {actions}
        </header>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </section>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-teal-700 text-white hover:bg-teal-800 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
};

/** Button look for <a>/<Link> elements (never nest a <button> inside a link). */
export function buttonClass(variant: ButtonVariant = 'secondary', className = '') {
  return `inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${BUTTON_VARIANTS[variant]} ${className}`;
}

export function Button({
  variant = 'secondary',
  loading = false,
  icon,
  children,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      {...rest}
      disabled={rest.disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

const BADGE_TONES = {
  neutral: 'bg-slate-100 text-slate-700',
  teal: 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
} as const;

export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function StreamBadge({ type }: { type: string | null | undefined }) {
  if (!type) return <Badge tone="red">Không có luồng</Badge>;
  return <Badge tone={type === 'EMBED' ? 'amber' : 'teal'}>{type}</Badge>;
}

export function Alert({ tone = 'red', children }: { tone?: 'red' | 'amber' | 'green'; children: React.ReactNode }) {
  const tones = {
    red: 'border-red-200 bg-red-50 text-red-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  };
  return <div className={`rounded-lg border px-3 py-2 text-sm ${tones[tone]}`}>{children}</div>;
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-400">{icon}</div>
      <p className="text-sm font-medium text-slate-900">{title}</p>
      {children && <div className="mt-1 text-sm text-slate-500 max-w-sm">{children}</div>}
    </div>
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}
