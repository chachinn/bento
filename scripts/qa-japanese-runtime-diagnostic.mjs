import fs from 'node:fs';
import vm from 'node:vm';
import {TextDecoder,TextEncoder} from 'node:util';

const index=fs.readFileSync('index.html','utf8');
const clean=s=>String(s).split('?')[0].replace(/^\.\//,'');
const srcs=[...index.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>clean(m[1]));
const additions=['data/japanese-extra-190-194.js','data/japanese-extra-195-198.js','data/japanese-extra-199-207.js'];
const qualityIndex=srcs.indexOf('data/recipe-quality-runtime.js');
if(qualityIndex<0) throw new Error('recipe-quality-runtime insertion point missing');
srcs.splice(qualityIndex,0,...additions);

const storage=new Map();
const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()};
const stubEl=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){return false},contains(){return false}},addEventListener(){},removeEventListener(){},append(){},appendChild(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return []}});
const document={body:stubEl(),documentElement:stubEl(),head:stubEl(),createElement:stubEl,querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},addEventListener(){},removeEventListener(){}};
const atob=s=>Buffer.from(String(s),'base64').toString('binary');
const btoa=s=>Buffer.from(String(s),'binary').toString('base64');
const g={BENTO_RECIPE_LIBRARY:[],BENTO_RECIPE_PHOTO_INDEX:{},console,TextDecoder,TextEncoder,Buffer,atob,btoa,URL,URLSearchParams,Map,Set,WeakMap,WeakSet,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,Intl,Promise,Error,TypeError,parseInt,parseFloat,isNaN,setTimeout,clearTimeout,setInterval,clearInterval,localStorage,document,navigator:{userAgent:'Bento QA',language:'en-US'},location:{href:'https://example.test/',origin:'https://example.test',pathname:'/'},performance:{now:()=>0},crypto:{randomUUID:()=>`qa-${Math.random()}`}};g.window=g;g.self=g;g.globalThis=g;
const c=vm.createContext(g);
for(const src of srcs.filter(f=>f.startsWith('data/')&&f.endsWith('.js'))){
  if(!fs.existsSync(src)) throw new Error(`missing data script ${src}`);
  vm.runInContext(fs.readFileSync(src,'utf8'),c,{filename:src,timeout:15000});
}
const rows=Array.isArray(c.BENTO_RECIPE_LIBRARY)?c.BENTO_RECIPE_LIBRARY:[];
const counts={};
for(const r of rows){const key=String(r.cuisine||'(none)');counts[key]=(counts[key]||0)+1;}
const japanese=rows.filter(r=>r.cuisine==='Japanese');
const duplicateIds=[...rows.reduce((m,r)=>(m.set(String(r.id),(m.get(String(r.id))||0)+1),m),new Map())].filter(([,n])=>n>1);
console.log('JAPANESE_RUNTIME_DIAGNOSTIC='+JSON.stringify({total:rows.length,uniqueIds:new Set(rows.map(r=>String(r.id))).size,japanese:japanese.length,japaneseFirst:japanese[0]?.id,japaneseLast:japanese.at(-1)?.id,duplicateIds,counts}));
if(japanese.length!==206) throw new Error(`expected Japanese runtime count 206, got ${japanese.length}`);
if(duplicateIds.length) throw new Error(`duplicate runtime IDs: ${duplicateIds.map(([id,n])=>`${id}x${n}`).join(', ')}`);
