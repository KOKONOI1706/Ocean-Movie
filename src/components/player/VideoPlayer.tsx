import React, { useEffect, useRef, useState } from 'react';
import type Hls from 'hls.js';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { StreamType } from '../../types';

interface VideoPlayerProps {
  src: string;
  type?: StreamType;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  /** Resume position as a percentage (0-100). Ignored for embeds. */
  startAtPercent?: number;
  onProgress?: (percentage: number) => void;
  onEnded?: () => void;
}

/** Only absolute http(s) URLs may reach <video>/<iframe> — never javascript:, data:, etc. */
export function safeStreamUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function inferStreamType(url: string, declared?: StreamType): StreamType {
  if (declared) return declared;
  const path = url.split(/[?#]/)[0];
  if (/\.m3u8$/i.test(path)) return 'hls';
  if (/\.(mp4|m4v|webm|ogv|ogg|mov)$/i.test(path)) return 'file';
  return 'embed';
}

/**
 * Plays HLS (.m3u8, via hls.js or native Safari support), progressive files,
 * or falls back to an iframe for third-party embed players. Changing `src`
 * swaps the stream in place — the surrounding page is never reloaded.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  type,
  poster,
  title,
  autoPlay = true,
  startAtPercent,
  onProgress,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [attempt, setAttempt] = useState(0);

  const url = safeStreamUrl(src);
  const kind = url ? inferStreamType(url, type) : 'embed';

  // Keep latest callbacks without re-initialising the player on every render.
  const callbacks = useRef({ onProgress, onEnded, startAtPercent });
  callbacks.current = { onProgress, onEnded, startAtPercent };

  useEffect(() => {
    const video = videoRef.current;
    if (!url || kind === 'embed' || !video) return;

    let hls: Hls | null = null;
    let cancelled = false;
    let mediaRecoveries = 0;
    setStatus('loading');
    setErrorMessage('');

    const fail = (message: string) => {
      if (cancelled) return;
      setStatus('error');
      setErrorMessage(message);
    };

    const onLoadedMetadata = () => {
      const pct = callbacks.current.startAtPercent;
      if (pct && pct > 1 && pct < 95 && Number.isFinite(video.duration)) {
        video.currentTime = (video.duration * pct) / 100;
      }
      setStatus('ready');
      if (autoPlay) video.play().catch(() => { /* autoplay blocked: user presses play */ });
    };
    const onVideoError = () => fail('Không thể phát luồng video này.');

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onVideoError);

    const nativeHls = video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (kind === 'hls') {
      import('hls.js')
        .then(({ default: HlsCtor }) => {
          if (cancelled) return;
          if (HlsCtor.isSupported()) {
            hls = new HlsCtor({ enableWorker: true, backBufferLength: 60 });
            hls.on(HlsCtor.Events.ERROR, (_evt, data) => {
              if (!data.fatal || !hls) return;
              if (data.type === HlsCtor.ErrorTypes.MEDIA_ERROR && mediaRecoveries < 2) {
                mediaRecoveries++;
                hls.recoverMediaError();
              } else if (data.type === HlsCtor.ErrorTypes.NETWORK_ERROR && data.details !== 'manifestLoadError') {
                hls.startLoad();
              } else {
                fail('Luồng HLS bị lỗi hoặc không truy cập được.');
                hls.destroy();
                hls = null;
              }
            });
            hls.loadSource(url);
            hls.attachMedia(video);
          } else if (nativeHls) {
            video.src = url;
          } else {
            fail('Trình duyệt không hỗ trợ phát HLS.');
          }
        })
        .catch(() => {
          if (nativeHls) video.src = url;
          else fail('Không tải được trình phát HLS.');
        });
    } else {
      video.src = url;
    }

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onVideoError);
      hls?.destroy();
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [url, kind, autoPlay, attempt]);

  // Report progress in 5% steps so parents are not re-rendered on every timeupdate.
  const lastReported = useRef(-1);
  useEffect(() => {
    lastReported.current = -1;
  }, [url]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) return;
    const pct = Math.floor(((video.currentTime / video.duration) * 100) / 5) * 5;
    if (pct !== lastReported.current) {
      lastReported.current = pct;
      callbacks.current.onProgress?.(pct);
    }
  };

  if (!url) {
    return (
      <div className="aspect-video w-full bg-black flex flex-col items-center justify-center gap-2 text-white/80 text-sm">
        <AlertTriangle className="w-6 h-6 text-amber-400" />
        <span>Tập này chưa có nguồn phát hợp lệ.</span>
      </div>
    );
  }

  if (kind === 'embed') {
    return (
      <div className="relative aspect-video w-full bg-black">
        <iframe
          key={url}
          src={url}
          title={title || 'Trình phát video'}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
          allowFullScreen
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full"
        controls
        playsInline
        poster={poster}
        aria-label={title}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => {
          callbacks.current.onProgress?.(100);
          callbacks.current.onEnded?.();
        }}
      />

      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-10 h-10 text-white/80 animate-spin" />
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3 text-white text-sm px-6 text-center">
          <AlertTriangle className="w-7 h-7 text-amber-400" />
          <span>{errorMessage}</span>
          <button
            onClick={() => setAttempt((n) => n + 1)}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      )}
    </div>
  );
};
