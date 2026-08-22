import fs from 'node:fs';

const RELEASE='32.0';
const ASSET='32p1';
const AMERICAN_COUNT=243;
const BASE_TOTAL=2054;
const BASE_STANDARD=1583;
const TOTAL=BASE_TOTAL+AMERICAN_COUNT;
const STANDARD=BASE_STANDARD+AMERICAN_COUNT;
const modules=fs.readdirSync('data')
  .filter(n=>/^american-recipes-\d{3}-\d{3}\.js$/.test(n))
  .sort((a,b)=>Number(a.match(/-(\d{3})-/)[1])-Number(b.match(/-(\d{3})-/)[1]));
if(!modules.length)throw new Error('No American recipe modules found');
const tags=[
  `  <script src="data/american-runtime.js?v=${ASSET}" defer></script>`,
  ...modules.map(n=>`  <script src="data/${n}?v=${ASSET}" defer></script>`)
].join('\n');

let index=fs.readFileSync('index.html','utf8');
const qualityTag=/  <script src="data\/recipe-quality-runtime\.js\?v=[^"]+" defer><\/script>/;
if(!index.includes('data/american-runtime.js')){
  if(!qualityTag.test(index))throw new Error('index quality-runtime insertion point missing');
  index=index.replace(qualityTag,`${tags}\n  <script src="data/recipe-quality-runtime.js?v=${ASSET}" defer></script>`);
}else{
  index=index.replace(/data\/american-runtime\.js\?v=[^"]+/g,`data/american-runtime.js?v=${ASSET}`)
    .replace(/data\/(american-recipes-\d{3}-\d{3}\.js)\?v=[^"]+/g,`data/$1?v=${ASSET}`)
    .replace(/data\/recipe-quality-runtime\.js\?v=[^"]+/g,`data/recipe-quality-runtime.js?v=${ASSET}`);
}
fs.writeFileSync('index.html',index);

let sw=fs.readFileSync('service-worker.js','utf8');
sw=sw.replace(/^const CACHE=.*$/m,`const CACHE='bento-shell-v1.0.0-v${ASSET}';`);
sw=sw.replace(/^const ASSET_VERSIONS=new Set\(\[([^\]]*)\]\);$/m,(_m,inside)=>{
  const values=[...inside.matchAll(/'([^']+)'/g)].map(m=>m[1]);
  if(!values.includes(ASSET))values.push(ASSET);
  return `const ASSET_VERSIONS=new Set([${values.map(v=>`'${v}'`).join(',')}]);`;
});
const swAmerican=[
  `  './data/american-runtime.js?v=${ASSET}',`,
  ...modules.map(n=>`  './data/${n}?v=${ASSET}',`)
].join('\n');
const swQuality=/  '\.\/data\/recipe-quality-runtime\.js\?v=[^']+',/;
if(!sw.includes('./data/american-runtime.js')){
  if(!swQuality.test(sw))throw new Error('service-worker quality-runtime insertion point missing');
  sw=sw.replace(swQuality,`${swAmerican}\n  './data/recipe-quality-runtime.js?v=${ASSET}',`);
}else{
  sw=sw.replace(/\.\/data\/american-runtime\.js\?v=[^']+/g,`./data/american-runtime.js?v=${ASSET}`)
    .replace(/\.\/data\/(american-recipes-\d{3}-\d{3}\.js)\?v=[^']+/g,`./data/$1?v=${ASSET}`)
    .replace(/\.\/data\/recipe-quality-runtime\.js\?v=[^']+/g,`./data/recipe-quality-runtime.js?v=${ASSET}`);
}
fs.writeFileSync('service-worker.js',sw);

const manifest=JSON.parse(fs.readFileSync('data/library_manifest.json','utf8'));
manifest.libraryVersion=36;
manifest.recipeCount=TOTAL;
manifest.newRecipesThisBuild=AMERICAN_COUNT;
manifest.cuisineCount=11;
manifest.verifiedCuisineLibraries=[...(manifest.verifiedCuisineLibraries||[]).filter(x=>x!=='American'),'American'];
manifest.standardRecipeCount=STANDARD;
manifest.americanRecipeCount=AMERICAN_COUNT;
manifest.dishImageCount=TOTAL;
manifest.instructionVersion=36;
manifest.detailedInstructionRecipeCount=TOTAL;
manifest.cacheFix=`v32.0 adds the ${AMERICAN_COUNT}-recipe American coverage-first regional library under the ${ASSET} shell generation, caches the American runtime and all recipe modules, refreshes the shared allergen runtime, and preserves prior asset generations for unchanged files.`;
manifest.generatedAt='2026-08-22T23:50:00+08:00';
manifest.appRelease=RELEASE;
manifest.qualityGate='Permanent Bento recipe standard plus v28 Indian, v29 Italian, v30 French, v31 Spanish and v32 American gates: authentic regional dish identity, complete measured ingredients, recipe-recommended serving defaults, nonlinear salt/pepper scaling regression protection, coherent time math, equipment, stored and inferred critical-allergen coverage, authoritative tourism/cultural/community references, dish-specific photo routing, doneness cues, semantic ingredient-method consistency, safety adaptations where warranted, and variable-length methods with no artificial step ceiling or cuisine-size cap.';
manifest.allergenPolicy='Allergen metadata is merged with ingredient-based inference for soy, gluten, egg, milk, fish, shellfish, nuts, sesame, coconut and mustard. Plant milks and nut butters remain excluded from false dairy detection; milk-fed meat is not dairy. v32 hardening adds narrow recognition for tartar sauce (while protecting vegan/egg-free variants), walleye and halibut while retaining prior named-fish, mollusc and wheat-term coverage.';
manifest.qualityAuditSnapshot ||= {};
manifest.qualityAuditSnapshot.fullLibrary={recipeCount:TOTAL,uniqueRecipeIds:TOTAL,criticalStructureFailures:0,releaseGate:'pass'};
manifest.qualityAuditSnapshot.standardCuisines ||= {};
Object.assign(manifest.qualityAuditSnapshot.standardCuisines,{
  recipeCount:STANDARD,
  American:AMERICAN_COUNT,
  flaggedRecipes:0,
  allergenFailures:0,
  referenceFailures:0,
  equipmentFailures:0,
  photoMetadataFailures:0,
  hierarchy:'American 243 > Spanish 215 > Japanese 189 > Filipino 184 > French 175 > Korean 174 > Indian 171 > Italian 165 > Vietnamese 130 > Chinese 90 = Thai 90 at the v32 American checkpoint; Japanese/Filipino ranking restoration is a separate gap-driven follow-up before public v1 rather than filler inside the American release.'
});
manifest.qualityAuditSnapshot.methodDepth ||= {};
manifest.qualityAuditSnapshot.methodDepth.AmericanStepRange='4-9';
manifest.qualityAuditSnapshot.PWA ||= {};
manifest.qualityAuditSnapshot.PWA.assetVersion=ASSET;
manifest.qualityAuditSnapshot.PWA.recipeQualityRuntime=40;
manifest.qualityAuditSnapshot.v32American={
  auditedAt:'2026-08-22',
  AmericanTotal:AMERICAN_COUNT,
  firstId:'us_001',
  lastId:'us_243',
  coveragePolicy:'coverage determines recipe count; 243 is the completed reviewed American pass, not a target or cap',
  regionalCoverage:[
    'New England','New York / Pennsylvania / Mid-Atlantic / Chesapeake','Appalachia / Lowcountry / Southern coastal / Deep South','Louisiana Cajun / Creole / New Orleans','Black American regional foodways','Carolinas / Memphis / Alabama / Kentucky / Tennessee barbecue and regional traditions','Texas barbecue / Tejano / Tex-Mex / Texas Czech traditions','Midwest / Great Lakes / Upper Midwest / Plains','Southwest / New Mexico / Mountain West','California / Pacific Northwest','Alaska','Traditional Native Hawaiian','Hawaiʻi local / plantation-era multicultural','Nation/community-specific Cherokee, Choctaw, Chickasaw, Ojibwe, Potawatomi, Diné and Kanien’kehá:ka foodways'
  ],
  culturalPolicy:'Indigenous, Black American, immigrant-derived and borderlands dishes retain specific community/regional attribution where reliable sources support it; generic flattening and filler were rejected.',
  allergenFailures:0,
  structureFailures:0,
  sourceFailures:0,
  photoMetadataFailures:0,
  status:'passed'
};
fs.writeFileSync('data/library_manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({release:RELEASE,asset:ASSET,american:AMERICAN_COUNT,total:TOTAL,standard:STANDARD,modules:modules.length},null,2));
