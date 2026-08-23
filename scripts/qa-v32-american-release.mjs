import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {TextDecoder,TextEncoder} from 'node:util';

const fail=[];const assert=(v,m)=>{if(!v)fail.push(m)};
const cleanSrc=s=>String(s).split('?')[0].replace(/^\.\//,'');
const index=fs.readFileSync('index.html','utf8');
const scriptSrcs=[...index.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
const localJs=scriptSrcs.map(cleanSrc).filter(s=>s.endsWith('.js'));
for(const f of [...new Set([...localJs,'service-worker.js','app.js'])]){
  assert(fs.existsSync(f),`missing ${f}`);
  if(fs.existsSync(f)){try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});}catch(e){fail.push(`syntax ${f}`)}}
}

const modules=fs.readdirSync('data').filter(n=>/^american-recipes-\d{3}-\d{3}\.js$/.test(n)).sort((a,b)=>Number(a.match(/-(\d{3})-/)[1])-Number(b.match(/-(\d{3})-/)[1]));
assert(modules.length===32,`American module count ${modules.length}`);
const americanRefs=['data/american-runtime.js',...modules.map(n=>`data/${n}`)];
for(const f of americanRefs)assert(localJs.includes(f),`index missing ${f}`);
for(const f of americanRefs)assert(localJs.filter(x=>x===f).length===1,`index duplicate ${f}`);
const ai=localJs.indexOf('data/american-runtime.js'),aq=localJs.indexOf('data/recipe-quality-runtime.js');
assert(ai>=0&&aq>ai,'American runtime must load before recipe-quality runtime');
assert(modules.every(n=>localJs.indexOf(`data/${n}`)>ai&&localJs.indexOf(`data/${n}`)<aq),'American modules must load after runtime and before quality runtime');
assert(index.includes('data/american-runtime.js?v=32p1'),'American runtime asset version');
assert(index.includes('data/recipe-quality-runtime.js?v=32p1'),'quality runtime v32 asset version');
assert(index.includes('data/japanese-extra-244-252.js?v=31j2'),'Japanese v31.2 depth asset preserved');
assert(index.includes('data/filipino-extra-241-248.js?v=31f1'),'Filipino v31.3 depth asset preserved');

