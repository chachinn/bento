import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {TextDecoder,TextEncoder} from 'node:util';

const additions=['data/japanese-extra-208-216.js','data/japanese-extra-217-225.js','data/japanese-extra-226-234.js','data/japanese-extra-235-243.js','data/japanese-extra-244-252.js'];
const expectedIds=Array.from({length:45},(_,i)=>`jp_${String(208+i).padStart(3,'0')}`);
const allowedCategories=new Set(['Breads & Pastries','Breakfast','Drinks','Fried & Street Food','Main Dishes','Noodles','Rice & Donburi','Side Dishes','Soups & Hot Pots','Sushi & Seafood','Sweets & Desserts']);
const allowedAllergens=new Set(['soy','gluten','egg','milk','fish','shellfish','nuts','sesame','coconut','mustard']);
const fail=[]; const assert=(ok,msg)=>{if(!ok)fail.push(msg)};
for(const f of additions){assert(fs.existsSync(f),`missing ${f}`);try{execFileSync(process.execPath,['--check',f],{stdio:'pipe'})}catch{fail.push(`syntax ${f}`)}}

const index=fs.readFileSync('index.html','utf8');
const clean=s=>String(s).split('?')[0].replace(/^\.\//,'');
const srcs=[...index.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>clean(m[1]));
const fil=srcs.indexOf('data/filipino-extra-165-184.js');
assert(fil>0,'Filipino insertion point missing');
srcs.splice(fil,0,...additions);
const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()};
const stub=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){return false},contains(){return false}},addEventListener(){},removeEventListener(){},append(){},appendChild(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return []}});
const document={body:stub(),documentElement:stub(),head:stub(),createElement:stub,querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},addEventListener(){},removeEventListener(){}};
const atob=s=>Buffer.from(String(s),'base64').toString('binary'),btoa=s=>Buffer.from(String(s),'binary').toString('base64');
const g={BENTO_RECIPE_LIBRARY:[],BENTO_RECIPE_PHOTO_INDEX:{},console,TextDecoder,TextEncoder,Buffer,atob,btoa,URL,URLSearchParams,Map,Set,WeakMap,WeakSet,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,Intl,Promise,Error,TypeError,parseInt,parseFloat,isNaN,setTimeout,clearTimeout,setInterval,clearInterval,localStorage,document,navigator:{userAgent:'Bento QA',language:'en-US'},location:{href:'https://example.test/',origin:'https://example.test',pathname:'/'},performance:{now:()=>0},crypto:{randomUUID:()=>`qa-${Math.random()}`}};g.window=g;g.self=g;g.globalThis=g;
const c=vm.createContext(g);
for(const f of srcs.filter(x=>x.startsWith('data/')&&x.endsWith('.js'))){if(!fs.existsSync(f)){fail.push(`missing data script ${f}`);continue}try{vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f,timeout:15000})}catch(e){fail.push(`execute ${f}: ${e.message}`);break}}
const rows=Array.isArray(c.BENTO_RECIPE_LIBRARY)?c.BENTO_RECIPE_LIBRARY:[];
const ids=rows.map(r=>String(r.id||''));
assert(rows.length===2117,`runtime total expected 2117 got ${rows.length}`);
assert(new Set(ids).size===2117,'runtime IDs not unique');
const japanese=rows.filter(r=>r.cuisine==='Japanese');
assert(japanese.length===252,`Japanese expected 252 got ${japanese.length}`);
const newRows=expectedIds.map(id=>rows.find(r=>r.id===id));
assert(newRows.every(Boolean),'one or more expected new Japanese IDs missing');
const normalizedTitle=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const titleMap=new Map();for(const r of japanese){const k=normalizedTitle(r.title);if(!titleMap.has(k))titleMap.set(k,[]);titleMap.get(k).push(r.id)}
for(const [title,hits] of titleMap) if(title&&hits.length>1) fail.push(`duplicate Japanese title ${title}: ${hits.join(',')}`);
for(const r of newRows.filter(Boolean)){
 assert(r.cuisine==='Japanese'&&r.country==='Japan'&&r.countryCode==='JP',`${r.id}: identity`);
 assert(r.recipeType==='Reviewed classic',`${r.id}: recipeType`);
 assert(allowedCategories.has(r.category),`${r.id}: category ${r.category}`);
 assert(typeof r.region==='string'&&r.region.trim(),`${r.id}: region`);
 assert(Number.isInteger(r.servings)&&r.servings>0,`${r.id}: servings`);
 assert(Number.isFinite(r.prep)&&Number.isFinite(r.cook)&&Number.isFinite(r.total)&&r.total>=r.prep+r.cook,`${r.id}: time math`);
 assert(typeof r.equipment==='string'&&r.equipment.length>=8,`${r.id}: equipment`);
 assert(Array.isArray(r.ingredients)&&r.ingredients.length>=4,`${r.id}: ingredients`);
 assert(Array.isArray(r.steps)&&r.steps.length>=4&&r.steps.every(s=>String(s).length>=25),`${r.id}: method depth`);
 assert(Array.isArray(r.sourceUrls)&&r.sourceUrls.length>=3&&r.sourceUrls.every(u=>/^https:\/\//.test(u)),`${r.id}: sources`);
 assert(Array.isArray(r.photoQueries)&&r.photoQueries.length>=2&&r.photoQueries.every(Boolean),`${r.id}: photo queries`);
 assert(Array.isArray(r.allergens)&&r.allergens.every(a=>allowedAllergens.has(a)),`${r.id}: allergens`);
 const text=r.ingredients.join(' ').toLowerCase(); const has=a=>r.allergens.includes(a);
 if(/soy sauce|miso|tofu|aburaage|atsuage|soybean/.test(text)) assert(has('soy'),`${r.id}: missing soy`);
 if(/all-purpose flour|wheat|ramen noodles|udon|kishimen|yakisoba|chikuwa|fish cakes/.test(text)) assert(has('gluten'),`${r.id}: missing gluten`);
 if(/\beggs?\b|egg white|egg yolk/.test(text)) assert(has('egg'),`${r.id}: missing egg`);
 if(/\bmackerel\b|\bsalmon\b|\btrout\b|\bbonito\b|\bfish\b|\beel\b|\banago\b|\bdashi\b/.test(text)&&!/kombu dashi/.test(text)) assert(has('fish'),`${r.id}: possible missing fish`);
 if(/\bshrimp\b|\bsquid\b|\babalone\b/.test(text)) assert(has('shellfish'),`${r.id}: missing shellfish`);
 if(/sesame/.test(text)&&!/sesame-free/.test(text)) assert(has('sesame'),`${r.id}: missing sesame`);
 if(/mustard/.test(text)&&!/mustard leaves|mustard leaf|mustard spinach/.test(text)) assert(has('mustard'),`${r.id}: missing mustard`);
}
const counts={};for(const r of rows){const k=String(r.cuisine||'(none)');counts[k]=(counts[k]||0)+1}
const unchanged={Filipino:184,Korean:174,Chinese:90,Thai:90,Vietnamese:130,Indian:171,Italian:165,French:175,Spanish:215,Teyvat:372,'(none)':99};for(const [k,v] of Object.entries(unchanged))assert(counts[k]===v,`${k} count expected ${v} got ${counts[k]}`);
if(fail.length){console.error(`Japanese depth QA FAILED (${fail.length})`);for(const x of fail)console.error('-',x);process.exit(1)}
console.log('Japanese depth QA PASSED');console.log(JSON.stringify({total:rows.length,uniqueIds:new Set(ids).size,japanese:japanese.length,newRecipes:newRows.length,counts},null,2));