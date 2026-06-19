import { createClient } from '@supabase/supabase-js';
import { parseFile } from 'music-metadata';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

type Emission = {
  id: string;
  titre: string;
  audio_url: string | null;
  duree: string | null;
};

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');

  for (const line of content.split('\n')) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) continue;

    const index = clean.indexOf('=');
    if (index === -1) continue;

    const key = clean.slice(0, index).trim();
    const value = clean.slice(index + 1).trim().replace(/^["']|["']$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('Variables Supabase manquantes dans .env.local');
}

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');

const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
const ONLY_ID = onlyArg ? onlyArg.replace('--only=', '') : null;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeUrl(raw: string): string {
  return new URL(raw).toString();
}

function formatDuration(secondsRaw: number): string {
  const total = Math.round(secondsRaw);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

async function readMp3Duration(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  const tmpPath = join(
    tmpdir(),
    `im-duration-${Date.now()}-${Math.random().toString(16).slice(2)}.mp3`,
  );

  try {
    const response = await fetch(normalizeUrl(url), {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Interference-Metalicielle-Duration-Importer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    writeFileSync(tmpPath, Buffer.from(arrayBuffer));

    const metadata = await parseFile(tmpPath);
    const duration = metadata.format.duration;

    if (!duration || Number.isNaN(duration)) {
      throw new Error('Durée introuvable dans les métadonnées MP3');
    }

    return formatDuration(duration);
  } finally {
    clearTimeout(timeout);

    try {
      unlinkSync(tmpPath);
    } catch {
      // ignore cleanup errors
    }
  }
}

async function main() {
  console.log('\nPhase 3C — Récupération durées MP3');
  console.log('──────────────────────────────────');
  console.log(`Mode : ${APPLY ? 'APPLY écriture Supabase' : 'DRY-RUN lecture seule'}`);
  console.log(`Force : ${FORCE ? 'oui' : 'non'}`);
  if (ONLY_ID) console.log(`Only : ${ONLY_ID}`);

  let query = supabase
    .from('emissions')
    .select('id, titre, audio_url, duree')
    .order('date_diffusion', { ascending: true });

  if (ONLY_ID) {
    query = query.eq('id', ONLY_ID);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const emissions = (data ?? []) as Emission[];

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const emission of emissions) {
    if (!emission.audio_url) {
      skipped++;
      console.log(`SKIP ${emission.id} — audio_url absent`);
      continue;
    }

    if (emission.duree && !FORCE) {
      skipped++;
      console.log(`SKIP ${emission.id} — durée déjà présente : ${emission.duree}`);
      continue;
    }

    try {
      console.log(`READ ${emission.id} — ${emission.titre}`);

      const duree = await readMp3Duration(emission.audio_url);

      if (!APPLY) {
        console.log(`DRY  ${emission.id} → ${duree}`);
      } else {
        const { error: updateError } = await supabase
          .from('emissions')
          .update({ duree })
          .eq('id', emission.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        console.log(`OK   ${emission.id} → ${duree}`);
      }

      updated++;
    } catch (err) {
      failed++;
      console.error(
        `ERR  ${emission.id} — ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  console.log('\nRésumé');
  console.log(`  traitées : ${updated}`);
  console.log(`  ignorées : ${skipped}`);
  console.log(`  erreurs  : ${failed}`);

  if (!APPLY) {
    console.log('\nDry-run terminé. Relance avec --apply pour écrire en base.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});