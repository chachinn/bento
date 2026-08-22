import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const targets=['data/japanese-extra-190-194.js','data/japanese-extra-195-198.js'];
const sandbox={window:{BENTO_RECIPE_LIBRARY:[]}};
vm.createContext(sandbox);
for(const target of targets){
  const source=fs.readFileSync(target,'utf8');
  new vm.Script(source,{filename:target});
  vm.runInContext(source,sandbox,{filename:target});
}
const recipes=sandbox.window.BENTO_RECIPE_LIBRARY;
const expected=['jp_190','jp_191','jp_192','jp_193','jp_194','jp_195','jp_196','jp_197','jp_198'];
const categories=new Set(['Soups & Hot Pots','Noodles','Breads & Pastries','Main Dishes','Rice & Donburi']);
const allergens=new Set(['soy','gluten','egg','milk','fish','shellfish','nuts','sesame','coconut','mustard']);
const fail=[];
const assert=(ok,msg)=>{if(!ok)fail.push(msg)};

assert(recipes.length===expected.length,`expected ${expected.length} recipes, got ${recipes.length}`);
assert(JSON.stringify(recipes.map(r=>r.id))===JSON.stringify(expected),`unexpected IDs/order: ${recipes.map(r=>r.id).join(', ')}`);
assert(new Set(recipes.map(r=>r.id)).size===recipes.length,'duplicate IDs inside checkpoint modules');

for(const r of recipes){
  assert(r.cuisine==='Japanese',`${r.id}: cuisine must be Japanese`);
  assert(r.country==='Japan'&&r.countryCode==='JP',`${r.id}: country metadata mismatch`);
  assert(r.recipeType==='Reviewed classic',`${r.id}: recipeType mismatch`);
  assert(categories.has(r.category),`${r.id}: unexpected category ${r.category}`);
  assert(typeof r.region==='string'&&r.region.trim(),`${r.id}: missing region`);
  assert(Number.isFinite(r.prep)&&Number.isFinite(r.cook)&&Number.isFinite(r.total),`${r.id}: invalid time fields`);
  assert(r.total>=r.prep+r.cook,`${r.id}: total is below prep + cook`);
  assert(Number.isInteger(r.servings)&&r.servings>0,`${r.id}: invalid servings`);
  assert(Array.isArray(r.ingredients)&&r.ingredients.length>=7,`${r.id}: too few ingredients`);
  assert(Array.isArray(r.steps)&&r.steps.length>=7,`${r.id}: too few method steps`);
  assert(r.steps.every(s=>typeof s==='string'&&s.trim().length>=20),`${r.id}: weak/empty method step`);
  assert(Array.isArray(r.photoQueries)&&r.photoQueries.length>=2&&r.photoQueries.every(Boolean),`${r.id}: missing photo queries`);
  assert(Array.isArray(r.sourceUrls)&&r.sourceUrls.length>=3&&r.sourceUrls.every(u=>/^https:\/\//.test(u)),`${r.id}: source URLs must be HTTPS`);
  assert(r.sourceUrls[0].includes('maff.go.jp/'),`${r.id}: first source must be dish-specific MAFF evidence`);
  assert(Array.isArray(r.allergens)&&r.allergens.every(a=>allergens.has(a)),`${r.id}: unsupported allergen`);

  const hay=r.ingredients.join(' ').toLowerCase();
  const has=a=>r.allergens.includes(a);
  if(/all-purpose flour|wheat|cha-soba|soy sauce/.test(hay)) assert(has('gluten'),`${r.id}: expected gluten from ingredient text`);
  if(/soy sauce|miso/.test(hay)) assert(has('soy'),`${r.id}: expected soy from ingredient text`);
  if(/\beggs?\b|omelet/.test(hay)) assert(has('egg'),`${r.id}: expected egg from ingredient text`);
  if(/niboshi|dashi|salmon|sea bream|kamaboko/.test(hay)) assert(has('fish'),`${r.id}: expected fish from ingredient text`);
  if(/scallop|shrimp|prawn|crab|lobster/.test(hay)) assert(has('shellfish'),`${r.id}: expected shellfish from ingredient text`);
  if(/sesame/.test(hay)) assert(has('sesame'),`${r.id}: expected sesame from ingredient text`);
  if(/mustard/.test(hay)) assert(has('mustard'),`${r.id}: expected mustard from ingredient text`);
}

const allJs=[];
for(const entry of fs.readdirSync('data')){
  if(entry.endsWith('.js')) allJs.push(path.join('data',entry));
}
for(const id of expected){
  let hits=0;
  const needle=new RegExp(`id:['\"]${id}['\"]`,'g');
  for(const file of allJs){
    const text=fs.readFileSync(file,'utf8');
    hits+=(text.match(needle)||[]).length;
  }
  assert(hits===1,`${id}: expected exactly one repository definition, found ${hits}`);
}

const titleSet=new Set();
for(const r of recipes){
  const key=r.title.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  assert(!titleSet.has(key),`${r.id}: duplicate normalized title ${r.title}`);
  titleSet.add(key);
}

if(fail.length){
  console.error('Japanese gap checkpoint QA FAILED');
  for(const message of fail) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`Japanese gap checkpoint QA PASS · ${recipes.length} recipes · ${recipes[0].id}-${recipes.at(-1).id}`);
