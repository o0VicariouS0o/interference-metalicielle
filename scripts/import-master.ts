import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { readWorkbook, type Row } from './lib/excel';
import { trim, int, upper, url, date, emissionId, emissionNumero } from './lib/normalize';
import { log } from './lib/logger';

// ─────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────

const APPLY = process.argv.includes('--apply');
const FILE_PATH = path.resolve(process.cwd(), 'data', 'Metaliciel_Base_Maitre_V4.xlsx');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  log.err('Variables manquantes dans .env.local : NEXT_PUBLIC_SUPABASE_URL et/ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

type ValidationResult<T> = { valid: T[]; errors: string[]; warnings: string[] };

async function upsertBatched<T extends object>(
  table: string,
  rows: T[],
  onConflict: string,
  batchSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(slice, { onConflict });
    if (error) {
      throw new Error(`${table} (batch ${i}-${i + slice.length}) : ${error.message}`);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Builders / validators (purs, pas d'I/O)
// ─────────────────────────────────────────────────────────────

function buildPays(artistes: Row[]): { country_code: string; nom: string }[] {
  const map = new Map<string, string>();
  for (const r of artistes) {
    const cc  = upper(r.country_code);
    const nom = trim(r.pays);
    if (cc && /^[A-Z]{2}$/.test(cc) && nom) {
      if (!map.has(cc)) map.set(cc, nom);
    }
  }
  return [...map.entries()].map(([country_code, nom]) => ({ country_code, nom }));
}

function buildTypesEmission(episodes: Row[]): { libelle: string }[] {
  const set = new Set<string>();
  for (const r of episodes) {
    const t = trim(r.type);
    if (t) set.add(t);
  }
  return [...set].map(libelle => ({ libelle }));
}

function buildArtistes(rows: Row[], paysCodes: Set<string>): ValidationResult<{
  id: number; nom: string; country_code: string; ville_region: string | null;
}> {
  const valid: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<number>();

  for (const [i, r] of rows.entries()) {
    const id  = int(r.id);
    const nom = trim(r.nom);
    const cc  = upper(r.country_code);

    if (id === null)               { errors.push(`artiste ligne ${i + 2} : id manquant`); continue; }
    if (seen.has(id))              { errors.push(`artiste ${id} : id en doublon`); continue; }
    if (!nom)                      { errors.push(`artiste ${id} : nom manquant`); continue; }
    if (!cc || !/^[A-Z]{2}$/.test(cc)) { errors.push(`artiste ${id} (${nom}) : country_code invalide "${r.country_code}"`); continue; }
    if (!paysCodes.has(cc))        { errors.push(`artiste ${id} (${nom}) : country_code ${cc} absent du référentiel pays`); continue; }

    seen.add(id);
    valid.push({ id, nom, country_code: cc, ville_region: trim(r.ville_region) });
  }
  return { valid, errors, warnings };
}

function buildAlbums(
  rows: Row[],
  artistesIds: Set<number>,
  artistesByName: Map<string, number>,
): ValidationResult<{ id: number; titre: string; artiste_id: number; annee: number | null }> {
  const valid: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<number>();

  for (const [i, r] of rows.entries()) {
    const id    = int(r.id);
    const titre = trim(r.titre);
    const annee = int(r.annee);

    let artisteId: number | null = null;
    const refInt = int(r.artiste);
    if (refInt !== null && artistesIds.has(refInt)) {
      artisteId = refInt;
    } else {
      const refName = trim(r.artiste);
      if (refName) artisteId = artistesByName.get(refName.toLowerCase()) ?? null;
    }

    if (id === null)         { errors.push(`album ligne ${i + 2} : id manquant`); continue; }
    if (seen.has(id))        { errors.push(`album ${id} : id en doublon`); continue; }
    if (!titre)              { errors.push(`album ${id} : titre manquant`); continue; }
    if (artisteId === null)  { errors.push(`album ${id} (${titre}) : artiste introuvable "${r.artiste}"`); continue; }
    if (annee !== null && (annee < 1900 || annee > 2100)) {
      warnings.push(`album ${id} (${titre}) : année hors plage (${annee}), conservée à NULL`);
    }

    seen.add(id);
    valid.push({
      id, titre, artiste_id: artisteId,
      annee: annee !== null && annee >= 1900 && annee <= 2100 ? annee : null,
    });
  }
  return { valid, errors, warnings };
}

function buildEmissions(
  rows: Row[],
  typesLibelles: Set<string>,
  dateCol: string,
): ValidationResult<{
  id: string; numero: number | null; titre: string; date_diffusion: string;
  description: string | null; type_libelle: string; audio_url: string | null;
  visuel_path: string | null; playlist_pdf_path: string | null;
}> {
  const valid: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenId = new Set<string>();
  const seenNumero = new Set<number>();

  for (const [i, r] of rows.entries()) {
    const id        = emissionId(r.numero);
    const numero    = emissionNumero(r.numero);
    const titre     = trim(r.titre);
    const dDif      = date(r[dateCol]);
    const type      = trim(r.type);
    const audio     = url(r.replay_url);
    const audioRaw  = trim(r.replay_url);

    if (id === null) {
      errors.push(`emission ligne ${i + 2} : numero invalide "${r.numero}"`);
      continue;
    }
    if (seenId.has(id)) { errors.push(`emission ${id} : id en doublon`); continue; }
    if (numero !== null && seenNumero.has(numero)) {
      errors.push(`emission ${id} : numero ${numero} en doublon`);
      continue;
    }
    if (!titre) { errors.push(`emission ${id} : titre manquant`); continue; }
    if (!dDif)  { errors.push(`emission ${id} : ${dateCol} invalide "${r[dateCol]}"`); continue; }
    if (!type || !typesLibelles.has(type)) {
      errors.push(`emission ${id} : type "${type}" absent du referentiel`);
      continue;
    }
    if (audioRaw && !audio) warnings.push(`emission ${id} : replay_url ignoree (format invalide) "${audioRaw}"`);
    if (!audio) warnings.push(`emission ${id} : audio_url NULL (replay_url absent ou invalide)`);
    if (numero === null) warnings.push(`emission ${id} : hors-serie (numero non numerique conserve dans l'id)`);

    seenId.add(id);
    if (numero !== null) seenNumero.add(numero);

    valid.push({
  id, numero, titre,
  date_diffusion: dDif,
  description: trim(r.description_longue),
  description_courte: trim(r.description_courte),
  description_longue: trim(r.description_longue),
  yem_observation: trim(r.yem_observation),
  yem_type: trim(r.yem_type),
  duree: trim(r.duree),
  type_libelle: type,
  audio_url: audio,
  visuel_path: trim(r.image),
  playlist_pdf_path: trim(r.source_pdf),
});
  }
  return { valid, errors, warnings };
}

function buildMorceaux(
  rows: Row[],
  emissionIds: Set<string>,
  artisteIds: Set<number>,
  albumIds: Set<number>,
): ValidationResult<{
  id: number; emission_id: string; position: number; titre: string;
  artiste_id: number; album_id: number | null;
}> {
  const valid: any[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  const seen = new Set<number>();

  let skippedNoId = 0;
  let skippedNoEmission = 0;
  let skippedNoArtist = 0;
  let skippedNoTitle = 0;
  let skippedNoOrder = 0;
  let albumNulled = 0;

  for (const [i, r] of rows.entries()) {
    const id        = int(r.id);
    const eId       = emissionId(r.episode_numero);   // <- accepte HS001
    const position  = int(r.ordre);
    const titre     = trim(r.titre);
    const artistId  = int(r.artist_id);
    const albumId   = int(r.album_id);

    if (id === null) { skippedNoId++; continue; }
    if (eId === null || !emissionIds.has(eId)) { skippedNoEmission++; continue; }
    if (artistId === null || !artisteIds.has(artistId)) { skippedNoArtist++; continue; }
    if (!titre) { skippedNoTitle++; continue; }
    if (position === null || position < 1) { skippedNoOrder++; continue; }

    if (seen.has(id)) { errors.push(`morceau ${id} : id en doublon`); continue; }

    let finalAlbumId: number | null = null;
    if (albumId !== null) {
      if (albumIds.has(albumId)) {
        finalAlbumId = albumId;
      } else {
        albumNulled++;
        warnings.push(`morceau ${id} ("${titre}") : album_id ${albumId} non importable, album_id=NULL`);
      }
    }

    seen.add(id);
    valid.push({ id, emission_id: eId, position, titre, artiste_id: artistId, album_id: finalAlbumId });
  }

  if (skippedNoId)       warnings.push(`${skippedNoId} ligne(s) playlist_entries ignoree(s) : id manquant`);
  if (skippedNoEmission) warnings.push(`${skippedNoEmission} ligne(s) playlist_entries ignoree(s) : episode_numero manquant ou inconnu`);
  if (skippedNoArtist)   warnings.push(`${skippedNoArtist} ligne(s) playlist_entries ignoree(s) : artist_id manquant ou inconnu`);
  if (skippedNoTitle)    warnings.push(`${skippedNoTitle} ligne(s) playlist_entries ignoree(s) : titre manquant`);
  if (skippedNoOrder)    warnings.push(`${skippedNoOrder} ligne(s) playlist_entries ignoree(s) : ordre invalide`);
  if (albumNulled)       warnings.push(`${albumNulled} morceau(x) avec album_id=NULL apres requalification`);

  return { valid, errors, warnings };
}

// ─────────────────────────────────────────────────────────────
// Lookups après upsert
// ─────────────────────────────────────────────────────────────

async function fetchPaysMap(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('pays').select('id, country_code');
  if (error) throw new Error(`fetch pays : ${error.message}`);
  return new Map((data ?? []).map(p => [p.country_code as string, p.id as number]));
}

async function fetchTypesEmissionMap(): Promise<Map<string, number>> {
  const { data, error } = await supabase.from('types_emission').select('id, libelle');
  if (error) throw new Error(`fetch types_emission : ${error.message}`);
  return new Map((data ?? []).map(t => [t.libelle as string, t.id as number]));
}

// ─────────────────────────────────────────────────────────────
// Rapport
// ─────────────────────────────────────────────────────────────

function reportSection<T>(name: string, r: ValidationResult<T>): void {
  log.info(`  ${name.padEnd(18)} valides=${r.valid.length}  erreurs=${r.errors.length}  warnings=${r.warnings.length}`);
  for (const w of r.warnings.slice(0, 10)) log.warn(`    ${w}`);
  if (r.warnings.length > 10) log.dim(`    … ${r.warnings.length - 10} warnings supplémentaires`);
  for (const e of r.errors.slice(0, 20)) log.err(`    ${e}`);
  if (r.errors.length > 20) log.dim(`    … ${r.errors.length - 20} erreurs supplémentaires`);
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

async function main() {
  log.title('Phase 1B — Import Excel → Supabase');
  log.info(`Mode      : ${APPLY ? 'APPLY (écriture)' : 'DRY-RUN (lecture seule)'}`);
  log.info(`Fichier   : ${FILE_PATH}`);
  log.info(`Supabase  : ${SUPABASE_URL}`);

  // 1. Lecture
  log.step('1. Lecture du fichier Excel');
  const sheets = await readWorkbook(FILE_PATH);
  for (const [name, rows] of sheets) {
    log.dim(`  • ${name.padEnd(25)} ${rows.length} lignes`);
  }

  for (const required of ['artistes', 'albums', 'episodes', 'playlist_entries']) {
    if (!sheets.has(required)) {
      log.err(`Feuille requise absente : ${required}`);
      process.exit(1);
    }
  }

  const artistesRows = sheets.get('artistes')!;
  const albumsRows   = sheets.get('albums')!;
  const episodesRows = sheets.get('episodes')!;
  const plRows       = sheets.get('playlist_entries')!;

  // 2. Référentiels dérivés
  log.step('2. Construction des référentiels dérivés');
  const paysData          = buildPays(artistesRows);
  const typesEmissionData = buildTypesEmission(episodesRows);
  log.info(`  pays           : ${paysData.length} entrées`);
  log.info(`  types_emission : ${typesEmissionData.length} entrées`);

  // 3. Upsert des référentiels (apply seulement)
  if (APPLY) {
    log.step('3. Upsert référentiels');
    const a = await supabase.from('pays').upsert(paysData, { onConflict: 'country_code' });
    if (a.error) { log.err(`pays : ${a.error.message}`); process.exit(1); }
    log.ok(`pays (${paysData.length})`);

    const b = await supabase.from('types_emission').upsert(typesEmissionData, { onConflict: 'libelle' });
    if (b.error) { log.err(`types_emission : ${b.error.message}`); process.exit(1); }
    log.ok(`types_emission (${typesEmissionData.length})`);
  } else {
    log.step('3. Upsert référentiels (dry-run, ignoré)');
  }

  // 4. Validation des entités principales
  log.step('4. Validation');

  const paysCodes = new Set(paysData.map(p => p.country_code));
  const typesLib  = new Set(typesEmissionData.map(t => t.libelle));

  const artistesV = buildArtistes(artistesRows, paysCodes);
  reportSection('artistes', artistesV);

  const artistesIds    = new Set(artistesV.valid.map(a => a.id));
  const artistesByName = new Map(artistesV.valid.map(a => [a.nom.toLowerCase(), a.id]));

  const albumsV = buildAlbums(albumsRows, artistesIds, artistesByName);
  reportSection('albums', albumsV);
  const albumsIds = new Set(albumsV.valid.map(a => a.id));

  const emissionsV = buildEmissions(episodesRows, typesLib, 'date_publication');
  reportSection('emissions', emissionsV);
  const emissionsIds = new Set(emissionsV.valid.map(e => e.id));

  const morceauxV = buildMorceaux(plRows, emissionsIds, artistesIds, albumsIds);
  reportSection('morceaux', morceauxV);

  const totalErrors =
    artistesV.errors.length + albumsV.errors.length +
    emissionsV.errors.length + morceauxV.errors.length;

  if (totalErrors > 0) {
    log.err(`\n${totalErrors} erreurs bloquantes. Aucune écriture effectuée.`);
    process.exit(1);
  }

  // 5. Apply
  if (!APPLY) {
    log.step('5. Dry-run terminé');
    log.ok('Validation OK. Relancez avec --apply pour écrire en base.');
    return;
  }

  log.step('5. Upsert des entités principales');

  const paysMap = await fetchPaysMap();
  const typesMap = await fetchTypesEmissionMap();

  // artistes : remplacer country_code par pays_id
  const artistesPayload = artistesV.valid.map(a => {
    const pays_id = paysMap.get(a.country_code);
    if (!pays_id) throw new Error(`pays_id introuvable pour ${a.country_code}`);
    return { id: a.id, nom: a.nom, pays_id, ville_region: a.ville_region };
  });
  await upsertBatched('artistes', artistesPayload, 'id');
  log.ok(`artistes (${artistesPayload.length})`);

  await upsertBatched('albums', albumsV.valid, 'id');
  log.ok(`albums (${albumsV.valid.length})`);

  // emissions : remplacer type_libelle par type_id
  const emissionsPayload = emissionsV.valid.map(e => {
    const type_id = typesMap.get(e.type_libelle);
    if (!type_id) throw new Error(`type_id introuvable pour "${e.type_libelle}"`);
    const { type_libelle, ...rest } = e;
    return { ...rest, type_id };
  });
  await upsertBatched('emissions', emissionsPayload, 'id');
  log.ok(`emissions (${emissionsPayload.length})`);

  await upsertBatched('morceaux', morceauxV.valid, 'id');
  log.ok(`morceaux (${morceauxV.valid.length})`);

  log.step('Terminé');
  log.ok('Import appliqué avec succès.');
}

main().catch(e => {
  log.err(e instanceof Error ? e.message : String(e));
  process.exit(1);
});