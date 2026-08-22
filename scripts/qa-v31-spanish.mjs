import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';

const root=process.cwd();
const fail=[];
const assert=(ok,msg)=>{if(!ok)fail.push(msg)};
const dataDir=path.join(root,'data');
const spanishModules=fs.readdirSync(dataDir).filter(n=>/^spanish-recipes-\d{3}-\d{3}\.js$/.test(n)).sort((a,b)=>Number(a.match(/-(\d{3})-/)[1])-Number(b.match(/-(\d{3})-/)[1]));

// Syntax gate across production JavaScript.
for(const f of [...fs.readdirSync(dataDir).filter(n=>n.endsWith('.js')).map(n=>path.join('data',n)),'app.js','service-worker.js']){
  try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});}catch(e){fail.push(`Syntax: ${f}`)}
}

function sandbox(initial=[]){
  const window={BENTO_RECIPE_LIBRARY:initial};
  window.window=window;
  const noop=()=>{};
  const document={querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null,createElement:()=>({setAttribute:noop,addEventListener:noop}),addEventListener:noop};
  return vm.createContext({window,document,console,setTimeout,clearTimeout,URL,Map,Set,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp});
}
function run(file,ctx){vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file,timeout:10000});}

// Load Spanish before shared quality enrichment.
const sctx=sandbox([]);
run(path.join(dataDir,'spanish-runtime.js'),sctx);
for(const n of spanishModules)run(path.join(dataDir,n),sctx);
const spanish=sctx.window.BENTO_RECIPE_LIBRARY;
assert(spanish.length===215,`Spanish count ${spanish.length} != 215`);
assert(new Set(spanish.map(r=>r.id)).size===215,'Spanish duplicate IDs');
assert(new Set(spanish.map(r=>r.title.trim().toLowerCase())).size===215,'Spanish duplicate normalized titles');
for(let i=0;i<spanish.length;i++)assert(spanish[i].id===`es_${String(i+1).padStart(3,'0')}`,`Spanish ID sequence at ${i+1}: ${spanish[i].id}`);

