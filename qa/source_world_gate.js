'use strict';
const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
const required=['data/recipe-content-fixes-genshin-identity.js','data/recipe-content-fixes-genshin-unindexed.js','data/recipe-content-fixes-genshin.js','data/recipe-content-fixes-anime.js','data/recipe-quality-runtime.js'];
for(const f of required){if(!html.includes(f))throw new Error(`Index missing ${f}`);if(!sw.includes(f))throw new Error(`Service worker missing ${f}`)}
const srcs=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]).filter(x=>x.startsWith('data/')&&x.endsWith('.js'));
const c={console,URL,URLSearchParams,TextDecoder,TextEncoder,atob,btoa,Math,Date,Set,Map,WeakSet,WeakMap,Array,Object,String,Number,Boolean,RegExp,JSON,parseInt,parseFloat,isNaN,encodeURIComponent,decodeURIComponent};c.window=c;c.globalThis=c;vm.createContext(c);for(const f of srcs)vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f,timeout:5000});
if(c.BENTO_RECIPE_QUALITY_VERSION!==27)throw new Error(`Quality runtime expected 27, got ${c.BENTO_RECIPE_QUALITY_VERSION}`);
if(c.BENTO_GENSHIN_IDENTITY_FIX_VERSION!==28)throw new Error(`Genshin identity fix expected 28, got ${c.BENTO_GENSHIN_IDENTITY_FIX_VERSION}`);
if(c.BENTO_GENSHIN_UNINDEXED_QA_VERSION!==28)throw new Error(`Genshin source-exception QA expected 28, got ${c.BENTO_GENSHIN_UNINDEXED_QA_VERSION}`);
const app=fs.readFileSync('app.js','utf8');if(!/if\(plan\.special==='genshin'\)return await genshinArtworkSearch\(plan\);if\(plan\.special==='anime'\)return await animeArtworkSearch\(plan\)/.test(app))throw new Error('Genshin/Anime source-world-only image routing missing');
console.log('SOURCE WORLD RELEASE GATE PASS',JSON.stringify({quality:27,genshinIdentity:28,genshinExceptions:28,assetVersion:'24p2'}));
