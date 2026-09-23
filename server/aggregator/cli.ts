/**
 * Run the aggregator from the command line.
 *
 *   pnpm aggregator --file items.json         # ingest pre-scraped items ([{ title, streamUrl, ... }])
 *   pnpm aggregator --url https://site/ep-1   # scrape one or more episode pages (repeat --url)
 *   pnpm aggregator --query "ngoa ho tang long" [--source my-feed]
 *   pnpm aggregator --parse "Show - Ep 3"     # dry run: print the normalized title only
 */
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { prisma } from '../config/prisma.js';
import { aggregatorService } from './aggregator.service.js';
import { parseEpisodeTitle } from './normalizer.js';
import { rawScrapedItemSchema } from './types.js';

async function main() {
  const { values } = parseArgs({
    options: {
      file: { type: 'string' },
      url: { type: 'string', multiple: true },
      query: { type: 'string' },
      source: { type: 'string', multiple: true },
      parse: { type: 'string', multiple: true },
      limit: { type: 'string', default: '30' },
      'source-name': { type: 'string' },
    },
  });

  if (values.parse?.length) {
    console.table(values.parse.map((t) => ({ raw: t, ...(parseEpisodeTitle(t) ?? { error: 'no episode marker' }) })));
    return;
  }

  let report;
  if (values.file) {
    const items = z.array(rawScrapedItemSchema).parse(JSON.parse(await readFile(values.file, 'utf8')));
    report = await aggregatorService.ingest(items, values['source-name']);
  } else if (values.url?.length) {
    report = await aggregatorService.scrapeUrls(values.url, values['source-name']);
  } else if (values.query) {
    report = await aggregatorService.search(values.query, values.source, Number(values.limit));
  } else {
    console.error('Usage: pnpm aggregator (--file items.json | --url <page> | --query <text> | --parse <title>)');
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
