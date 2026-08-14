'use strict';
// Cross-check Bento Genshin dish identity against genshin-db plus a reviewed allowlist
// for official shop/event/alchemy/no-learnable-recipe items outside that endpoint.
const fs=require('fs'),vm=require('vm'),genshin=require('genshin-db');
const index=fs.readFileSync('index.html','utf8');
const srcs=[...index.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/g)].map(m=>m[1].split('?')[0]).filter(s=>s.startsWith('data/')&&s.endsWith('.js'));
const c={console,URL,URLSearchParams,TextDecoder,TextEncoder,atob,btoa,Math,Date,Set,Map,WeakSet,WeakMap,Array,Object,String,Number,Boolean,RegExp,JSON,parseInt,parseFloat,isNaN,encodeURIComponent,decodeURIComponent};c.window=c;c.globalThis=c;vm.createContext(c);for(const f of srcs)vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f,timeout:5000});
const rows=(c.BENTO_RECIPE_LIBRARY||[]).filter(r=>r.gameSeries==='Genshin Impact'||r.collection==='Genshin Impact'||r.gameDish);
const norm=s=>String(s||'').toLowerCase().replace(/[“”"'’‘]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const reviewedExceptions=new Set([
 'gi_mo_003','gi_mo_006','gi_mo_031','gi_mo_038','gi_ly_081','gi_in_006','gi_in_017','gi_in_023','gi_fo_001','gi_na_028','gi_nk_004','gi_nk_006','gi_nk_015','gi_nk_020',
 'gi_nk_021','gi_nk_022','gi_nk_023','gi_nk_024','gi_nk_025','gi_nk_026','gi_nk_027','gi_nk_028','gi_nk_029','gi_nk_030','gi_nk_031','gi_nk_032','gi_nk_033','gi_nk_034','gi_nk_035'
]);
const sourceById={},rawMissing=[],mismatched=[];
for(const r of rows){let food;try{food=genshin.foods(r.title,{matchCategories:false})}catch{};if(!food){rawMissing.push({id:r.id,title:r.title});continue}if(norm(food.name)!==norm(r.title)){mismatched.push({id:r.id,title:r.title,matched:food.name});continue}sourceById[r.id]={name:food.name,foodtype:food.foodtype,basedish:food.basedish||'',ingredients:(food.ingredients||[]).map(x=>({name:x.name,count:x.count})),url:food.url?.fandom||''};}
const verifiedExceptions=[],unexplainedMissing=[];
for(const x of rawMissing){const r=rows.find(y=>y.id===x.id);if(!reviewedExceptions.has(x.id)){unexplainedMissing.push(x);continue}const refs=(r?.sourceUrls||[]).filter(u=>/^https?:\/\//.test(String(u))),note=String(r?.notes||'');const ok=refs.length>=1&&/(no official|no learnable|no obtainable|shop|event|alchemy|formula|adaptation|recreation|variant|without a learnable|without a cooking)/i.test(note);if(ok)verifiedExceptions.push({...x,sourceUrls:refs,recipeType:r?.recipeType||''});else unexplainedMissing.push({...x,problem:'reviewed exception lacks explicit source/adaptation metadata'});}
const unexpectedExceptionRows=[...reviewedExceptions].filter(id=>!rawMissing.some(x=>x.id===id));
const practicalGroups=new Map();for(const r of rows){const key=JSON.stringify(r.ingredients||[]);if(!practicalGroups.has(key))practicalGroups.set(key,[]);practicalGroups.get(key).push(r)}
const collisions=[];for(const group of practicalGroups.values()){const nonSpecial=group.filter(r=>sourceById[r.id]?.foodtype!=='SPECIALTY');if(nonSpecial.length<2)continue;const sigs=new Map();for(const r of nonSpecial){const s=sourceById[r.id];if(!s)continue;const sig=JSON.stringify((s.ingredients||[]).map(x=>`${x.name}:${x.count}`).sort());if(!sigs.has(sig))sigs.set(sig,[]);sigs.get(sig).push(r)}if(sigs.size>1)collisions.push({recipes:nonSpecial.map(r=>({id:r.id,title:r.title,sourceIngredients:sourceById[r.id]?.ingredients||[],practicalIngredients:r.ingredients})),distinctGameIngredientSets:sigs.size});}
const specialtyProblems=[];for(const r of rows){const s=sourceById[r.id];if(!s||s.foodtype!=='SPECIALTY'||!s.basedish)continue;const base=rows.find(x=>norm(x.title)===norm(s.basedish));if(!base)specialtyProblems.push({id:r.id,title:r.title,basedish:s.basedish,problem:'base dish missing from Bento Genshin library'});}
const report={genshinDbVersion:genshin.version,recipeCount:rows.length,exactSourceMatches:Object.keys(sourceById).length,verifiedSourceExceptions:verifiedExceptions.length,unexplainedMissing,mismatched,specialtyProblems,practicalIngredientCollisions:collisions,unexpectedExceptionRows};
fs.mkdirSync('qa-out',{recursive:true});fs.writeFileSync('qa-out/genshin-identity-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({genshinDbVersion:report.genshinDbVersion,recipeCount:report.recipeCount,exactSourceMatches:report.exactSourceMatches,verifiedSourceExceptions:report.verifiedSourceExceptions,unexplainedMissing:unexplainedMissing.length,mismatched:mismatched.length,specialtyProblems:specialtyProblems.length,practicalIngredientCollisions:collisions.length,unexpectedExceptionRows:unexpectedExceptionRows.length},null,2));
for(const x of collisions){console.log('\nCOLLISION');for(const r of x.recipes)console.log(r.id,r.title,'GAME=',JSON.stringify(r.sourceIngredients),'BENTO=',JSON.stringify(r.practicalIngredients))}
if(rows.length!==372||Object.keys(sourceById).length+verifiedExceptions.length!==372||verifiedExceptions.length!==29||unexplainedMissing.length||mismatched.length||specialtyProblems.length||collisions.length||unexpectedExceptionRows.length)process.exitCode=1;
