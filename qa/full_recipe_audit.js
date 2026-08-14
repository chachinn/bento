'use strict';
const fs=require('fs'),vm=require('vm');
const index=fs.readFileSync('index.html','utf8');
const srcs=[...index.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/g)].map(m=>m[1].split('?')[0]).filter(s=>s.startsWith('data/')&&s.endsWith('.js'));
const context={console,URL,URLSearchParams,TextDecoder,TextEncoder,atob,btoa,Math,Date,Set,Map,WeakSet,WeakMap,Array,Object,String,Number,Boolean,RegExp,JSON,parseInt,parseFloat,isNaN,encodeURIComponent,decodeURIComponent};
context.window=context;context.globalThis=context;vm.createContext(context);
for(const file of srcs){if(!fs.existsSync(file))throw new Error(`Missing script: ${file}`);try{vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file,timeout:5000})}catch(e){console.error(`EXEC_FAIL ${file}:`,e);process.exit(2)}}
const lib=Array.isArray(context.BENTO_RECIPE_LIBRARY)?context.BENTO_RECIPE_LIBRARY:[];
const photoIndex=context.BENTO_RECIPE_PHOTO_INDEX||{};
const isAnime=r=>!!r.animeSeries;
const isGenshin=r=>r.gameSeries==='Genshin Impact'||r.collection==='Genshin Impact'||!!r.gameDish||Array.isArray(r.gameAppearances)&&r.gameAppearances.some(x=>x?.series==='Genshin Impact');
const isStandard=r=>!isAnime(r)&&!isGenshin(r);
const scopes={
  Japanese:lib.filter(r=>isStandard(r)&&r.cuisine==='Japanese'),
  Filipino:lib.filter(r=>isStandard(r)&&r.cuisine==='Filipino'),
  Korean:lib.filter(r=>isStandard(r)&&r.cuisine==='Korean'),
  Chinese:lib.filter(r=>isStandard(r)&&r.cuisine==='Chinese'),
  Thai:lib.filter(r=>isStandard(r)&&r.cuisine==='Thai'),
  Genshin:lib.filter(isGenshin),
  Anime:lib.filter(isAnime)
};
const allergenRules={
 soy:/\b(soy sauce|tamari|miso|tofu|soybean|edamame|soy milk|doubanjiang|gochujang|doenjang)\b/i,
 gluten:/\b(wheat flour|all-purpose flour|bread flour|cake flour|panko|breadcrumbs?|bread crumbs?|ramen|udon|soba|wheat noodles?|spaghetti|pasta|gyoza wrappers?|dumpling wrappers?|soy sauce|hoisin)\b/i,
 egg:/\b(egg|eggs|egg yolks?|egg whites?|mayonnaise|mayo|hollandaise)\b/i,
 milk:/\b(milk|cream|butter|cheese|parmesan|yogurt|yoghurt|condensed milk|evaporated milk)\b/i,
 fish:/\b(fish sauce|bonito|katsuobushi|dashi|anchovy|anchovies|salmon|tuna|mackerel|cod|sardine|sardines|fish cake|chikuwa|kamaboko)\b/i,
 shellfish:/\b(shrimp|prawn|crab|clam|mussel|oyster|scallop|squid|octopus|abalone|lobster)\b/i,
 nuts:/\b(peanut|cashew|walnut|almond|hazelnut|pistachio|pine nut|chestnut)\b/i,
 sesame:/\b(sesame|tahini)\b/i
};
const badGeneric=/prepare and measure all ingredients|combine the main components evenly|cook until hot, browned, and set as appropriate|serve hot with a simple dipping sauce|cook until done(?:\.|$)/i;
const doneness=/until|golden|tender|opaque|crisp|crispy|set\b|glossy|reduced|thicken|browned|bubbl|translucent|aromatic|fragrant|puffed|firm|soft|juicy|internal temperature|thermometer|coats? the back|clears? the sides/i;
const timed=/(\d+(?:\.\d+)?)\s*(?:–|-|to)?\s*(\d+(?:\.\d+)?)?\s*(minutes?|mins?|hours?|hrs?|seconds?|secs?)/i;
const complexTitle=/curry|stew|brais|roast|fried chicken|dumpling|gyoza|bao|bun|ramen|laksa|noodle|pancit|adobo|sinigang|kare[- ]?kare|lechon|sisig|paella|bread|cake|pastry|pie|tart|tempura|tonkatsu|yakitori|sushi|hot pot|nabe|pho|birria/i;
const report={generatedAt:new Date().toISOString(),totalRecipes:lib.length,scopeCounts:{},summary:{},issuesByScope:{}};
let critical=0,warnings=0;
const uniq=new Set();for(const r of lib){const id=String(r?.id||'');if(!id||uniq.has(id)){critical++;console.log('CRITICAL duplicate/missing id',id,r?.title)}uniq.add(id)}
for(const [scope,rows] of Object.entries(scopes)){
  report.scopeCounts[scope]=rows.length;
  const issues=[];let refMissing=0,allergenMissing=0,shallow=0,timeBad=0,equipmentMissing=0,detailsMissing=0,photoMetaMissing=0,cueMissing=0,timedMissing=0;
  for(const r of rows){const id=r.id||'(no id)',title=r.title||'(untitled)',ings=Array.isArray(r.ingredients)?r.ingredients.filter(Boolean):[],steps=Array.isArray(r.steps)?r.steps.filter(Boolean):[],text=ings.join(' '),declared=new Set((Array.isArray(r.allergens)?r.allergens:[]).map(x=>String(x).toLowerCase()));
    const add=(type,msg,severity='warn')=>{issues.push({id,title,type,msg,severity});if(severity==='critical')critical++;else warnings++};
    if(!title||title==='(untitled)')add('title','missing title','critical');
    if(!Number.isFinite(Number(r.servings))||Number(r.servings)<1)add('servings',`invalid recommended servings: ${r.servings}`,'critical');
    const prep=Number(r.prep),cook=Number(r.cook),total=Number(r.total);if(![prep,cook,total].every(Number.isFinite)||prep<0||cook<0||total<0||total+0.01<prep+cook){timeBad++;add('time',`prep/cook/total inconsistent: ${r.prep}/${r.cook}/${r.total}`,'critical')}
    if(!String(r.equipment||'').trim()){equipmentMissing++;add('equipment','missing equipment')}
    if(ings.length<2)add('ingredients',`only ${ings.length} ingredients`,'critical');
    if(steps.length<3)add('steps',`only ${steps.length} steps`,'critical');
    if(steps.some(s=>badGeneric.test(String(s))))add('steps','generic placeholder-like method wording','critical');
    const complex=(cook>=20||total>=45||ings.length>=9||complexTitle.test(title));if(complex&&steps.length<=6){shallow++;add('method-depth',`complex recipe has only ${steps.length} steps`)}
    if(cook>=10&&!steps.some(s=>timed.test(String(s)))){timedMissing++;add('timing','cook time >=10 min but no explicit timed method step')}
    if(cook>=5&&!steps.some(s=>doneness.test(String(s)))){cueMissing++;add('doneness','no clear doneness/texture cue')}
    for(const [a,rx] of Object.entries(allergenRules))if(rx.test(text)&&!declared.has(a)){allergenMissing++;add('allergen',`ingredients imply ${a}, but allergen is not declared`,'critical')}
    if(!String(r.notes||'').trim()){detailsMissing++;add('details','missing recipe note/details')}
    const refs=[...(Array.isArray(r.sourceUrls)?r.sourceUrls:[])];if(Array.isArray(r.gameAppearances))for(const g of r.gameAppearances)if(Array.isArray(g?.sourceUrls))refs.push(...g.sourceUrls);if(!String(r.source||'').trim()||refs.filter(Boolean).length<1){refMissing++;add('references',`source=${!!String(r.source||'').trim()} urls=${refs.filter(Boolean).length}`,'critical')}
    const pi=photoIndex[id];if(isStandard(r)&&!(pi||Array.isArray(r.photoQueries)&&r.photoQueries.length)){photoMetaMissing++;add('photo','no recipe-specific photo metadata/query')}
    if(isAnime(r)&&!r.animeSeries){photoMetaMissing++;add('photo','anime recipe missing animeSeries','critical')}
    if(isGenshin(r)&&!(r.gameSeries||r.gameDish||r.gameAppearances||r.collection==='Genshin Impact')){photoMetaMissing++;add('photo','Genshin recipe missing source-world appearance metadata','critical')}
  }
  report.issuesByScope[scope]=issues;
  report.summary[scope]={recipes:rows.length,issues:issues.length,refMissing,allergenMissing,shallow,timeBad,equipmentMissing,detailsMissing,photoMetaMissing,cueMissing,timedMissing,stepMin:rows.length?Math.min(...rows.map(r=>(r.steps||[]).length)):0,stepMax:rows.length?Math.max(...rows.map(r=>(r.steps||[]).length)):0};
}
fs.mkdirSync('qa-out',{recursive:true});fs.writeFileSync('qa-out/full-recipe-audit.json',JSON.stringify(report,null,2));
console.log('BENTO FULL RECIPE AUDIT');console.log(JSON.stringify({totalRecipes:report.totalRecipes,scopeCounts:report.scopeCounts,summary:report.summary,critical,warnings},null,2));
for(const [scope,issues] of Object.entries(report.issuesByScope)){console.log(`\n## ${scope} top issues (${issues.length})`);for(const x of issues.slice(0,80))console.log(`${x.severity.toUpperCase()} ${x.id} | ${x.title} | ${x.type} | ${x.msg}`)}
if(critical>0)process.exitCode=1;
