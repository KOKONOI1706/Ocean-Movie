import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowUp, Archive, ExternalLink, Plus, ScrollText, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  catalogApi,
  type CatalogMediaType,
  type CreditInput,
  type Genre,
  type MovieDetail,
  type MovieInput,
  type PublishStatus,
  type ReleaseStatus,
  type SeriesInput,
  type SeriesTree,
} from '../../lib/api';
import { hasRole } from '../../../shared/roles';
import {
  Alert,
  Badge,
  Button,
  buttonClass,
  Card,
  PageHeader,
  PublishBadge,
  PUBLISH_OPTIONS,
  Spinner,
  formatDateTime,
  inputClass,
  labelClass,
  selectClass,
  useConfirm,
  useToast,
} from '../ui';
import { MEDIA_TYPE_LABELS, Poster, type CatalogKind } from './CatalogListPage';
import { SeasonsManager } from './SeasonsManager';

/** Everything the form edits, as strings/booleans the inputs can hold. */
interface FormState {
  title: string;
  originalTitle: string;
  tagline: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerYoutubeId: string;
  status: ReleaseStatus;
  isCoverFeature: boolean;
  isTrending: boolean;
  publishStatus: PublishStatus;
  genreIds: string[];
  credits: CreditInput[];
  // movie
  year: string;
  releaseDate: string;
  runtimeMinutes: string;
  type: CatalogMediaType;
  language: string;
  country: string;
  ageRating: string;
  // series
  startYear: string;
  endYear: string;
}

const RELEASE_LABELS: Record<ReleaseStatus, string> = { RELEASED: 'Đã phát hành', UPCOMING: 'Sắp ra mắt', IN_PRODUCTION: 'Đang sản xuất' };
const CREDIT_ROLES = ['Director', 'Writer', 'Cast', 'Producer', 'Creator', 'Composer'];

const emptyForm = (kind: CatalogKind): FormState => ({
  title: '', originalTitle: '', tagline: '', synopsis: '', posterUrl: '', backdropUrl: '', trailerYoutubeId: '',
  status: 'RELEASED', isCoverFeature: false, isTrending: false, publishStatus: 'DRAFT', genreIds: [], credits: [],
  year: String(new Date().getFullYear()), releaseDate: '', runtimeMinutes: '', type: kind === 'movie' ? 'MOVIE' : 'SERIES',
  language: '', country: '', ageRating: '', startYear: String(new Date().getFullYear()), endYear: '',
});

function formFrom(kind: CatalogKind, d: MovieDetail | SeriesTree): FormState {
  const base = emptyForm(kind);
  const common = {
    title: d.title, originalTitle: d.originalTitle ?? '', tagline: d.tagline ?? '', synopsis: d.synopsis,
    posterUrl: d.posterUrl, backdropUrl: d.backdropUrl, trailerYoutubeId: d.trailerYoutubeId ?? '', status: d.status,
    isCoverFeature: d.isCoverFeature, isTrending: d.isTrending, publishStatus: d.publishStatus,
    genreIds: d.genres.map((g) => g.genreId),
    credits: d.creators.map((c) => ({ name: c.creator.name, role: c.role, character: c.character ?? '' })),
  };
  if ('year' in d) {
    return {
      ...base, ...common, year: String(d.year), releaseDate: d.releaseDate?.slice(0, 10) ?? '', runtimeMinutes: String(d.runtimeMinutes),
      type: d.type, language: d.language ?? '', country: d.country ?? '', ageRating: d.ageRating ?? '',
    };
  }
  return { ...base, ...common, startYear: String(d.startYear), endYear: d.endYear ? String(d.endYear) : '' };
}

const nullable = (v: string) => (v.trim() ? v.trim() : null);

