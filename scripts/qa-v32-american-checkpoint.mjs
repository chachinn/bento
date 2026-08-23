import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {TextDecoder,TextEncoder} from 'node:util';

const dataDir='data';
const modules=fs.readdirSync(dataDir).filter(n=>/^american-recipes-\d{3}-\d{3}\.js$/.test(n)).sort((a,b)=>Number(a.match(/-(\d{3})-/)[1])-Number(b.match(/-(\d{3})-/)[1]));
const fail=[];const assert=(v,m)=>{if(!v)fail.push(m)};
for(const f of ['data/american-runtime.js',...modules.map(n=>`data/${n}`)]){try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'});}catch{fail.push(`syntax ${f}`)}}
const make=()=>{const g={BENTO_RECIPE_LIBRARY:[],console,TextDecoder,TextEncoder,Buffer,URL,Map,Set,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,setTimeout,clearTimeout};g.window=g;g.self=g;return vm.createContext(g)};
const run=(f,c)=>vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f,timeout:10000});
const c=make();run('data/american-runtime.js',c);for(const n of modules)run(`data/${n}`,c);const rows=c.BENTO_RECIPE_LIBRARY;
assert(rows.length>0,'no American recipes loaded');assert(new Set(rows.map(r=>r.id)).size===rows.length,'duplicate ids');assert(new Set(rows.map(r=>r.title.trim().toLowerCase())).size===rows.length,'duplicate titles');
for(let i=0;i<rows.length;i++)assert(rows[i].id===`us_${String(i+1).padStart(3,'0')}`,`sequence ${rows[i].id}`);
const ib=new Map(),mb=new Map();
for(const r of rows){
 assert(r.cuisine==='American',`${r.id} cuisine`);assert(r.recipeType==='Reviewed classic',`${r.id} type`);
 assert(Array.isArray(r.ingredients)&&r.ingredients.length>=2,`${r.id} ingredients`);assert(Array.isArray(r.steps)&&r.steps.length>=4,`${r.id} steps`);
 assert(Number.isFinite(r.prep)&&Number.isFinite(r.cook)&&Number.isFinite(r.total)&&r.total>=r.prep+r.cook,`${r.id} time`);
 assert(Array.isArray(r.sourceUrls)&&r.sourceUrls.length>=1&&r.sourceUrls.every(u=>/^https:\/\//.test(u)),`${r.id} sources`);
 assert(Array.isArray(r.photoQueries)&&r.photoQueries.length>=2&&r.photoQueries.every(q=>String(q).trim().length>=8),`${r.id} photos`);
 const a=r.ingredients.map(String).join('\n').toLowerCase(),b=r.steps.map(String).join('\n').toLowerCase();if(ib.has(a))fail.push(`ingredient duplicate ${ib.get(a)} ${r.id}`);else ib.set(a,r.id);if(mb.has(b))fail.push(`method duplicate ${mb.get(b)} ${r.id}`);else mb.set(b,r.id);
}
const q=make();run('data/recipe-quality-runtime.js',q);const infer=q.BENTO_INFER_ALLERGENS;const norm=a=>[...new Set((a||[]).map(String))].sort().join('|');
for(const r of rows){const expected=norm(infer(r.ingredients)),stored=norm(r.allergens);assert(expected===stored,`${r.id} allergens stored=[${stored}] inferred=[${expected}]`)}
if(fail.length){console.error(`American checkpoint QA FAILED (${fail.length})`);for(const x of fail)console.error('-',x);process.exit(1)}
console.log('American checkpoint QA PASSED');console.log(JSON.stringify({count:rows.length,modules:modules.length,first:rows[0].id,last:rows.at(-1).id,stepRange:[Math.min(...rows.map(r=>r.steps.length)),Math.max(...rows.map(r=>r.steps.length))]},null,2));

// Contents-API synchronization trigger for the observable PR release gate.