const sw=fs.readFileSync('service-worker.js','utf8');
assert(sw.includes("const CACHE='bento-shell-v1.0.0-v32p1';"),'service worker cache 32p1');
assert(/ASSET_VERSIONS=new Set\(\[[^\]]*'32p1'/.test(sw),'service worker accepts 32p1');
for(const f of americanRefs)assert(sw.includes(`'./${f}?v=32p1'`),`service worker missing ${f}`);
assert(sw.includes("'./data/recipe-quality-runtime.js?v=32p1'"),'service worker quality runtime v32');
assert(sw.includes("'./data/japanese-extra-244-252.js?v=31j2'"),'service worker Japanese v31.2 asset preserved');
assert(sw.includes("'./data/filipino-extra-241-248.js?v=31f1'"),'service worker Filipino v31.3 asset preserved');

const manifest=JSON.parse(fs.readFileSync('data/library_manifest.json','utf8'));
assert(manifest.appRelease==='32.0','manifest release');
assert(manifest.libraryVersion===39,'manifest library version');
assert(manifest.instructionVersion===39,'manifest instruction version');
assert(manifest.recipeCount===2424,'manifest total');
assert(manifest.standardRecipeCount===1953,'manifest standard total');
assert(manifest.japaneseRecipeCount===252,'manifest Japanese total');
assert(manifest.filipinoRecipeCount===248,'manifest Filipino total');
assert(manifest.americanRecipeCount===243,'manifest American total');
assert(manifest.cuisineCount===11,'manifest cuisine count');
assert(manifest.verifiedCuisineLibraries?.includes('American'),'manifest verified American');
assert(manifest.qualityAuditSnapshot?.fullLibrary?.uniqueRecipeIds===2424,'manifest unique runtime total');
assert(manifest.qualityAuditSnapshot?.PWA?.assetVersion==='32p1','manifest PWA asset');
assert(manifest.qualityAuditSnapshot?.PWA?.recipeQualityRuntime===40,'manifest quality runtime');

const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()};
const stubEl=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){return false},contains(){return false}},addEventListener(){},removeEventListener(){},append(){},appendChild(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return []}});
const document={body:stubEl(),documentElement:stubEl(),head:stubEl(),createElement:stubEl,querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},addEventListener(){},removeEventListener(){}};
const atob=s=>Buffer.from(String(s),'base64').toString('binary');
const btoa=s=>Buffer.from(String(s),'binary').toString('base64');
const make=()=>{const g={BENTO_RECIPE_LIBRARY:[],BENTO_RECIPE_PHOTO_INDEX:{},console,TextDecoder,TextEncoder,Buffer,atob,btoa,URL,URLSearchParams,Map,Set,WeakMap,WeakSet,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,Intl,Promise,Error,TypeError,parseInt,parseFloat,isNaN,setTimeout,clearTimeout,setInterval,clearInterval,localStorage,document,navigator:{userAgent:'Bento QA',language:'en-US'},location:{href:'https://example.test/',origin:'https://example.test',pathname:'/'},performance:{now:()=>0},crypto:{randomUUID:()=>`qa-${Math.random()}`}};g.window=g;g.self=g;g.globalThis=g;return vm.createContext(g)};
const c=make();
for(const src of localJs.filter(f=>f.startsWith('data/'))){
  try{vm.runInContext(fs.readFileSync(src,'utf8'),c,{filename:src,timeout:15000});}catch(e){fail.push(`execute ${src}: ${e.message}`);break;}
}
const rows=Array.isArray(c.BENTO_RECIPE_LIBRARY)?c.BENTO_RECIPE_LIBRARY:[];
assert(rows.length===2424,`full library count ${rows.length}`);
assert(new Set(rows.map(r=>String(r.id))).size===2424,'full library unique IDs');
const counts={};for(const r of rows){const k=String(r.cuisine||'');counts[k]=(counts[k]||0)+1;}
const expected={Japanese:252,Filipino:248,Korean:174,Chinese:90,Thai:90,Vietnamese:130,Indian:171,Italian:165,French:175,Spanish:215,American:243,Teyvat:372,'':99};
for(const [k,v] of Object.entries(expected))assert(counts[k]===v,`${k||'(none)'} count ${counts[k]}`);
const verified=new Set(manifest.verifiedCuisineLibraries||[]);
assert(rows.filter(r=>verified.has(r.cuisine)).length===1953,'standard cuisine runtime count');
const americans=rows.filter(r=>r.cuisine==='American');
assert(americans.length===243,'runtime American count');
assert(americans[0]?.id==='us_001'&&americans.at(-1)?.id==='us_243','runtime American sequence endpoints');
assert(Math.min(...americans.map(r=>r.steps?.length||0))===5&&Math.max(...americans.map(r=>r.steps?.length||0))===10,'American method step range 5-10');
assert(c.BENTO_RECIPE_QUALITY_VERSION===40,'runtime recipe quality version 40');

try{
  execFileSync('git',['fetch','origin','main','--depth=1'],{stdio:'pipe'});
  const diff=execFileSync('git',['diff','--name-status','origin/main','HEAD'],{encoding:'utf8'});
  assert(!diff.split(/\r?\n/).some(x=>x.startsWith('D\t')),'production deletion detected vs main');
  const forbidden=['app.js','style.css','manifest.json'];
  for(const f of forbidden)assert(!diff.split(/\r?\n/).some(x=>x.endsWith(`\t${f}`)||x===`M\t${f}`),`unexpected production change ${f}`);
}catch(e){fail.push(`git regression comparison: ${e.message}`)}

if(fail.length){console.error(`Bento v32 release QA FAILED (${fail.length})`);for(const x of fail)console.error('-',x);process.exit(1)}
console.log('Bento v32 release QA PASSED');
console.log(JSON.stringify({total:rows.length,uniqueIds:new Set(rows.map(r=>r.id)).size,standard:rows.filter(r=>verified.has(r.cuisine)).length,japanese:counts.Japanese,filipino:counts.Filipino,american:americans.length,americanModules:modules.length,americanStepRange:[5,10],asset:'32p1',release:'32.0',qualityRuntime:c.BENTO_RECIPE_QUALITY_VERSION},null,2));
