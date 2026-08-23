import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const targets=['data/filipino-extra-185-192.js','data/filipino-extra-193-200.js','data/filipino-extra-201-208.js','data/filipino-extra-209-216.js','data/filipino-extra-217-224.js','data/filipino-extra-225-232.js','data/filipino-extra-233-240.js','data/filipino-extra-241-248.js'];
const sandbox={window:{BENTO_RECIPE_LIBRARY:[]}};vm.createContext(sandbox);
for(const f of targets){const s=fs.readFileSync(f,'utf8');new vm.Script(s,{filename:f});vm.runInContext(s,sandbox,{filename:f});}
const recipes=sandbox.window.BENTO_RECIPE_LIBRARY;
const ids=Array.from({length:64},(_,i)=>`ph_${String(185+i).padStart(3,'0')}`);
const categories=new Set(['Breakfast','Rice & Donburi','Noodles','Main Dishes','Soups & Hot Pots','Sushi & Seafood','Side Dishes','Fried & Street Food','Sweets & Desserts','Breads & Pastries','Drinks']);
const supported=new Set(['soy','gluten','egg','milk','fish','shellfish','nuts','sesame','coconut','mustard']);
const fail=[];const assert=(ok,msg)=>{if(!ok)fail.push(msg)};
assert(recipes.length===64,`expected 64 recipes, got ${recipes.length}`);
assert(JSON.stringify(recipes.map(r=>r.id))===JSON.stringify(ids),'IDs must be contiguous ph_185-ph_248');
assert(new Set(recipes.map(r=>r.id)).size===64,'duplicate IDs in Filipino depth modules');
const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
assert(new Set(recipes.map(r=>norm(r.title))).size===64,'duplicate normalized titles inside depth modules');
const evid={
 soy:/\b(soy sauce|tofu|soybean|soy milk|miso)\b/,
 gluten:/\b(all-purpose flour|wheat|breadcrumbs?|panko|egg noodles?|soy sauce|bread|spaghetti|pasta)\b/,
 egg:/\b(egg|eggs|egg yolks?|egg whites?)\b/,
 milk:/\b(whole milk|fresh milk|condensed milk|powdered milk|milk powder|heavy cream|cream|butter|margarine|ice cream|frozen yogurt)\b/,
 fish:/\b(fish|fish sauce|tilapia|tuna|mackerel|cod|bangus|milkfish|snapper|stingray|skate|dried fish)\b/,
 shellfish:/\b(shrimp|prawn|crab|clam|diwal|squid|snail|sea urchin|curacha|oyster|mussel|scallop|lobster)\b/,
 nuts:/\b(peanut|peanuts|peanut butter|cashew|almond|hazelnut|pistachio|walnut)\b/,
 sesame:/\b(sesame|tahini)\b/,
 coconut:/\b(coconut|gata)\b/,
 mustard:/\b(mustard)\b/
};
for(const r of recipes){
 assert(r.cuisine==='Filipino'&&r.country==='Philippines'&&r.countryCode==='PH',`${r.id}: identity metadata`);
 assert(r.recipeType==='Reviewed classic',`${r.id}: recipeType`);
 assert(categories.has(r.category),`${r.id}: invalid category ${r.category}`);
 assert(typeof r.region==='string'&&r.region.trim(),`${r.id}: missing region`);
 assert(Number.isInteger(r.servings)&&r.servings>0,`${r.id}: invalid servings`);
 assert(Number.isFinite(r.prep)&&Number.isFinite(r.cook)&&Number.isFinite(r.total),`${r.id}: invalid times`);
 assert(r.total>=r.prep+r.cook,`${r.id}: total below prep+cook`);
 assert(Number(r.inactiveMinutes)===r.total-r.prep-r.cook,`${r.id}: inactive time mismatch`);
 assert(typeof r.equipment==='string'&&r.equipment.length>=8,`${r.id}: missing equipment`);
 assert(Array.isArray(r.ingredients)&&r.ingredients.length>=3,`${r.id}: short ingredients`);
 assert(r.ingredients.every(x=>typeof x==='string'&&x.trim().length>=3),`${r.id}: invalid ingredient`);
 assert(Array.isArray(r.steps)&&r.steps.length>=5,`${r.id}: method too short`);
 assert(r.steps.every(x=>typeof x==='string'&&x.trim().length>=20),`${r.id}: weak method step`);
 assert(Array.isArray(r.photoQueries)&&r.photoQueries.length>=2&&r.photoQueries.every(Boolean),`${r.id}: photo queries`);
 assert(Array.isArray(r.sourceUrls)&&r.sourceUrls.length>=1&&r.sourceUrls.every(u=>/^https:\/\//.test(u)),`${r.id}: HTTPS sources`);
 assert(Array.isArray(r.allergens)&&r.allergens.every(a=>supported.has(a)),`${r.id}: unsupported allergen`);
 const text=r.ingredients.join(' ').toLowerCase();
 for(const [a,rx] of Object.entries(evid)) if(rx.test(text)) assert(r.allergens.includes(a),`${r.id}: missing stored ${a}`);
 for(const a of r.allergens){if(a==='shellfish'&&r.id==='ph_196')continue;assert(evid[a].test(text),`${r.id}: stored ${a} lacks ingredient evidence`)}
}
assert(recipes.find(r=>r.id==='ph_193')?.category==='Main Dishes','ph_193 Kapampangan Tamales must be a savory main dish');
assert(!recipes.find(r=>r.id==='ph_196')?.allergens.includes('shellfish'),'ph_196 Camaru must not store Shellfish solely for cross-reactivity');
for(const id of ids){let hits=0;const rx=new RegExp(`[\"']?id[\"']?\\s*:\\s*[\"']${id}[\"']`,'g');for(const f of fs.readdirSync('data').filter(x=>x.endsWith('.js')).map(x=>path.join('data',x))){hits+=(fs.readFileSync(f,'utf8').match(rx)||[]).length}assert(hits===1,`${id}: repository definition count ${hits}`)}
if(fail.length){console.error(`Filipino depth QA FAILED (${fail.length})`);for(const x of fail)console.error('-',x);process.exit(1)}
console.log(`Filipino depth QA PASSED · ${recipes.length} recipes · ph_185-ph_248`);
