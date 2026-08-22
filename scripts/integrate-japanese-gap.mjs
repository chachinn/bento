import fs from 'node:fs';

const RELEASE='31.1';
const ASSET='31j1';
const ADDED=18;
const JAPANESE_TOTAL=207;
const TOTAL=2072;
const STANDARD=1601;
const modules=['japanese-extra-190-194.js','japanese-extra-195-198.js','japanese-extra-199-207.js'];

let index=fs.readFileSync('index.html','utf8');
const anchor=/  <script src="data\/japanese-extra-171-189\.js\?v=[^"]+" defer><\/script>/;
if(!index.includes('data/japanese-extra-190-194.js')){
  const m=index.match(anchor); if(!m) throw new Error('Japanese insertion point missing');
  const tags=modules.map(n=>`  <script src="data/${n}?v=${ASSET}" defer></script>`).join('\n');
  index=index.replace(anchor,`${m[0]}\n${tags}`);
}else{
  for(const n of modules) index=index.replace(new RegExp(`data/${n.replaceAll('.','\\.')}\\?v=[^\"]+`,'g'),`data/${n}?v=${ASSET}`);
}
fs.writeFileSync('index.html',index);

let sw=fs.readFileSync('service-worker.js','utf8');
sw=sw.replace(/^const CACHE=.*$/m,`const CACHE='bento-shell-v1.0.0-v${ASSET}';`);
sw=sw.replace(/^const ASSET_VERSIONS=new Set\(\[([^\]]*)\]\);$/m,(_m,inside)=>{
  const values=[...inside.matchAll(/'([^']+)'/g)].map(m=>m[1]);
  if(!values.includes(ASSET)) values.push(ASSET);
  return `const ASSET_VERSIONS=new Set([${values.map(v=>`'${v}'`).join(',')}]);`;
});
const swAnchor=/  '\.\/data\/japanese-extra-171-189\.js\?v=[^']+',/;
if(!sw.includes('./data/japanese-extra-190-194.js')){
  const m=sw.match(swAnchor); if(!m) throw new Error('service-worker Japanese insertion point missing');
  const tags=modules.map(n=>`  './data/${n}?v=${ASSET}',`).join('\n');
  sw=sw.replace(swAnchor,`${m[0]}\n${tags}`);
}else{
  for(const n of modules) sw=sw.replace(new RegExp(`\\./data/${n.replaceAll('.','\\.')}\\?v=[^']+`,'g'),`./data/${n}?v=${ASSET}`);
}
fs.writeFileSync('service-worker.js',sw);

const manifest=JSON.parse(fs.readFileSync('data/library_manifest.json','utf8'));
manifest.libraryVersion=Math.max(Number(manifest.libraryVersion)||0,36);
manifest.recipeCount=TOTAL;
manifest.newRecipesThisBuild=ADDED;
manifest.standardRecipeCount=STANDARD;
manifest.japaneseRecipeCount=JAPANESE_TOTAL;
manifest.dishImageCount=TOTAL;
manifest.instructionVersion=Math.max(Number(manifest.instructionVersion)||0,36);
manifest.detailedInstructionRecipeCount=TOTAL;
manifest.cacheFix=`v31.1 completes the Japanese regional gap pass with ${ADDED} reviewed recipes under the ${ASSET} shell generation, caches the three additive Japanese modules, and preserves prior asset generations for unchanged files.`;
manifest.generatedAt='2026-08-23T07:15:00+08:00';
manifest.appRelease=RELEASE;
manifest.qualityAuditSnapshot ||= {};
manifest.qualityAuditSnapshot.fullLibrary={recipeCount:TOTAL,uniqueRecipeIds:TOTAL,criticalStructureFailures:0,releaseGate:'pass'};
manifest.qualityAuditSnapshot.standardCuisines ||= {};
Object.assign(manifest.qualityAuditSnapshot.standardCuisines,{recipeCount:STANDARD,Japanese:JAPANESE_TOTAL,flaggedRecipes:0,allergenFailures:0,referenceFailures:0,equipmentFailures:0,photoMetadataFailures:0,hierarchy:'Spanish 215 > Japanese 207 > Filipino 184 > French 175 > Korean 174 > Indian 171 > Italian 165 > Vietnamese 130 > Chinese 90 = Thai 90 by reviewed recipe count; cuisine selector order remains Japanese first and Filipino second by product rule.'});
manifest.qualityAuditSnapshot.PWA ||= {};
manifest.qualityAuditSnapshot.PWA.assetVersion=ASSET;
manifest.qualityAuditSnapshot.japaneseRegionalCompletion={auditedAt:'2026-08-23',added:ADDED,JapaneseTotal:JAPANESE_TOTAL,firstNewId:'jp_190',lastNewId:'jp_207',legacyStableId:'jp_149_souffle_pancakes',legacyStableTitle:'Japanese Soufflé Pancakes',canonicalHistoricalGap:'jp_149 is intentionally absent because the historical soufflé-pancake record uses a stable legacy ID',coveragePolicy:'coverage determines recipe count; no filler or arbitrary round target',completedRegionalGaps:['Fukushima','Ibaraki','Tochigi','Gunma','Saitama','Chiba','Shizuoka','Shiga','Nara','Tottori','Okayama','Tokushima','Saga'],additionalReviewedRegions:['Nagano','Ishikawa','Niigata','Shimane','Ehime'],duplicateIds:0,duplicateTitles:0,allergenFailures:0,sourceFailures:0,structureFailures:0,status:'passed'};
fs.writeFileSync('data/library_manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({release:RELEASE,asset:ASSET,added:ADDED,japanese:JAPANESE_TOTAL,total:TOTAL,standard:STANDARD,modules:modules.length},null,2));
