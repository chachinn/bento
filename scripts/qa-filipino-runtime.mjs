import fs from 'node:fs';
import vm from 'node:vm';
import {TextDecoder,TextEncoder} from 'node:util';
const clean=s=>String(s).split('?')[0].replace(/^\.\//,'');
const index=fs.readFileSync('index.html','utf8');
const srcs=[...index.matchAll(/<script\s+src="([^"]+)"[^>]*><\/script>/g)].map(m=>clean(m[1]));
const additions=['data/filipino-extra-185-192.js','data/filipino-extra-193-200.js','data/filipino-extra-201-208.js','data/filipino-extra-209-216.js','data/filipino-extra-217-224.js','data/filipino-extra-225-232.js','data/filipino-extra-233-240.js','data/filipino-extra-241-248.js'];
const anchor=srcs.indexOf('data/filipino-extra-165-184.js');if(anchor<0)throw new Error('Filipino insertion anchor missing');
for(const f of additions.slice().reverse())if(!srcs.includes(f))srcs.splice(anchor+1,0,f);
const storage=new Map();const localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k),clear:()=>storage.clear()};
const stub=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){return false},contains(){return false}},addEventListener(){},removeEventListener(){},append(){},appendChild(){},setAttribute(){},removeAttribute(){},querySelector(){return null},querySelectorAll(){return []}});
const document={body:stub(),documentElement:stub(),head:stub(),createElement:stub,querySelector(){return null},querySelectorAll(){return []},getElementById(){return null},addEventListener(){},removeEventListener(){}};
const atob=s=>Buffer.from(String(s),'base64').toString('binary'),btoa=s=>Buffer.from(String(s),'binary').toString('base64');
const g={BENTO_RECIPE_LIBRARY:[],BENTO_RECIPE_PHOTO_INDEX:{},console,TextDecoder,TextEncoder,Buffer,atob,btoa,URL,URLSearchParams,Map,Set,WeakMap,WeakSet,Date,Math,JSON,Array,Object,String,Number,Boolean,RegExp,Intl,Promise,Error,TypeError,parseInt,parseFloat,isNaN,setTimeout,clearTimeout,setInterval,clearInterval,localStorage,document,navigator:{userAgent:'Bento QA',language:'en-US'},location:{href:'https://example.test/',origin:'https://example.test',pathname:'/'},performance:{now:()=>0},crypto:{randomUUID:()=>`qa-${Math.random()}`}};g.window=g;g.self=g;g.globalThis=g;
const c=vm.createContext(g);
for(const f of srcs.filter(x=>x.startsWith('data/')&&x.endsWith('.js'))){if(!fs.existsSync(f))throw new Error(`missing ${f}`);vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f,timeout:15000});}
const rows=Array.isArray(c.BENTO_RECIPE_LIBRARY)?c.BENTO_RECIPE_LIBRARY:[];const ids=rows.map(r=>String(r.id));
const counts={};for(const r of rows){const k=String(r.cuisine||'(none)');counts[k]=(counts[k]||0)+1}
const filipino=rows.filter(r=>r.cuisine==='Filipino');const nonstandard=filipino.filter(r=>!/^ph_\d{3}$/.test(String(r.id))).map(r=>({id:String(r.id),title:r.title||''}));
const duplicates=[...ids.reduce((m,id)=>(m.set(id,(m.get(id)||0)+1),m),new Map())].filter(([,n])=>n>1);
const expected={Japanese:252,Filipino:248,Korean:174,Chinese:90,Thai:90,Vietnamese:130,Indian:171,Italian:165,French:175,Spanish:215,Teyvat:372,'(none)':99};
console.log('FILIPINO_RUNTIME_DIAGNOSTIC='+JSON.stringify({total:rows.length,uniqueIds:new Set(ids).size,filipino:filipino.length,nonstandard,duplicates,counts}));
if(rows.length!==2181)throw new Error(`expected 2181 runtime rows, got ${rows.length}`);
if(new Set(ids).size!==2181)throw new Error('runtime IDs are not unique');
if(filipino.length!==248)throw new Error(`expected Filipino 248, got ${filipino.length}`);
for(const [k,v] of Object.entries(expected))if(counts[k]!==v)throw new Error(`${k} expected ${v}, got ${counts[k]}`);
if(!filipino.some(r=>r.id==='ph_185')||!filipino.some(r=>r.id==='ph_248'))throw new Error('Filipino depth endpoints missing');
