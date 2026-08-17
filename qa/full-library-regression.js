const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('index.html','utf8'),sw=fs.readFileSync('service-worker.js','utf8');
const scriptSrcs=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
const failures=[],warnings=[];const fail=(t,d='')=>failures.push({test:t,detail:d});const warn=(t,d='')=>warnings.push({test:t,detail:d});
const dup=a=>a.filter((x,i)=>a.indexOf(x)!==i);
if(dup(scriptSrcs).length)fail('duplicate-script-ref',JSON.stringify([...new Set(dup(scriptSrcs))]));
for(const src of scriptSrcs){const p=src.split('?')[0];if(!fs.existsSync(p))fail('missing-script-file',p)}
const core=[...sw.matchAll(/'\.\/([^']+)'/g)].map(m=>m[1]);for(const a of core){const p=a.split('?')[0];if(!fs.existsSync(p))fail('missing-sw-core-file',p)}
const asset=(sw.match(/const ASSET_VERSION='([^']+)'/)||[])[1];if(!asset)fail('missing-asset-version');
for(const src of scriptSrcs.filter(s=>s.includes('?v='))){const v=new URL('https://x/'+src).searchParams.get('v');if(v!==asset)fail('asset-version-mismatch',`${src} vs ${asset}`)}
const ctx={window:{BENTO_RECIPE_LIBRARY:[]},console:{log(){},warn(){},error(){}}};vm.createContext(ctx);
for(const src of scriptSrcs){const p=src.split('?')[0];if(p==='app.js')continue;try{vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});}catch(e){fail('data-runtime-load',`${p}: ${e.message}`)}}
const lib=ctx.window.BENTO_RECIPE_LIBRARY||[],ids=new Map(),titlesByCuisine=new Map();
if(lib.length!==1499)fail('library-count',String(lib.length));
for(const r of lib){if(!r||!r.id){fail('missing-id',r?.title||'unknown');continue}if(ids.has(r.id))fail('duplicate-id',`${r.id}: ${ids.get(r.id)} / ${r.title}`);else ids.set(r.id,r.title);
 const c=String(r.cuisine||'');const k=c+'|'+String(r.title||'').toLowerCase().trim();if(titlesByCuisine.has(k))fail('duplicate-title-within-cuisine',`${c}: ${r.title}`);else titlesByCuisine.set(k,r.id);
 if(!Array.isArray(r.ingredients)||!Array.isArray(r.steps)||r.steps.length<2)fail('recipe-structure',r.id);
 if(!Number.isFinite(Number(r.servings))||Number(r.servings)<=0)fail('servings',r.id);
 if(!Array.isArray(r.allergens))fail('allergens-shape',r.id);
 if(!r.gameDish&&!r.gameSeries&&!r.animeDish&&!r.animeSeries){if(!Array.isArray(r.photoQueries)||r.photoQueries.length<2)fail('standard-photo-query',r.id);if(!Array.isArray(r.sourceUrls)||r.sourceUrls.length<1)fail('standard-source',r.id)}
}
const standard=lib.filter(r=>!r.gameDish&&!r.gameSeries&&!r.animeDish&&!r.animeSeries);const counts={};for(const r of standard)counts[r.cuisine]=(counts[r.cuisine]||0)+1;
const expected={Japanese:189,Filipino:184,Korean:174,Chinese:90,Thai:90,Vietnamese:130,Indian:171};for(const [c,n] of Object.entries(expected))if(counts[c]!==n)fail('cuisine-count',`${c} ${counts[c]} expected ${n}`);if(standard.length!==1028)fail('standard-count',String(standard.length));
if(!(counts.Japanese>counts.Filipino&&counts.Filipino>Math.max(...Object.entries(counts).filter(([c])=>!['Japanese','Filipino'].includes(c)).map(([,n])=>n))))fail('cuisine-hierarchy',JSON.stringify(counts));
const infer=ctx.window.BENTO_INFER_ALLERGENS;if(typeof infer!=='function')fail('allergen-runtime-missing');else for(const r of standard){const inf=infer(r.ingredients)||[],stored=new Set((r.allergens||[]).map(x=>String(x).toLowerCase()));for(const a of inf)if(!stored.has(a))fail('post-runtime-allergen-missing',`${r.id}:${a}`)}
const gameAnime=lib.filter(r=>r.gameDish||r.gameSeries||r.animeDish||r.animeSeries);for(const r of gameAnime){const q=(r.photoQueries||[]).join(' ').toLowerCase();if(/wikimedia commons runtime search|generic cuisine/.test(q))fail('source-world-image-leak',r.id)}
const manifest=JSON.parse(fs.readFileSync('data/library_manifest.json','utf8'));if(manifest.recipeCount!==lib.length)fail('manifest-recipe-count',`${manifest.recipeCount}/${lib.length}`);if(manifest.standardRecipeCount!==standard.length)fail('manifest-standard-count',`${manifest.standardRecipeCount}/${standard.length}`);
console.log('FULL_QA_SUMMARY '+JSON.stringify({recipeCount:lib.length,uniqueIds:ids.size,standardCount:standard.length,counts,assetVersion:asset,scriptRefs:scriptSrcs.length,swCoreRefs:core.length,failures:failures.length,warnings:warnings.length}));for(const x of failures)console.log('FAIL '+JSON.stringify(x));for(const x of warnings)console.log('WARN '+JSON.stringify(x));process.exitCode=failures.length?1:0;
