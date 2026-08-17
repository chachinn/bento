const fs=require('fs');const vm=require('vm');const path=require('path');
const ctx={window:{BENTO_RECIPE_LIBRARY:[]},console};vm.createContext(ctx);
function run(p){vm.runInContext(fs.readFileSync(p,'utf8'),ctx,{filename:p});}
run('data/indian-runtime.js');
for(const f of fs.readdirSync('data').filter(x=>/^indian-recipes-\d+-\d+\.js$/.test(x)).sort())run(path.join('data',f));
const pre=ctx.window.BENTO_RECIPE_LIBRARY.filter(r=>r&&r.cuisine==='Indian');
run('data/recipe-quality-runtime.js');
const infer=ctx.window.BENTO_INFER_ALLERGENS;
const failures=[],warnings=[];const fail=(r,t,d='')=>failures.push({id:r?.id||'GLOBAL',title:r?.title||'',test:t,detail:d});const warn=(r,t,d='')=>warnings.push({id:r?.id||'GLOBAL',title:r?.title||'',test:t,detail:d});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const words=s=>new Set(norm(s).split(/\s+/).filter(w=>w.length>3&&!['with','until','then','into','from','over','heat','cook','cooked','add','serve','serving','water','salt','needed','using','mixture'].includes(w)));
const jac=(a,b)=>{const A=words(a),B=words(b);let i=0;for(const x of A)if(B.has(x))i++;return i/Math.max(1,new Set([...A,...B]).size)};
const ids=new Map(),titles=new Map(),methods=new Map();
if(pre.length!==171)fail(null,'recipe-count',String(pre.length));
for(let i=1;i<=171;i++){const id=`ind_${String(i).padStart(3,'0')}`;if(!pre.some(r=>r.id===id))fail(null,'missing-sequential-id',id)}
for(const r of pre){
  if(ids.has(r.id))fail(r,'duplicate-id',ids.get(r.id));else ids.set(r.id,r.title);
  const nt=norm(r.title);if(titles.has(nt))fail(r,'duplicate-title',titles.get(nt));else titles.set(nt,r.id);
  for(const k of ['id','title','region','category','servings','prep','cook','total','difficulty','equipment'])if(r[k]===undefined||r[k]===null||r[k]==='')fail(r,'missing-field',k);
  if(!Number.isFinite(Number(r.servings))||Number(r.servings)<=0)fail(r,'invalid-servings',String(r.servings));
  for(const k of ['prep','cook','total'])if(!Number.isFinite(Number(r[k]))||Number(r[k])<0)fail(r,'invalid-time',`${k}=${r[k]}`);
  if(Number(r.total)<Number(r.prep)+Number(r.cook))fail(r,'time-math',`prep ${r.prep}+cook ${r.cook}>total ${r.total}`);
  const expected=Math.max(0,Number(r.total)-Number(r.prep)-Number(r.cook));if(Number(r.inactiveMinutes)!==expected)fail(r,'inactive-time',`stored ${r.inactiveMinutes} expected ${expected}`);
  if(!Array.isArray(r.ingredients)||r.ingredients.length<2)fail(r,'ingredients-structure',String(r.ingredients?.length));
  if(!Array.isArray(r.steps)||r.steps.length<3)fail(r,'steps-structure',String(r.steps?.length));
  if(!Array.isArray(r.photoQueries)||r.photoQueries.length<2)fail(r,'photo-queries',String(r.photoQueries?.length));
  if(!Array.isArray(r.sourceUrls)||r.sourceUrls.length<2||r.sourceUrls.some(u=>!/^https:\/\//.test(u)))fail(r,'sources',JSON.stringify(r.sourceUrls));
  if(!String(r.equipment||'').trim())fail(r,'equipment-empty');
  const dupIng=new Map();for(const ing of r.ingredients||[]){const n=norm(ing);if(dupIng.has(n))fail(r,'duplicate-ingredient',ing);dupIng.set(n,1)}
  const method=(r.steps||[]).join(' ');const mh=norm(method);if(methods.has(mh))fail(r,'duplicate-method-exact',methods.get(mh));else methods.set(mh,r.id);
  const cue=/\b(golden|brown|browned|tender|soft|crisp|crispy|thick|thicken|glossy|opaque|translucent|74°c|165°f|temperature|set|separate|coats?|clings?|puffs?|bubbles?|collapsed|fork-tender|knife slides|raw taste|no raw|doneness|aroma|fragrant)\b/i;if(!cue.test(method))warn(r,'weak-doneness-cues');
  const stored=new Set((r.allergens||[]).map(x=>String(x).toLowerCase()));const inf=new Set((infer(r.ingredients)||[]).map(x=>String(x).toLowerCase()));
  for(const a of inf)if(!stored.has(a))fail(r,'missing-stored-allergen',a);
  for(const a of stored)if(!inf.has(a))warn(r,'stored-allergen-not-inferred',a);
  const methodN=norm(method);for(const ing of r.ingredients||[]){let x=norm(ing).replace(/^\d+(?:\.\d+)?\s*(g|kg|ml|l|tbsp|tsp|cup|cups|piece|pieces|large|small|medium)\s*/,'');const toks=x.split(' ').filter(w=>w.length>4&&!['fresh','ground','chopped','sliced','minced','needed','optional','neutral','water','fine','plus','more','serving'].includes(w));if(toks.length&& !toks.some(t=>methodN.includes(t))&&!/salt|water|oil|ghee|cilantro|coriander leaves|mint|lemon wedges?/.test(x))warn(r,'ingredient-not-mentioned',ing)}
  if(/\b(Breads?|Breakfast)\b/i.test(r.category||'')&&/\bonion\b/.test(norm((r.ingredients||[]).join(' ')))&&/\btomato/.test(norm((r.ingredients||[]).join(' ')))&&/curry leaves/.test(norm((r.ingredients||[]).join(' ')))&&/garam masala/.test(norm((r.ingredients||[]).join(' '))))warn(r,'possible-template-contamination','onion+tomato+curry leaves+garam masala bundle');
}
for(let i=0;i<pre.length;i++)for(let j=i+1;j<pre.length;j++){const a=(pre[i].steps||[]).join(' '),b=(pre[j].steps||[]).join(' ');if(a.length>180&&b.length>180){const s=jac(a,b);if(s>=0.88)warn(pre[i],'near-duplicate-method',`${pre[j].id} ${pre[j].title} similarity=${s.toFixed(2)}`)}}
const summary={recipeCount:pre.length,uniqueIds:ids.size,uniqueTitles:titles.size,failures:failures.length,warnings:warnings.length,stepRange:[Math.min(...pre.map(r=>r.steps?.length||0)),Math.max(...pre.map(r=>r.steps?.length||0))]};
console.log('INDIAN_QA_SUMMARY '+JSON.stringify(summary));
for(const x of failures)console.log('FAIL '+JSON.stringify(x));
for(const x of warnings)console.log('WARN '+JSON.stringify(x));
process.exitCode=failures.length?1:0;