/** Convert the form to the API payload. */
function payloadFrom(kind: CatalogKind, f: FormState): Record<string, unknown> {
  const common = {
    title: f.title.trim(), originalTitle: nullable(f.originalTitle), tagline: nullable(f.tagline), synopsis: f.synopsis,
    posterUrl: f.posterUrl.trim(), backdropUrl: f.backdropUrl.trim(), trailerYoutubeId: nullable(f.trailerYoutubeId), status: f.status,
    isCoverFeature: f.isCoverFeature, isTrending: f.isTrending, publishStatus: f.publishStatus,
    genreIds: [...f.genreIds].sort(),
    credits: f.credits
      .filter((c) => c.name.trim())
      .map((c) => ({ name: c.name.trim(), role: c.role, character: c.character?.toString().trim() ? c.character!.toString().trim() : null })),
  };
  if (kind === 'movie') {
    return {
      ...common, year: Number(f.year), releaseDate: f.releaseDate || null, runtimeMinutes: Number(f.runtimeMinutes || 0),
      type: f.type, language: nullable(f.language), country: nullable(f.country), ageRating: nullable(f.ageRating),
    };
  }
  return { ...common, startYear: Number(f.startYear), endYear: f.endYear ? Number(f.endYear) : null };
}

/** Only the keys whose value differs from the loaded record. */
function changedFields(current: Record<string, unknown>, initial: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(current).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(initial[k])));
}

