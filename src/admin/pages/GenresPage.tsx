import React, { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Tags, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { catalogApi, type Genre } from '../../lib/api';
import { hasRole } from '../../../shared/roles';
import { Alert, Button, Card, EmptyState, PageHeader, TableSkeleton, inputClass, useConfirm, useToast } from '../ui';

export function GenresPage() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    catalogApi
      .genres()
      .then(setGenres)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const run = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await work();
      toast('success', success);
      await load();
      return true;
    } catch (err) {
      toast('error', (err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const remove = async (g: Genre) => {
    const used = g.movies + g.series;
    const ok = await confirm({
      title: `Xóa thể loại “${g.name}”?`,
      message: used ? `Thể loại đang gắn với ${g.movies} phim và ${g.series} series. Các tác phẩm vẫn giữ nguyên, chỉ mất thể loại này.` : undefined,
      confirmLabel: 'Xóa',
      danger: true,
    });
    if (ok) await run(() => catalogApi.deleteGenre(g.id), `Đã xóa “${g.name}”.`);
  };

  return (
    <>
      <PageHeader title="Thể loại" description="Thể loại dùng để lọc và gợi ý nội dung. Đổi tên sẽ cập nhật mọi phim và series đang dùng." />
      <Card padded={false}>
        <form
          className="flex gap-2 border-b border-slate-200 px-4 py-3"
          onSubmit={async (e) => {
            e.preventDefault();
            if (name.trim() && (await run(() => catalogApi.createGenre(name.trim()), `Đã thêm “${name.trim()}”.`))) setName('');
          }}
        >
          <input aria-label="Tên thể loại mới" className={`${inputClass} max-w-xs`} placeholder="Tên thể loại mới" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <Button type="submit" variant="primary" icon={<Plus className="h-4 w-4" />} disabled={busy || !name.trim()}>Thêm</Button>
        </form>

        {error && <div className="p-4"><Alert>{error}</Alert></div>}
        {loading ? (
          <TableSkeleton cols={3} />
        ) : genres.length === 0 ? (
          <EmptyState icon={<Tags className="h-5 w-5" />} title="Chưa có thể loại nào" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {genres.map((g) => (
              <li key={g.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {editing?.id === g.id ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (await run(() => catalogApi.renameGenre(g.id, editing.name.trim()), 'Đã đổi tên.')) setEditing(null);
                    }}
                  >
                    <input aria-label="Tên mới" autoFocus className={`${inputClass} max-w-xs`} value={editing.name} onChange={(e) => setEditing({ id: g.id, name: e.target.value })} maxLength={80} />
                    <Button type="submit" variant="primary" icon={<Check className="h-4 w-4" />} disabled={busy || !editing.name.trim()} aria-label="Lưu" />
                    <Button type="button" variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => setEditing(null)} aria-label="Hủy" />
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900">{g.name}</div>
                      <div className="font-mono text-xs text-slate-500">{g.slug}</div>
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">{g.movies} phim · {g.series} series</span>
                    <Button variant="ghost" className="px-2" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing({ id: g.id, name: g.name })} aria-label={`Đổi tên ${g.name}`} />
                    {hasRole(user?.role, 'ADMIN') && (
                      <Button variant="ghost" className="px-2" icon={<Trash2 className="h-4 w-4" />} disabled={busy} onClick={() => remove(g)} aria-label={`Xóa ${g.name}`} />
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
