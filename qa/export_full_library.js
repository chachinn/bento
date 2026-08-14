'use strict';
const fs=require('fs'),vm=require('vm');
const index=fs.readFileSync('index.html','utf8');
const srcs=[...index.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/g)].map(m=>m[1].split('?')[0]).filter(s=>s.startsWith('data/')&&s.endsWith('.js'));
const c={console,URL,URLSearchParams,TextDecoder,TextEncoder,atob,btoa,Math,Date,Set,Map,WeakSet,WeakMap,Array,Object,String,Number,Boolean,RegExp,JSON,parseInt,parseFloat,isNaN,encodeURIComponent,decodeURIComponent};c.window=c;c.globalThis=c;vm.createContext(c);
for(const f of srcs)vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f,timeout:5000});
fs.mkdirSync('qa-out',{recursive:true});fs.writeFileSync('qa-out/full-library.json',JSON.stringify(c.BENTO_RECIPE_LIBRARY||[],null,2));
console.log('exported',c.BENTO_RECIPE_LIBRARY?.length||0,'recipes');