export function TitleEditPage({ kind }: { kind: CatalogKind }) {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();

  const [detail, setDetail] = useState<MovieDetail | SeriesTree | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(kind));
  const [initial, setInitial] = useState<Record<string, unknown>>(() => payloadFrom(kind, emptyForm(kind)));
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const listPath = kind === 'movie' ? '/admin/movies' : '/admin/series';
  const noun = kind === 'movie' ? 'phim' : 'series';

  const applyDetail = (d: MovieDetail | SeriesTree) => {
    setDetail(d);
    const f = formFrom(kind, d);
    setForm(f);
    setInitial(payloadFrom(kind, f));
  };

  const loadDetail = () =>
    (kind === 'movie' ? catalogApi.getMovie(id!) : catalogApi.getSeries(id!))
      .then(applyDetail)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));

  useEffect(() => {
    catalogApi.genres().then(setGenres).catch(() => setGenres([]));
    if (!isNew) loadDetail();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const payload = useMemo(() => payloadFrom(kind, form), [kind, form]);
  const changes = useMemo(() => changedFields(payload, initial), [payload, initial]);
  const dirty = isNew || Object.keys(changes).length > 0;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const created =
          kind === 'movie'
            ? await catalogApi.createMovie(payload as MovieInput & { title: string; year: number })
            : await catalogApi.createSeries(payload as SeriesInput & { title: string; startYear: number });
        toast('success', `Đã tạo ${noun} “${created.title}”.`);
        navigate(`${listPath}/${created.id}`, { replace: true });
      } else {
        const updated = kind === 'movie' ? await catalogApi.updateMovie(id!, changes) : await catalogApi.updateSeries(id!, changes);
        applyDetail(updated);
        toast('success', 'Đã lưu thay đổi.');
      }
    } catch (err) {
      setError((err as Error).message);
      toast('error', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    const ok = await confirm({
      title: `Lưu trữ “${detail!.title}”?`,
      message: 'Nội dung sẽ bị ẩn khỏi trang xem phim. Bạn có thể xuất bản lại bất cứ lúc nào.',
      confirmLabel: 'Lưu trữ',
      danger: true,
    });
    if (!ok) return;
    try {
      await (kind === 'movie' ? catalogApi.deleteMovie(id!) : catalogApi.deleteSeries(id!));
      toast('success', 'Đã lưu trữ.');
      loadDetail();
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  const destroy = async () => {
    const ok = await confirm({
      title: `Xóa vĩnh viễn “${detail!.title}”?`,
      message: <>Xóa luôn {kind === 'series' ? 'mọi mùa, tập, ' : ''}đánh giá, tiến độ xem và danh sách của người dùng liên quan. <b>Không thể hoàn tác.</b></>,
      confirmLabel: 'Xóa vĩnh viễn',
      danger: true,
    });
    if (!ok) return;
    try {
      await (kind === 'movie' ? catalogApi.deleteMovie(id!, true) : catalogApi.deleteSeries(id!, true));
      toast('success', 'Đã xóa vĩnh viễn.');
      navigate(listPath, { replace: true });
    } catch (err) {
      toast('error', (err as Error).message);
    }
  };

  if (loading) return <Spinner />;
  if (!isNew && !detail) return <Alert>{error || `Không tìm thấy ${noun}.`}</Alert>;

  const publicPath = detail && (kind === 'movie' ? `/movie/${detail.slug}` : `/series/${detail.slug}`);

  return (
    <>
      <Link to={listPath} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {kind === 'movie' ? 'Phim' : 'Series'}
      </Link>
      <PageHeader
        title={isNew ? `Thêm ${noun}` : detail!.title}
        description={isNew ? 'Nội dung mới được lưu dạng nháp cho đến khi bạn xuất bản.' : undefined}
        actions={
          !isNew && (
            <>
              {detail!.publishStatus === 'PUBLISHED' && (
                <a href={publicPath!} target="_blank" rel="noreferrer" className={buttonClass('ghost')}>
                  <ExternalLink className="h-4 w-4" /> Xem trên trang
                </a>
              )}
              <Link to={`/admin/audit?resourceType=${kind === 'movie' ? 'Movie' : 'Series'}&resourceId=${id}`} className={buttonClass('ghost')}>
                <ScrollText className="h-4 w-4" /> Nhật ký
              </Link>
            </>
          )
        }
      />

      <form onSubmit={save} className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5 min-w-0">
          {error && <Alert>{error}</Alert>}

          <Card title="Thông tin chính">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tên *" className="sm:col-span-2">
                <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={300} />
              </Field>
              <Field label="Tên gốc">
                <input className={inputClass} value={form.originalTitle} onChange={(e) => set('originalTitle', e.target.value)} maxLength={300} />
              </Field>
              <Field label="Khẩu hiệu">
                <input className={inputClass} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} maxLength={300} />
              </Field>
              {kind === 'movie' ? (
                <>
                  <Field label="Năm *">
                    <input type="number" className={inputClass} value={form.year} onChange={(e) => set('year', e.target.value)} required min={1888} max={2100} />
                  </Field>
                  <Field label="Ngày phát hành">
                    <input type="date" className={inputClass} value={form.releaseDate} onChange={(e) => set('releaseDate', e.target.value)} />
                  </Field>
                  <Field label="Thời lượng (phút)">
                    <input type="number" className={inputClass} value={form.runtimeMinutes} onChange={(e) => set('runtimeMinutes', e.target.value)} min={0} max={2000} />
                  </Field>
                  <Field label="Loại">
                    <select className={`${inputClass}`} value={form.type} onChange={(e) => set('type', e.target.value as CatalogMediaType)}>
                      {(Object.keys(MEDIA_TYPE_LABELS) as CatalogMediaType[]).filter((t) => t !== 'SERIES').map((t) => (
                        <option key={t} value={t}>{MEDIA_TYPE_LABELS[t]}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Ngôn ngữ">
                    <input className={inputClass} value={form.language} onChange={(e) => set('language', e.target.value)} placeholder="vd. vi, en, ja" maxLength={50} />
                  </Field>
                  <Field label="Quốc gia">
                    <input className={inputClass} value={form.country} onChange={(e) => set('country', e.target.value)} maxLength={80} />
                  </Field>
                  <Field label="Phân loại độ tuổi">
                    <input className={inputClass} value={form.ageRating} onChange={(e) => set('ageRating', e.target.value)} placeholder="vd. P, T13, T16, T18" maxLength={20} />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Năm bắt đầu *">
                    <input type="number" className={inputClass} value={form.startYear} onChange={(e) => set('startYear', e.target.value)} required min={1888} max={2100} />
                  </Field>
                  <Field label="Năm kết thúc">
                    <input type="number" className={inputClass} value={form.endYear} onChange={(e) => set('endYear', e.target.value)} min={1888} max={2100} />
                  </Field>
                </>
              )}
              <Field label="Tình trạng phát hành">
                <select className={inputClass} value={form.status} onChange={(e) => set('status', e.target.value as ReleaseStatus)}>
                  {(Object.keys(RELEASE_LABELS) as ReleaseStatus[]).map((s) => (
                    <option key={s} value={s}>{RELEASE_LABELS[s]}</option>
                  ))}
                </select>
              </Field>
              <Field label="Mô tả" className="sm:col-span-2">
                <textarea className={`${inputClass} min-h-28`} value={form.synopsis} onChange={(e) => set('synopsis', e.target.value)} maxLength={10000} />
              </Field>
            </div>
          </Card>

          <Card title="Hình ảnh và trailer">
            <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
              <Poster url={form.posterUrl} size="lg" />
              <div className="space-y-3">
                <Field label="Poster (URL)">
                  <input type="url" className={inputClass} value={form.posterUrl} onChange={(e) => set('posterUrl', e.target.value)} placeholder="https://…" />
                </Field>
                <Field label="Ảnh nền (URL)">
                  <input type="url" className={inputClass} value={form.backdropUrl} onChange={(e) => set('backdropUrl', e.target.value)} placeholder="https://…" />
                </Field>
                <Field label="ID trailer YouTube">
                  <input className={inputClass} value={form.trailerYoutubeId} onChange={(e) => set('trailerYoutubeId', e.target.value)} placeholder="vd. dQw4w9WgXcQ" maxLength={20} />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Thể loại" actions={<Link to="/admin/genres" className="text-xs text-teal-700 hover:underline">Quản lý thể loại</Link>}>
            {genres.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có thể loại nào.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => {
                  const on = form.genreIds.includes(g.id);
                  return (
                    <button
                      type="button"
                      key={g.id}
                      aria-pressed={on}
                      onClick={() => set('genreIds', on ? form.genreIds.filter((x) => x !== g.id) : [...form.genreIds, g.id])}
                      className={`rounded-full border px-3 py-1 text-sm cursor-pointer ${on ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <CreditsEditor credits={form.credits} onChange={(c) => set('credits', c)} />

          {kind === 'movie' && !isNew && <MediaPanel movie={detail as MovieDetail} />}
        </div>

        <aside className="space-y-5">
          <Card title="Hiển thị">
            <div className="space-y-4">
              {!isNew && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Hiện tại</span>
                  <PublishBadge status={detail!.publishStatus} />
                </div>
              )}
              <Field label="Trạng thái">
                <select className={inputClass} value={form.publishStatus} onChange={(e) => set('publishStatus', e.target.value as PublishStatus)}>
                  {PUBLISH_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
              <Toggle label="Nổi bật trên trang chủ" checked={form.isCoverFeature} onChange={(v) => set('isCoverFeature', v)} />
              <Toggle label="Đang thịnh hành" checked={form.isTrending} onChange={(v) => set('isTrending', v)} />
              {!isNew && (
                <dl className="space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex justify-between"><dt>Slug</dt><dd className="font-mono text-slate-700">{detail!.slug}</dd></div>
                  <div className="flex justify-between"><dt>Xuất bản lúc</dt><dd>{formatDateTime(detail!.publishedAt)}</dd></div>
                  <div className="flex justify-between"><dt>Cập nhật</dt><dd>{formatDateTime(detail!.updatedAt)}</dd></div>
                </dl>
              )}
              <Button type="submit" variant="primary" className="w-full" loading={saving} disabled={!dirty}>
                {isNew ? `Tạo ${noun}` : dirty ? 'Lưu thay đổi' : 'Không có thay đổi'}
              </Button>
            </div>
          </Card>

          {!isNew && hasRole(user?.role, 'ADMIN') && (
            <Card title="Vùng nguy hiểm">
              <div className="space-y-2">
                <Button type="button" variant="danger" className="w-full" icon={<Archive className="h-4 w-4" />} onClick={archive} disabled={detail!.publishStatus === 'ARCHIVED'}>
                  Lưu trữ
                </Button>
                {hasRole(user?.role, 'SUPER_ADMIN') && (
                  <Button type="button" variant="danger" className="w-full" icon={<Trash2 className="h-4 w-4" />} onClick={destroy}>
                    Xóa vĩnh viễn
                  </Button>
                )}
              </div>
            </Card>
          )}
        </aside>
      </form>

      {kind === 'series' && !isNew && (
        <div className="mt-8">
          <SeasonsManager series={detail as SeriesTree} onChanged={loadDetail} />
        </div>
      )}
    </>
  );
}

export function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
      {label}
      <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-teal-700" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function CreditsEditor({ credits, onChange }: { credits: CreditInput[]; onChange: (c: CreditInput[]) => void }) {
  const update = (i: number, patch: Partial<CreditInput>) => onChange(credits.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, by: number) => {
    const next = [...credits];
    const [item] = next.splice(i, 1);
    next.splice(i + by, 0, item);
    onChange(next);
  };
  return (
    <Card
      title="Đạo diễn và diễn viên"
      actions={
        <Button type="button" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => onChange([...credits, { name: '', role: 'Cast', character: '' }])}>
          Thêm người
        </Button>
      }
    >
      {credits.length === 0 ? (
        <p className="text-sm text-slate-500">Chưa có ai. Thứ tự trong danh sách là thứ tự hiển thị.</p>
      ) : (
        <ul className="space-y-2">
          {credits.map((c, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1.4fr_1fr_1.2fr_auto]">
              <input aria-label="Tên" className={inputClass} value={c.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="Tên" maxLength={200} />
              <select aria-label="Vai trò" className={`${selectClass} order-3 sm:order-none`} value={c.role} onChange={(e) => update(i, { role: e.target.value })}>
                {[...new Set([...CREDIT_ROLES, c.role])].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <input
                aria-label="Nhân vật"
                className={`${inputClass} order-4 sm:order-none`}
                value={c.character ?? ''}
                onChange={(e) => update(i, { character: e.target.value })}
                placeholder={c.role === 'Cast' ? 'Nhân vật' : '—'}
                disabled={c.role !== 'Cast'}
                maxLength={200}
              />
              <div className="flex items-center">
                <Button type="button" variant="ghost" className="px-2" icon={<ArrowUp className="h-4 w-4" />} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Lên" />
                <Button type="button" variant="ghost" className="px-2" icon={<ArrowDown className="h-4 w-4" />} disabled={i === credits.length - 1} onClick={() => move(i, 1)} aria-label="Xuống" />
                <Button type="button" variant="ghost" className="px-2" icon={<X className="h-4 w-4" />} onClick={() => onChange(credits.filter((_, j) => j !== i))} aria-label="Xóa" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function MediaPanel({ movie }: { movie: MovieDetail }) {
  return (
    <Card title="Luồng phát">
      {movie.mediaAssets.length === 0 && !movie.streamUrl ? (
        <p className="text-sm text-slate-500">Chưa có luồng phát. Quản lý nguồn phát được bổ sung ở giai đoạn Media.</p>
      ) : (
        <ul className="divide-y divide-slate-100 text-sm">
          {movie.mediaAssets.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
              <Badge tone={a.status === 'READY' ? 'green' : a.status === 'FAILED' ? 'red' : 'neutral'}>{a.status}</Badge>
              <Badge tone="teal">{a.deliveryType}</Badge>
              {a.isPrimary && <Badge tone="amber">Chính</Badge>}
              <span className="text-slate-500">{a.provider.name}</span>
              {a.playbackUrl && <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-500">{a.playbackUrl}</span>}
            </li>
          ))}
          {movie.mediaAssets.length === 0 && movie.streamUrl && (
            <li className="py-2 font-mono text-xs text-slate-500">{movie.streamUrl}</li>
          )}
        </ul>
      )}
    </Card>
  );
}
