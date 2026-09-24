import { env } from '../../config/env.js';
import { ValidationError } from '../../utils/errors.js';
import { publicDnsFetcher, type Fetcher } from './http.js';
import { OmdbProvider } from './providers/omdb.js';
import { TmdbProvider } from './providers/tmdb.js';
import type { MetadataProvider } from './types.js';

let providers: Map<string, MetadataProvider> | null = null;

function build(): Map<string, MetadataProvider> {
  const fetch: Fetcher | undefined = env.METADATA_PUBLIC_DNS === 'true' ? publicDnsFetcher() : undefined;
  const list: MetadataProvider[] = [
    new TmdbProvider({ token: env.TMDB_API_TOKEN, language: env.TMDB_LANGUAGE, http: { fetch } }),
    new OmdbProvider({ apiKey: env.OMDB_API_KEY, http: { fetch } }),
  ];
  return new Map(list.map((p) => [p.key, p]));
}

export function metadataProviders(): MetadataProvider[] {
  providers ??= build();
  return [...providers.values()];
}

export function getMetadataProvider(key: string): MetadataProvider {
  providers ??= build();
  const provider = providers.get(key);
  if (!provider) throw new ValidationError(`Nguồn metadata không hỗ trợ: ${key}`);
  return provider;
}

/** Tests only: replace a provider (e.g. with one backed by fixtures), or reset with null. */
export function setMetadataProviderForTests(provider: MetadataProvider | null) {
  if (!provider) {
    providers = null;
    return;
  }
  providers ??= build();
  providers.set(provider.key, provider);
}
