import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, X, XCircle } from 'lucide-react';
import { ROLE_LABELS, type Role } from '../../shared/roles';
import { Link } from 'react-router-dom';

/**
 * Admin console design primitives. Deliberately separate from the consumer
 * site's ocean theme: light, dense, neutral surfaces with one teal accent.
 */

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-50';

/** Dropdowns size to their content instead of stretching like text inputs. */
export const selectClass = inputClass.replace('w-full ', 'w-auto max-w-full ');

/** Text inputs placed inline in a toolbar: size via your own width classes. */
export const inlineInputClass = inputClass.replace('w-full ', '');

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
    <span className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ${BADGE_TONES[tone]}`}>
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

/** Table footer: item count and previous/next page. */
export function Pagination({ total, page, totalPages, onPage, unit = 'mục' }: {
  total: number;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
      <span>{total} {unit}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" icon={<ChevronLeft className="h-4 w-4" />} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Trang trước" />
        <span className="tabular-nums">{page} / {totalPages}</span>
        <Button variant="ghost" icon={<ChevronRight className="h-4 w-4" />} disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Trang sau" />
      </div>
    </div>
  );
}

const ROLE_TONES = { USER: 'neutral', CURATOR: 'teal', ADMIN: 'amber', SUPER_ADMIN: 'red' } as const;

export function RoleBadge({ role }: { role: string }) {
  const tone = ROLE_TONES[role as keyof typeof ROLE_TONES] ?? 'neutral';
  return <Badge tone={tone}>{ROLE_LABELS[role as Role] ?? role}</Badge>;
}

const PUBLISH_BADGES = {
  DRAFT: { tone: 'amber', label: 'Nháp' },
  PUBLISHED: { tone: 'green', label: 'Đã xuất bản' },
  ARCHIVED: { tone: 'neutral', label: 'Lưu trữ' },
} as const;

export function PublishBadge({ status }: { status: keyof typeof PUBLISH_BADGES }) {
  const b = PUBLISH_BADGES[status] ?? PUBLISH_BADGES.DRAFT;
  return <Badge tone={b.tone}>{b.label}</Badge>;
}

export const PUBLISH_OPTIONS = [
  { value: 'DRAFT', label: 'Nháp (ẩn)' },
  { value: 'PUBLISHED', label: 'Đã xuất bản' },
  { value: 'ARCHIVED', label: 'Lưu trữ (ẩn)' },
] as const;

/** Centered dialog with a title bar; closes on Escape and backdrop click. */
export function Modal({ title, onClose, children, footer, wide = false }: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={`relative flex max-h-[90vh] w-full flex-col rounded-t-xl bg-white shadow-xl sm:rounded-xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer" aria-label="Đóng">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="overflow-y-auto p-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

// ── Toasts ──────────────────────────────────────────────────────────────────

type ToastAction = { label: string; to: string };
type Toast = { id: number; tone: 'success' | 'error'; message: string; action?: ToastAction };
const ToastContext = createContext<(tone: Toast['tone'], message: string, action?: ToastAction) => void>(() => {});

/** `const toast = useToast(); toast('success', 'Đã lưu')`, optionally with a link: `toast('success', 'Đã xếp hàng', { label: 'Xem', to: '/admin/jobs/1' })` */
export function useToast() {
  return useContext(ToastContext);
}

// ── Confirm dialog ──────────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  danger?: boolean;
}
type ConfirmRequest = ConfirmOptions & { resolve: (ok: boolean) => void };
const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

/** `if (await confirm({ title: 'Lưu trữ?', danger: true })) …` */
export function useConfirm() {
  return useContext(ConfirmContext);
}

/** Provides toasts and confirm dialogs to the admin pages. */
export function AdminFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((tone: Toast['tone'], message: string, action?: ToastAction) => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, tone, message, action }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' || action ? 7000 : 4000);
  }, []);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    []
  );
  const answer = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        {request && (
          <Modal
            title={request.title}
            onClose={() => answer(false)}
            footer={
              <>
                <Button onClick={() => answer(false)}>Hủy</Button>
                <Button variant={request.danger ? 'danger' : 'primary'} onClick={() => answer(true)} autoFocus>
                  {request.confirmLabel ?? 'Xác nhận'}
                </Button>
              </>
            }
          >
            {request.message && <div className="text-sm text-slate-600">{request.message}</div>}
          </Modal>
        )}
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-lg ${
                t.tone === 'success' ? 'border-emerald-200 bg-white text-slate-800' : 'border-red-200 bg-white text-red-800'
              }`}
            >
              {t.tone === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
              <span>
                {t.message}
                {t.action && <Link to={t.action.to} className="ml-1.5 font-medium text-teal-700 hover:underline">{t.action.label}</Link>}
              </span>
            </div>
          ))}
        </div>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}

/** Loading placeholder rows for tables. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3">
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={`h-4 animate-pulse rounded bg-slate-100 ${c === 0 ? 'flex-[3]' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
