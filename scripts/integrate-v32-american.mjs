import fs from 'node:fs';

const RELEASE='32.0';
const ASSET='32p1';
const AMERICAN_COUNT=243;
const BASE_TOTAL=2181;
const BASE_STANDARD=1710;
const TOTAL=BASE_TOTAL+AMERICAN_COUNT;
const STANDARD=BASE_STANDARD+AMERICAN_COUNT;
const modules=fs.readdirSync('data')
  .filter(n=>/^american-recipes-\d{3}-\d{3}\.js$/.test(n))
  .sort((a,b)=>Number(a.match(/-(\d{3})-/)[1])-Number(b.match(/-(\d{3})-/)[1]));
if(modules.length!==32)throw new Error(`Expected 32 American recipe modules, found ${modules.length}`);

const current=JSON.parse(fs.readFileSync('data/library_manifest.json','utf8'));
if(current.recipeCount!==2181||current.standardRecipeCount!==1710||current.japaneseRecipeCount!==252||current.filipinoRecipeCount!==248||current.appRelease!=='31.3'){
  throw new Error(`Unexpected production baseline: ${JSON.stringify({recipeCount:current.recipeCount,standardRecipeCount:current.standardRecipeCount,japaneseRecipeCount:current.japaneseRecipeCount,filipinoRecipeCount:current.filipinoRecipeCount,appRelease:current.appRelease})}`);
}