const allowedAllergens=new Set(['soy','gluten','egg','milk','fish','shellfish','nuts','sesame','coconut','mustard']);
const allowedCategories=new Set(['Main Dishes','Rice & Donburi','Noodles','Soups & Hot Pots','Sushi & Seafood','Fried & Street Food','Side Dishes','Breakfast','Breads & Pastries','Sweets & Desserts','Drinks','Other']);
const norm=a=>[...new Set(a)].sort().join('|');
const bodies=new Map(), methods=new Map();
for(const r of spanish){
  assert(r.cuisine==='Spanish',`${r.id}: cuisine ${r.cuisine}`);
  assert(r.recipeType==='Reviewed classic',`${r.id}: recipeType ${r.recipeType}`);
  assert(allowedCategories.has(r.category),`${r.id}: incompatible category ${r.category}`);
  assert(Number.isFinite(r.servings)&&r.servings>0,`${r.id}: servings`);
  assert(Number.isFinite(r.prep)&&r.prep>=0&&Number.isFinite(r.cook)&&r.cook>=0&&Number.isFinite(r.total)&&r.total>=r.prep+r.cook,`${r.id}: timing`);
  assert(Array.isArray(r.ingredients)&&r.ingredients.length>=2,`${r.id}: ingredients`);
  assert(Array.isArray(r.steps)&&r.steps.length>=4,`${r.id}: method depth`);
  assert(typeof r.equipment==='string'&&r.equipment.trim().length>5,`${r.id}: equipment`);
  assert(Array.isArray(r.sourceUrls)&&r.sourceUrls.length>=1&&r.sourceUrls.every(u=>/^https:\/\//.test(u)),`${r.id}: HTTPS sources`);
  assert(Array.isArray(r.photoQueries)&&r.photoQueries.length>=2&&r.photoQueries.every(q=>q.toLowerCase().includes(r.title.split(/\s+/)[0].toLowerCase())||q.toLowerCase().includes(r.title.toLowerCase())),`${r.id}: title-specific photo queries`);
  assert(Array.isArray(r.allergens)&&r.allergens.every(a=>allowedAllergens.has(a)),`${r.id}: allergen vocabulary`);
  const ib=r.ingredients.map(x=>String(x).trim().toLowerCase()).join('\n');
  const mb=r.steps.map(x=>String(x).trim().toLowerCase()).join('\n');
  if(bodies.has(ib))fail.push(`Exact ingredient-body duplicate: ${bodies.get(ib)} / ${r.id}`); else bodies.set(ib,r.id);
  if(methods.has(mb))fail.push(`Exact method-body duplicate: ${methods.get(mb)} / ${r.id}`); else methods.set(mb,r.id);
}

// Exact stored-vs-inferred Spanish allergen gate.
const ictx=sandbox([]);
run(path.join(dataDir,'recipe-quality-runtime.js'),ictx);
const infer=ictx.window.BENTO_INFER_ALLERGENS;
for(const r of spanish){
  const expected=norm(infer(r.ingredients));
  const stored=norm(r.allergens);
  assert(expected===stored,`${r.id}: stored allergens [${stored}] != inferred [${expected}]`);
}

// Integration references.
const index=fs.readFileSync('index.html','utf8');
const scriptRefs=[...index.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
const spanishRefs=['data/spanish-runtime.js?v=31p1',...spanishModules.map(n=>`data/${n}?v=31p1`)];
for(const ref of spanishRefs)assert(scriptRefs.filter(x=>x===ref).length===1,`Index reference count for ${ref}`);
assert(scriptRefs.indexOf('data/spanish-runtime.js?v=31p1')<scriptRefs.indexOf('data/spanish-recipes-001-005.js?v=31p1'),'Spanish runtime order');
assert(scriptRefs.indexOf(spanishRefs.at(-1))<scriptRefs.indexOf('data/recipe-quality-runtime.js?v=31p1'),'Spanish must precede quality runtime');
for(const ref of scriptRefs){
  const p=ref.split('?')[0];
  if(p.startsWith('data/')||p==='app.js')assert(fs.existsSync(p),`Missing index asset ${p}`);
}

const sw=fs.readFileSync('service-worker.js','utf8');
assert(sw.includes("const CACHE='bento-shell-v1.0.0-v31p1';"),'Service worker cache version');
assert(sw.includes("'31p1'"),'Service worker accepts 31p1');
for(const ref of spanishRefs.map(x=>'./'+x))assert(sw.includes(`'${ref}'`),`Missing service-worker asset ${ref}`);
assert(sw.includes("'./data/recipe-quality-runtime.js?v=31p1'"),'Service worker quality-runtime version');
const coreRefs=[...sw.matchAll(/'((?:\.\/)[^']+)'/g)].map(m=>m[1]);
for(const ref of coreRefs){
  const p=ref.replace(/^\.\//,'').split('?')[0];
  if(!p.includes('*'))assert(fs.existsSync(p),`Missing service-worker file ${p}`);
}

// Execute all production data scripts in index order, excluding app.js.
const fullCtx=sandbox([]);
let execFailures=0;
for(const ref of scriptRefs){
  const p=ref.split('?')[0];
  if(!p.startsWith('data/')||p==='data/library_manifest.json')continue;
  try{run(p,fullCtx);}catch(e){execFailures++;fail.push(`Data script execution ${p}: ${e.message}`)}
}
const lib=fullCtx.window.BENTO_RECIPE_LIBRARY||[];
assert(execFailures===0,`Data script execution failures ${execFailures}`);
assert(lib.length===2054,`Full library count ${lib.length} != 2054`);
assert(new Set(lib.map(r=>String(r.id))).size===2054,'Full library duplicate IDs');
const expectedCounts={Japanese:189,Filipino:184,Korean:174,Chinese:90,Thai:90,Vietnamese:130,Indian:171,Italian:165,French:175,Spanish:215};
for(const [c,n] of Object.entries(expectedCounts))assert(lib.filter(r=>r.cuisine===c).length===n,`${c} count != ${n}`);
assert(lib.filter(r=>r.cuisine==='Genshin Impact').length===372||lib.filter(r=>String(r.id).startsWith('genshin')).length===372,'Genshin count regression');
assert(lib.filter(r=>r.cuisine==='Anime').length===99||lib.filter(r=>String(r.id).startsWith('anime')).length===99,'Anime count regression');

// Manifest gate.
const manifest=JSON.parse(fs.readFileSync(path.join(dataDir,'library_manifest.json'),'utf8'));
assert(manifest.libraryVersion===35,'Manifest libraryVersion');
assert(manifest.recipeCount===2054,'Manifest recipeCount');
assert(manifest.standardRecipeCount===1583,'Manifest standardRecipeCount');
assert(manifest.spanishRecipeCount===215,'Manifest Spanish count');
assert(manifest.qualityAuditSnapshot?.PWA?.assetVersion==='31p1','Manifest PWA version');
assert(manifest.qualityAuditSnapshot?.PWA?.recipeQualityRuntime===32,'Manifest quality runtime version');
assert(manifest.qualityAuditSnapshot?.v31Spanish?.status==='passed','Manifest v31 QA snapshot');

// Persisted user-state schema must not be bumped for a content-only cuisine release.
const app=fs.readFileSync('app.js','utf8');
const versionMatch=app.match(/const VERSION\s*=\s*(\d+)/);
assert(versionMatch&&Number(versionMatch[1])===28,`Unexpected app state schema VERSION ${versionMatch?.[1]}`);

if(fail.length){
  console.error(`Bento v31 QA FAILED (${fail.length})`);
  for(const f of fail)console.error('-',f);
  process.exit(1);
}
const distribution={};for(const r of spanish)distribution[r.steps.length]=(distribution[r.steps.length]||0)+1;
console.log('Bento v31 QA PASSED');
console.log(JSON.stringify({Spanish:spanish.length,modules:spanishModules.length,total:lib.length,uniqueIds:new Set(lib.map(r=>String(r.id))).size,stepDistribution:distribution},null,2));
