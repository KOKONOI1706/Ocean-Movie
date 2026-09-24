import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Layers, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { catalogApi, type EpisodeInput, type EpisodeNode, type PublishStatus, type SeasonNode, type SeriesTree } from '../../lib/api';
import { hasRole } from '../../../shared/roles';
import { Button, Card, EmptyState, Modal, PublishBadge, PUBLISH_OPTIONS, StreamBadge, inputClass, useConfirm, useToast } from '../ui';
import { Field } from './TitleEditPage';

/**
 * Seasons and episodes of one series. Every action calls the API and then
 * reloads the tree, so what you see is always what is stored.
 */
export function SeasonsManager({ series, onChanged }: { series: SeriesTree; onChanged: () => void }) {
  const toast = useToast();
  const [adding, setAdding] = useState(false);

  const addSeason = async () => {
    setAdding(true);
    try {
      const season = await catalogApi.createSeason(series.id);
      toast('success', `Đã thêm ${season.title}.`);
      onChanged();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Mùa và tập</h2>
        <Button variant="secondary" icon={<Plus className="h-4 w-4" />} loading={adding} onClick={addSeason}>
          Thêm mùa
        </Button>
      </div>
      {series.seasons.length === 0 ? (
        <Card>
          <EmptyState icon={<Layers className="h-5 w-5" />} title="Chưa có mùa nào">Thêm mùa đầu tiên để bắt đầu thêm tập.</EmptyState>
        </Card>
      ) : (
        <div className="space-y-4">
          {series.seasons.map((season) => (
            <SeasonCard key={season.id} season={season} seriesPublished={series.publishStatus === 'PUBLISHED'} onChanged={onChanged} />
          ))}
        </div>
      )}
    </section>
  );
}

const SeasonCard: React.FC<{ season: SeasonNode; seriesPublished: boolean; onChanged: () => void }> = ({ season, seriesPublished, onChanged }) => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<EpisodeNode | 'season' | null>(null);
  const [busy, setBusy] = useState(false);
  const isAdmin = hasRole(user?.role, 'ADMIN');

  const run = async (work: () => Promise<unknown>, success: string) => {
    setBusy(true);
    try {
      await work();
      toast('success', success);
      onChanged();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  // Publishing a season publishes its episodes too (after a confirm listing how many).
  // Hiding a season keeps each episode's own status, so republishing restores them.
  const setSeasonStatus = async (publishStatus: PublishStatus) => {
    const publishing = publishStatus === 'PUBLISHED';
    const drafts = season.episodes.filter((e) => e.publishStatus !== 'PUBLISHED').length;
    const ok = await confirm(
      publishing
        ? {
            title: drafts ? `Xuất bản ${season.title} và ${drafts} tập chưa xuất bản?` : `Xuất bản ${season.title}?`,
            message: drafts ? 'Muốn giữ một tập ở dạng nháp, hãy chuyển tập đó về nháp sau khi xuất bản.' : undefined,
            confirmLabel: 'Xuất bản',
          }
        : {
            title: `Ẩn ${season.title}?`,
            message: 'Mọi tập của mùa sẽ không hiển thị trên trang xem phim. Trạng thái từng tập được giữ nguyên.',
            confirmLabel: 'Ẩn mùa',
          }
    );
    if (!ok) return;
    await run(
      () => catalogApi.publishSeason(season.id, publishStatus, publishing),
      publishing ? `Đã xuất bản ${season.title}.` : `Đã ẩn ${season.title}.`
    );
  };

  const move = (index: number, by: number) => {
    const ids = season.episodes.map((e) => e.id);
    const [id] = ids.splice(index, 1);
    ids.splice(index + by, 0, id);
    return run(() => catalogApi.reorderEpisodes(season.id, ids), 'Đã cập nhật thứ tự tập.');
  };

  const addEpisode = () => run(() => catalogApi.createEpisode(season.id), 'Đã thêm tập mới (nháp).');

  const deleteSeason = async () => {
    if (!(await confirm({ title: `Xóa ${season.title}?`, message: 'Chỉ xóa được mùa không còn tập nào.', confirmLabel: 'Xóa mùa', danger: true }))) return;
    await run(() => catalogApi.deleteSeason(season.id), `Đã xóa ${season.title}.`);
  };

  const deleteEpisode = async (ep: EpisodeNode) => {
    const ok = await confirm({
      title: `Xóa tập ${ep.episodeNumber} “${ep.title}”?`,
      message: 'Xóa luôn tiến độ xem của người dùng cho tập này. Muốn ẩn tạm thời, hãy chuyển tập về nháp.',
      confirmLabel: 'Xóa tập',
      danger: true,
    });
    if (ok) await run(() => catalogApi.deleteEpisode(ep.id), 'Đã xóa tập.');
  };

  const published = season.publishStatus === 'PUBLISHED';

  return (
    <Card
      padded={false}
      title={
        <span className="flex flex-wrap items-center gap-2">
          {season.title}
          <span className="text-xs font-normal text-slate-500">#{season.seasonNumber} · {season.episodes.length} tập</span>
          <PublishBadge status={season.publishStatus} />
          {published && !seriesPublished && <span className="text-xs font-normal text-amber-700">Series chưa xuất bản nên mùa vẫn bị ẩn</span>}
        </span>
      }
      actions={
        <div className="flex flex-wrap items-center gap-1">
          {published ? (
            <Button variant="ghost" icon={<EyeOff className="h-4 w-4" />} disabled={busy} onClick={() => setSeasonStatus('DRAFT')}>Ẩn mùa</Button>
          ) : (
            <Button variant="ghost" icon={<Eye className="h-4 w-4" />} disabled={busy} onClick={() => setSeasonStatus('PUBLISHED')}>Xuất bản mùa</Button>
          )}
          <Button variant="ghost" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing('season')} aria-label="Sửa mùa" />
          {isAdmin && <Button variant="ghost" icon={<Trash2 className="h-4 w-4" />} onClick={deleteSeason} aria-label="Xóa mùa" />}
        </div>
      }
    >
      {season.episodes.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-500">Chưa có tập nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="w-20 px-4 py-2 text-left font-medium">Thứ tự</th>
                <th className="px-2 py-2 text-left font-medium">Tập</th>
                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-2 text-left font-medium">Luồng</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {season.episodes.map((ep, i) => (
                <tr key={ep.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="flex">
                      <Button variant="ghost" className="px-1.5 py-1" icon={<ArrowUp className="h-4 w-4" />} disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={`Đưa tập ${ep.episodeNumber} lên`} />
                      <Button variant="ghost" className="px-1.5 py-1" icon={<ArrowDown className="h-4 w-4" />} disabled={busy || i === season.episodes.length - 1} onClick={() => move(i, 1)} aria-label={`Đưa tập ${ep.episodeNumber} xuống`} />
                    </div>
                  </td>
                  <td className="px-2 py-2">
                    <div className="font-medium text-slate-900">
                      <span className="mr-1.5 tabular-nums text-slate-500">{ep.episodeNumber}.</span>
                      {ep.title}
                    </div>
                    <div className="text-xs text-slate-500">{ep.runtimeMinutes ? `${ep.runtimeMinutes} phút` : 'Chưa có thời lượng'}</div>
                  </td>
                  <td className="px-4 py-2"><PublishBadge status={ep.publishStatus} /></td>
                  <td className="px-4 py-2"><StreamBadge type={ep.streamType} /></td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        className="px-2"
                        disabled={busy}
                        icon={ep.publishStatus === 'PUBLISHED' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        aria-label={ep.publishStatus === 'PUBLISHED' ? 'Chuyển về nháp' : 'Xuất bản tập'}
                        title={ep.publishStatus === 'PUBLISHED' ? 'Chuyển về nháp' : 'Xuất bản tập'}
                        onClick={() =>
                          run(
                            () => catalogApi.updateEpisode(ep.id, { publishStatus: ep.publishStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }),
                            ep.publishStatus === 'PUBLISHED' ? 'Đã chuyển tập về nháp.' : 'Đã xuất bản tập.'
                          )
                        }
                      />
                      <Button variant="ghost" className="px-2" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing(ep)} aria-label="Sửa tập" />
                      {isAdmin && <Button variant="ghost" className="px-2" icon={<Trash2 className="h-4 w-4" />} onClick={() => deleteEpisode(ep)} aria-label="Xóa tập" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="border-t border-slate-200 px-4 py-2">
        <Button variant="ghost" icon={<Plus className="h-4 w-4" />} disabled={busy} onClick={addEpisode}>Thêm tập</Button>
      </div>

      {editing === 'season' && (
        <SeasonForm season={season} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />
      )}
      {editing && editing !== 'season' && (
        <EpisodeForm episode={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged(); }} />
      )}
    </Card>
  );
};

function SeasonForm({ season, onClose, onSaved }: { season: SeasonNode; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    seasonNumber: String(season.seasonNumber),
    title: season.title,
    overview: season.overview ?? '',
    year: season.year ? String(season.year) : '',
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await catalogApi.updateSeason(season.id, {
        seasonNumber: Number(form.seasonNumber),
        title: form.title.trim(),
        overview: form.overview.trim() || null,
        year: form.year ? Number(form.year) : null,
      });
      toast('success', 'Đã lưu mùa.');
      onSaved();
    } catch (err) {
      toast('error', (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal title={`Sửa ${season.title}`} onClose={onClose}>
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số mùa"><input type="number" min={0} className={inputClass} value={form.seasonNumber} onChange={(e) => setForm({ ...form, seasonNumber: e.target.value })} required /></Field>
          <Field label="Năm"><input type="number" min={1888} max={2100} className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></Field>
        </div>
        <Field label="Tên mùa"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} /></Field>
        <Field label="Giới thiệu"><textarea className={`${inputClass} min-h-24`} value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} maxLength={5000} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" loading={saving}>Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}

function EpisodeForm({ episode, onClose, onSaved }: { episode: EpisodeNode; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    episodeNumber: String(episode.episodeNumber),
    title: episode.title,
    overview: episode.overview,
    runtimeMinutes: String(episode.runtimeMinutes || ''),
    airDateAt: episode.airDateAt?.slice(0, 10) ?? '',
    thumbnailUrl: episode.thumbnailUrl ?? '',
    publishStatus: episode.publishStatus,
  });
  const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const patch: EpisodeInput = {
      episodeNumber: Number(form.episodeNumber),
      title: form.title.trim(),
      overview: form.overview,
      runtimeMinutes: Number(form.runtimeMinutes || 0),
      airDateAt: form.airDateAt || null,
      thumbnailUrl: form.thumbnailUrl.trim() || null,
      publishStatus: form.publishStatus,
    };
    try {
      await catalogApi.updateEpisode(episode.id, patch);
      toast('success', 'Đã lưu tập.');
      onSaved();
    } catch (err) {
      toast('error', (err as Error).message);
      setSaving(false);
    }
  };

  return (
    <Modal title={`Sửa tập ${episode.episodeNumber}`} onClose={onClose} wide>
      <form onSubmit={save} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Số tập"><input type="number" min={0} className={inputClass} value={form.episodeNumber} onChange={(e) => setForm({ ...form, episodeNumber: e.target.value })} required /></Field>
          <Field label="Thời lượng (phút)"><input type="number" min={0} max={1000} className={inputClass} value={form.runtimeMinutes} onChange={(e) => setForm({ ...form, runtimeMinutes: e.target.value })} /></Field>
          <Field label="Ngày phát sóng"><input type="date" className={inputClass} value={form.airDateAt} onChange={(e) => setForm({ ...form, airDateAt: e.target.value })} /></Field>
        </div>
        <Field label="Tên tập"><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={300} /></Field>
        <Field label="Nội dung tập"><textarea className={`${inputClass} min-h-24`} value={form.overview} onChange={(e) => setForm({ ...form, overview: e.target.value })} maxLength={10000} /></Field>
        <Field label="Ảnh thu nhỏ (URL)"><input type="url" className={inputClass} value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://…" /></Field>
        <Field label="Trạng thái">
          <select className={inputClass} value={form.publishStatus} onChange={(e) => setForm({ ...form, publishStatus: e.target.value as PublishStatus })}>
            {PUBLISH_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" loading={saving}>Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}