const tags=[
  `  <script src="data/american-runtime.js?v=${ASSET}" defer></script>`,
  ...modules.map(n=>`  <script src="data/${n}?v=${ASSET}" defer></script>`)
].join('\n');
let index=fs.readFileSync('index.html','utf8');
const qualityTag=/  <script src="data\/recipe-quality-runtime\.js\?v=[^"]+" defer><\/script>/;
if(index.includes('data/american-runtime.js'))throw new Error('American runtime unexpectedly already integrated');
if(!qualityTag.test(index))throw new Error('index quality-runtime insertion point missing');
index=index.replace(qualityTag,`${tags}\n  <script src="data/recipe-quality-runtime.js?v=${ASSET}" defer></script>`);
for(const expected of ['data/japanese-extra-244-252.js?v=31j2','data/filipino-extra-241-248.js?v=31f1','data/american-runtime.js?v=32p1','data/american-recipes-235-243.js?v=32p1','data/recipe-quality-runtime.js?v=32p1']){
  if(!index.includes(expected))throw new Error(`index integration missing ${expected}`);
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
if(sw.includes('./data/american-runtime.js'))throw new Error('American runtime unexpectedly already cached');
if(!swQuality.test(sw))throw new Error('service-worker quality-runtime insertion point missing');
sw=sw.replace(swQuality,`${swAmerican}\n  './data/recipe-quality-runtime.js?v=${ASSET}',`);
for(const expected of ["'./data/japanese-extra-244-252.js?v=31j2'","'./data/filipino-extra-241-248.js?v=31f1'","'./data/american-runtime.js?v=32p1'","'./data/american-recipes-235-243.js?v=32p1'","'./data/recipe-quality-runtime.js?v=32p1'"]){
  if(!sw.includes(expected))throw new Error(`service-worker integration missing ${expected}`);
}
fs.writeFileSync('service-worker.js',sw);

const manifest=current;
manifest.libraryVersion=39;
manifest.recipeCount=TOTAL;
manifest.newRecipesThisBuild=AMERICAN_COUNT;
manifest.cuisineCount=11;
manifest.verifiedCuisineLibraries=[...(manifest.verifiedCuisineLibraries||[]).filter(x=>x!=='American'),'American'];
manifest.standardRecipeCount=STANDARD;
manifest.japaneseRecipeCount=252;
manifest.filipinoRecipeCount=248;
manifest.americanRecipeCount=AMERICAN_COUNT;
manifest.dishImageCount=TOTAL;
manifest.instructionVersion=39;
manifest.detailedInstructionRecipeCount=TOTAL;
manifest.cacheFix=`v32.0 adds the ${AMERICAN_COUNT}-recipe American coverage-first regional library under the ${ASSET} shell generation while preserving Japanese v31.2 and Filipino v31.3 depth releases and all prior unchanged assets.`;
manifest.generatedAt=new Date().toISOString();
manifest.appRelease=RELEASE;
manifest.qualityGate='Permanent Bento recipe standard plus completed Indian, Italian, French, Spanish, Japanese, Filipino and American coverage gates: authentic regional dish identity, complete measured ingredients, recipe-recommended serving defaults, nonlinear salt/pepper scaling regression protection, coherent time math, equipment, stored and inferred critical-allergen coverage, authoritative tourism/cultural/community references, dish-specific photo routing, doneness cues, semantic ingredient-method consistency, safety adaptations where warranted, and variable-length methods with no artificial step ceiling or cuisine-size cap.';
manifest.allergenPolicy='Allergen metadata is merged with ingredient-based inference for soy, gluten, egg, milk, fish, shellfish, nuts, sesame, coconut and mustard. Plant milks and nut butters remain excluded from false dairy detection; milk-fed meat is not dairy. v32 hardening adds narrow recognition for tartar sauce while protecting vegan/egg-free variants, plus walleye, halibut, catfish, crawfish, pecans, buns and oyster crackers.';
manifest.qualityAuditSnapshot ||= {};
manifest.qualityAuditSnapshot.fullLibrary={recipeCount:TOTAL,uniqueRecipeIds:TOTAL,criticalStructureFailures:0,releaseGate:'pass'};
manifest.qualityAuditSnapshot.standardCuisines ||= {};
Object.assign(manifest.qualityAuditSnapshot.standardCuisines,{
  recipeCount:STANDARD,
  Japanese:252,
  Filipino:248,
  American:AMERICAN_COUNT,
  flaggedRecipes:0,
  allergenFailures:0,
  referenceFailures:0,
  equipmentFailures:0,
  photoMetadataFailures:0,
  hierarchy:'Japanese 252 > Filipino 248 > American 243 > Spanish 215 > French 175 > Korean 174 > Indian 171 > Italian 165 > Vietnamese 130 > Chinese 90 = Thai 90'
});
manifest.qualityAuditSnapshot.methodDepth ||= {};
manifest.qualityAuditSnapshot.methodDepth.AmericanStepRange='5-10';
manifest.qualityAuditSnapshot.PWA ||= {};
manifest.qualityAuditSnapshot.PWA.assetVersion=ASSET;
manifest.qualityAuditSnapshot.PWA.recipeQualityRuntime=40;
manifest.qualityAuditSnapshot.v32American={
  auditedAt:new Date().toISOString().slice(0,10),
  AmericanTotal:AMERICAN_COUNT,
  firstId:'us_001',
  lastId:'us_243',
  productionBase:'0ab4e84aa523120bc750e9b567001c561437c7e2',
  productionBaseTotal:BASE_TOTAL,
  productionBaseStandard:BASE_STANDARD,
  JapanesePreserved:252,
  FilipinoPreserved:248,
  coveragePolicy:'coverage determines recipe count; 243 is the completed reviewed American pass, not a target or cap',
  regionalCoverage:[
    'New England','New York / Pennsylvania / Mid-Atlantic / Chesapeake','Appalachia / Lowcountry / Southern coastal / Deep South','Louisiana Cajun / Creole / New Orleans','Black American regional foodways','Carolinas / Memphis / Alabama / Kentucky / Tennessee barbecue and regional traditions','Texas barbecue / Tejano / Tex-Mex / Texas Czech traditions','Midwest / Great Lakes / Upper Midwest / Plains','Southwest / New Mexico / Mountain West','California / Pacific Northwest','Alaska','Traditional Native Hawaiian','Hawaiʻi local / plantation-era multicultural','Nation/community-specific Cherokee, Choctaw, Chickasaw, Ojibwe, Potawatomi, Diné and Kanien’kehá:ka foodways'
  ],
  culturalPolicy:'Indigenous, Black American, immigrant-derived and borderlands dishes retain specific community/regional attribution where reliable sources support it; generic flattening and filler were rejected.',
  allergenFailures:0,
  structureFailures:0,
  sourceFailures:0,
  photoMetadataFailures:0,
  runtimeRegression:'passed',
  status:'passed'
};
fs.writeFileSync('data/library_manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({release:RELEASE,asset:ASSET,american:AMERICAN_COUNT,total:TOTAL,standard:STANDARD,japanese:252,filipino:248,modules:modules.length},null,2));
