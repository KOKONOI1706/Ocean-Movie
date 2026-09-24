import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScrollText, Search, Users } from 'lucide-react';
import { adminApi, AdminUser } from '../../lib/api';
import { ROLES, ROLE_LABELS, type Role } from '../../../shared/roles';
import { Alert, Card, EmptyState, PageHeader, Pagination, RoleBadge, Spinner, formatDateTime, inputClass, selectClass } from '../ui';

const PAGE_SIZE = 20;

/** Users list (ADMIN+). Only SUPER_ADMIN can change roles; the API enforces the same rule. */
export function UsersPage({ canManageRoles, currentUserId }: { canManageRoles: boolean; currentUserId: string }) {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    adminApi
      .users({ q: query || undefined, role: role || undefined, page, limit: PAGE_SIZE })
      .then(({ items, pagination }) => {
        setRows(items);
        setTotal(pagination.total);
        setTotalPages(Math.max(1, pagination.totalPages));
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [query, role, page]);

  const changeRole = async (user: AdminUser, next: Role) => {
    if (next === user.role) return;
    const ok = window.confirm(
      `Đổi vai trò của ${user.displayName || user.username} (${user.email}) từ “${ROLE_LABELS[user.role]}” thành “${ROLE_LABELS[next]}”?`
    );
    if (!ok) return;
    setSavingId(user.id);
    setError('');
    setNotice('');
    try {
      const updated = await adminApi.changeRole(user.id, next);
      setRows((prev) => prev.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u)));
      setNotice(`Đã đổi vai trò của ${updated.email} thành “${ROLE_LABELS[updated.role]}”.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Người dùng"
        description={
          canManageRoles
            ? 'Tìm tài khoản và phân quyền. Mỗi thay đổi vai trò được ghi vào nhật ký.'
            : 'Danh sách tài khoản. Chỉ quản trị cấp cao mới đổi được vai trò.'
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <select
            aria-label="Lọc theo vai trò"
            className={selectClass}
            value={role}
            onChange={(e) => {
              setRole(e.target.value as Role | '');
              setPage(1);
            }}
          >
            <option value="">Tất cả vai trò</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <form
            className="relative w-full sm:w-72"
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(q.trim());
            }}
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              aria-label="Tìm theo email, tên đăng nhập hoặc tên hiển thị"
              className={`${inputClass} pl-9`}
              placeholder="Email, tên đăng nhập… (Enter)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </form>
        </div>

        {(error || notice) && (
          <div className="p-4">{error ? <Alert>{error}</Alert> : <Alert tone="green">{notice}</Alert>}</div>
        )}
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <EmptyState icon={<Users className="h-5 w-5" />} title="Không có tài khoản phù hợp" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Tài khoản</th>
                  <th className="px-4 py-2 text-left font-medium">Vai trò</th>
                  <th className="px-4 py-2 text-left font-medium">Tham gia</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((user) => {
                  const isSelf = user.id === currentUserId;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-slate-900">
                          {user.displayName || user.username}
                          {isSelf && <span className="ml-1.5 text-xs font-normal text-slate-500">(bạn)</span>}
                        </div>
                        <div className="text-xs text-slate-500">@{user.username} · {user.email}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        {canManageRoles && !isSelf ? (
                          <select
                            aria-label={`Vai trò của ${user.email}`}
                            className={`${selectClass} py-1`}
                            value={user.role}
                            disabled={savingId === user.id}
                            onChange={(e) => changeRole(user, e.target.value as Role)}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                            ))}
                          </select>
                        ) : (
                          <RoleBadge role={user.role} />
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">{formatDateTime(user.createdAt)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          to={`/admin/audit?resourceType=User&resourceId=${user.id}`}
                          className="inline-flex items-center gap-1 text-xs text-teal-700 hover:underline"
                        >
                          <ScrollText className="h-3.5 w-3.5" /> Nhật ký
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination total={total} page={page} totalPages={totalPages} onPage={setPage} unit="tài khoản" />
      </Card>
    </>
  );
}
