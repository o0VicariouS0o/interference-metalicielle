import ExcelJS from 'exceljs';
import fs from 'node:fs';
import path from 'node:path';

const SOURCE = path.resolve(process.cwd(), 'data', 'Metaliciel_Base_Maitre_V6.xlsx');
const BACKUP = path.resolve(process.cwd(), 'data', 'Metaliciel_Base_Maitre_V6_AVANT_DEDOUBLONNAGE.xlsx');
const TEMP   = path.resolve(process.cwd(), 'data', 'Metaliciel_Base_Maitre_V6.tmp.xlsx');

const replacements = new Map<number, number>([
  [473, 2], [474, 292], [475, 232], [479, 127], [490, 314], [494, 229],
  [496, 252], [507, 481], [648, 482], [661, 484], [718, 486], [720, 478],
  [750, 495], [810, 43], [814, 38], [818, 476], [819, 477], [820, 480],
  [821, 483], [822, 487], [823, 488], [825, 491], [826, 492], [827, 493],
  [828, 497], [829, 498], [830, 499], [831, 500],
]);

function fail(msg: string): never {
  console.error(`ERR ${msg}`);
  process.exit(1);
}

async function main() {
  if (!fs.existsSync(SOURCE)) fail(`Fichier introuvable : ${SOURCE}`);
  if (fs.existsSync(BACKUP)) fail(`La sauvegarde existe deja : ${BACKUP}\nRenomme-la ou supprime-la avant de relancer.`);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SOURCE);

  const playlist = wb.getWorksheet('playlist_entries');
  const albums = wb.getWorksheet('albums');
  if (!playlist || !albums) fail('Feuille playlist_entries ou albums absente.');

  // Sauvegarde exacte du fichier avant toute modification.
  fs.copyFileSync(SOURCE, BACKUP);
  console.log(`OK Sauvegarde creee : ${BACKUP}`);

  // Repere les colonnes par leur en-tete.
  const headers = new Map<string, number>();
  playlist.getRow(1).eachCell((cell, col) => headers.set(cell.text.trim(), col));
  const albumIdCol = headers.get('album_id');
  if (!albumIdCol) fail('Colonne album_id introuvable dans playlist_entries.');

  let changed = 0;
  playlist.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const oldId = Number(row.getCell(albumIdCol).value);
    const newId = replacements.get(oldId);
    if (newId !== undefined) {
      row.getCell(albumIdCol).value = newId;
      changed++;
      console.log(`REAFFECTE playlist ligne ${rowNumber}: ${oldId} -> ${newId}`);
    }
  });

  if (changed !== 28) {
    fail(`Nombre de references modifiees inattendu : ${changed} (28 attendues). La sauvegarde est intacte.`);
  }

  // Supprime les lignes d'albums secondaires, du bas vers le haut.
  const rowsToDelete: { row: number; id: number; artiste: string; titre: string }[] = [];
  albums.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const id = Number(row.getCell(1).value);
    if (replacements.has(id)) {
      rowsToDelete.push({
        row: rowNumber,
        id,
        artiste: row.getCell(2).text,
        titre: row.getCell(3).text,
      });
    }
  });

  if (rowsToDelete.length !== 28) {
    fail(`Nombre d'albums doublons trouve inattendu : ${rowsToDelete.length} (28 attendus). La sauvegarde est intacte.`);
  }

  rowsToDelete.sort((a, b) => b.row - a.row);
  for (const x of rowsToDelete) {
    console.log(`SUPPRIME album ${x.id}: ${x.artiste} | ${x.titre}`);
    albums.spliceRows(x.row, 1);
  }

  await wb.xlsx.writeFile(TEMP);
  fs.renameSync(TEMP, SOURCE);

  console.log('');
  console.log('OK Correction terminee.');
  console.log(`OK References playlist reaffectees : ${changed}`);
  console.log(`OK Albums doublons supprimes       : ${rowsToDelete.length}`);
  console.log('OK Le fichier maitre conserve son nom : Metaliciel_Base_Maitre_V6.xlsx');
  console.log('INFO Une sauvegarde AVANT_DEDOUBLONNAGE a ete conservee.');
}

main().catch((e) => {
  console.error('ERR', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
