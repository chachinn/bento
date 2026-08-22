import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {TextDecoder,TextEncoder} from 'node:util';

const fail=[]; const assert=(v,m)=>{if(!v)fail.push(m)};
const clean=s=>String(s).split('?')[0].replace(/^\.\//,'');
const modules=['data/japanese-extra-190-194.js','data/japanese-extra-195-198.js','data/japanese-extra-199-207.js'];
const index=fs.readFileSync('index.html','utf8');
const srcs=[...index.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>m[1]);
const local=srcs.map(clean).filter(s=>s.endsWith('.js'));
for(const f of [...new Set([...local,'service-worker.js','app.js'])]){
  assert(fs.existsSync(f),`missing ${f}`);
  if(fs.existsSync(f)){try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});}catch{fail.push(`syntax ${f}`)}}
}
for(const f of modules){assert(local.filter(x=>x===f).length===1,`index must contain ${f} exactly once`);assert(index.includes(`${f}?v=31j1`),`index asset version for ${f}`)}
const old=local.indexOf('data/japanese-extra-171-189.js'),first=local.indexOf(modules[0]),fil=local.indexOf('data/filipino-extra-165-184.js');
assert(old>=0&&first===old+1,'new Japanese modules must follow japanese-extra-171-189');
assert(modules.every((f,i)=>local.indexOf(f)===first+i),'new Japanese modules must be contiguous');
assert(fil>local.indexOf(modules.at(-1)),'Filipino module must remain after Japanese modules');

const sw=fs.readFileSync('service-worker.js','utf8');
assert(sw.includes("const CACHE='bento-shell-v1.0.0-v31j1';"),'service-worker cache must be 31j1');
assert(/ASSET_VERSIONS=new Set\(\[[^\]]*'31j1'/.test(sw),'service-worker must accept 31j1');
for(const f of modules) assert(sw.includes(`'./${f}?v=31j1'`),`service-worker missing ${f}`);

const manifest=JSON.parse(fs.readFileSync('data/library_manifest.json','utf8'));
assert(manifest.appRelease==='31.1','manifest release');
assert(manifest.recipeCount===2072,'manifest total');
assert(manifest.standardRecipeCount===1601,'manifest standard total');
assert(manifest.japaneseRecipeCount===207,'manifest Japanese total');
assert(manifest.newRecipesThisBuild===18,'manifest added count');
assert(manifest.cuisineCount===10,'cuisine count must stay 10');
assert(manifest.qualityAuditSnapshot?.PWA?.assetVersion==='31j1','manifest PWA asset');
assert(manifest.qualityAuditSnapshot?.japaneseRegionalCompletion?.status==='passed','Japanese completion audit snapshot');
assert(manifest.qualityAuditSnapshot?.japaneseRegionalCompletion?.legacyStableId==='jp_149_souffle_pancakes','legacy Japanese ID preserved');

const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()};
const stub=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){return false},contains(){return false}},addEventListener(){},removeEventListener(){},append(){},appendChild(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return []}});
const document={body:stub(),documentElement:stub(),head:stub(),createElement:stub,querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},addEventListener(){},removeEventListener(){}};
const atob=s=>Buffer.from(String(s),'base64').toString('binary'),btoa=s=>Buffer.from(String(s),'binary').toString('base64');
const g={BENTO_RECIPE_LIBRARY:[],BENTO_RECIPE_PHOTO_INDEX:{},console,TextDecoder,TextEncoder,Buffer,atob,btoa,URL,URLSearchParams,Map,Set,WeakMap,WeakSet,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,Intl,Promise,Error,TypeError,parseInt,parseFloat,isNaN,setTimeout,clearTimeout,setInterval,clearInterval,localStorage,document,navigator:{userAgent:'Bento QA',language:'en-US'},location:{href:'https://example.test/',origin:'https://example.test',pathname:'/'},performance:{now:()=>0},crypto:{randomUUID:()=>`qa-${Math.random()}`}};g.window=g;g.self=g;g.globalThis=g;
const c=vm.createContext(g);
for(const f of local.filter(x=>x.startsWith('data/'))){try{vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f,timeout:15000})}catch(e){fail.push(`execute ${f}: ${e.message}`);break}}
const rows=Array.isArray(c.BENTO_RECIPE_LIBRARY)?c.BENTO_RECIPE_LIBRARY:[];
assert(rows.length===2072,`runtime total ${rows.length}`);
assert(new Set(rows.map(r=>String(r.id))).size===2072,'runtime IDs must be unique');
const counts={};for(const r of rows){const k=String(r.cuisine||'(none)');counts[k]=(counts[k]||0)+1}
const expected={Japanese:207,Filipino:184,Korean:174,Chinese:90,Thai:90,Vietnamese:130,Indian:171,Italian:165,French:175,Spanish:215,Teyvat:372,'(none)':99};
for(const [k,v] of Object.entries(expected)) assert(counts[k]===v,`${k} count ${counts[k]}`);
const jp=rows.filter(r=>r.cuisine==='Japanese');
assert(jp.some(r=>r.id==='jp_149_souffle_pancakes'&&r.title==='Japanese Soufflé Pancakes'),'legacy Japanese stable ID missing');
assert(jp.some(r=>r.id==='jp_190')&&jp.some(r=>r.id==='jp_207'),'Japanese expansion endpoints missing');
const verified=new Set(manifest.verifiedCuisineLibraries||[]);
assert(rows.filter(r=>verified.has(r.cuisine)).length===1601,'standard cuisine runtime total');

try{
  execFileSync('git',['fetch','origin','main','--depth=1'],{stdio:'pipe'});
  const diff=execFileSync('git',['diff','--name-status','origin/main'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  assert(!diff.some(x=>x.startsWith('D\t')),'production deletion detected vs main');
  for(const f of ['app.js','style.css','manifest.json']) assert(!diff.some(x=>x.endsWith(`\t${f}`)||x===`M\t${f}`),`unexpected production change ${f}`);
}catch(e){fail.push(`git regression comparison: ${e.message}`)}

if(fail.length){console.error(`Japanese release QA FAILED (${fail.length})`);for(const x of fail)console.error('-',x);process.exit(1)}
console.log('Japanese release QA PASSED');
console.log(JSON.stringify({release:'31.1',asset:'31j1',total:rows.length,uniqueIds:new Set(rows.map(r=>r.id)).size,standard:rows.filter(r=>verified.has(r.cuisine)).length,japanese:jp.length,added:18},null,2));
