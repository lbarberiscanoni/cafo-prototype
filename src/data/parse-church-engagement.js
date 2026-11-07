#!/usr/bin/env node

/**
 * parse-church-engagement.js
 *
 * Parses MTE_Church_Involvement.xlsx (CAFO's combined church-involvement sheet)
 * into church-engagement.json: churches engaged per county per puzzle piece.
 *
 * Reads the "Aggregated Data" sheet, which the sheet's own "Summary" tab totals.
 * Rows from every provider (CarePortal, Promise686, FTC, Every Child Oregon, ...)
 * are summed per state + county + puzzle piece. Rows with no puzzle piece (FTC)
 * count as "Wrap-around Support", the same way the Summary tab counts them.
 *
 * Input: MTE_Church_Involvement.xlsx
 * Output: church-engagement.json
 *
 * Usage: node parse-church-engagement.js [input_file] [output_file]
 */

const XLSX = require('xlsx');
const fs = require('fs');

const DEFAULT_INPUT = './MTE_Church_Involvement.xlsx';
const DEFAULT_OUTPUT = './church-engagement.json';

// Formal puzzle pieces, in the order the county card shows them.
const PUZZLE_PIECES = [
  'Wrap-around Support',
  'Youth Support',
  'Biological Family Services',
  'Child Welfare System Support',
  'Kinship Family Finding & Growth',
  'Foster Family Finding & Growth',
  'Professional Services',
  'Adoptive Family Finding & Growth',
  'Care Sharing'
];
const DEFAULT_PIECE = 'Wrap-around Support';

// Tolerate spelling/case variants ("Wrap-Around Support", "CareSharing", "and" for "&").
const pieceKey = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
const PIECE_LOOKUP = Object.fromEntries(PUZZLE_PIECES.map(p => [pieceKey(p), p]));

function parse(inputPath, outputPath) {
  console.log('⛪ Parsing church engagement data');
  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Error: ${inputPath} not found`);
    process.exit(1);
  }

  const wb = XLSX.readFile(inputPath);
  const sheet = wb.Sheets['Aggregated Data'];
  if (!sheet) {
    console.error('❌ Error: "Aggregated Data" sheet not found');
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });
  const counties = {}; // { ST: { County: { piece: count } } }
  const skipped = [];
  let year = null;

  for (const row of rows) {
    const state = row['State'] ? String(row['State']).trim().toUpperCase() : null;
    const county = row['County'] ? String(row['County']).trim() : null;
    const count = Number(String(row['CountOfChurchesInvolved'] ?? '').replace(/[^0-9.]/g, ''));
    const rawPiece = row['FormalPuzzlePiece'] ? String(row['FormalPuzzlePiece']).trim() : '';
    const piece = rawPiece ? PIECE_LOOKUP[pieceKey(rawPiece)] : DEFAULT_PIECE;

    if (!state || !county || !Number.isFinite(count) || count <= 0 || !piece) {
      skipped.push({ row, reason: !piece ? `unknown puzzle piece "${rawPiece}"` : 'missing state, county or count' });
      continue;
    }
    if (row['YearDataRepresents']) year = Math.max(year || 0, Number(row['YearDataRepresents']));

    counties[state] = counties[state] || {};
    counties[state][county] = counties[state][county] || {};
    counties[state][county][piece] = (counties[state][county][piece] || 0) + count;
  }

  const countyCount = Object.values(counties).reduce((n, s) => n + Object.keys(s).length, 0);
  const output = {
    metadata: {
      source: 'MTE Church Involvement (CAFO), Aggregated Data sheet',
      year,
      puzzlePieces: PUZZLE_PIECES,
      generatedAt: new Date().toISOString(),
      countyCount
    },
    counties,
    skipped
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`   ✓ ${rows.length} rows → ${countyCount} counties in ${Object.keys(counties).length} states`);
  if (skipped.length) console.log(`   ⚠️  Skipped ${skipped.length} rows (see "skipped" in ${outputPath})`);
  console.log(`   ✓ Wrote ${outputPath}`);
}

module.exports = { PUZZLE_PIECES };

if (require.main === module) {
  parse(process.argv[2] || DEFAULT_INPUT, process.argv[3] || DEFAULT_OUTPUT);
}
