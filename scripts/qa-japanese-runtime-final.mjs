import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const sourcePath='scripts/qa-japanese-runtime-diagnostic.mjs';
const tempPath='scripts/.qa-japanese-runtime-final.tmp.mjs';
let source=fs.readFileSync(sourcePath,'utf8');
source=source.replace("const duplicateIds=", "const japaneseNonStandardIds=japanese.filter(r=>!/^jp_\\d{3}$/.test(String(r.id))).map(r=>({id:String(r.id),title:r.title||''}));\nconsole.log('JAPANESE_NONSTANDARD_IDS='+JSON.stringify(japaneseNonStandardIds));\nconst duplicateIds=");
source=source.replace('if(japanese.length!==206)', 'if(japanese.length!==207)').replace('expected Japanese runtime count 206', 'expected Japanese runtime count 207');
source += "\nif(rows.length!==2072) throw new Error(`expected full runtime count 2072, got ${rows.length}`);\nif(new Set(rows.map(r=>String(r.id))).size!==2072) throw new Error('full runtime IDs are not unique');\n";
fs.writeFileSync(tempPath,source);
const run=spawnSync(process.execPath,[tempPath],{encoding:'utf8'});
try{fs.unlinkSync(tempPath)}catch{}
process.stdout.write(run.stdout||'');
process.stderr.write(run.stderr||'');
if(run.status!==0) process.exit(run.status||1);
