(()=>{'use strict';
const lib=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:[];
const photos=window.BENTO_RECIPE_PHOTO_INDEX||(window.BENTO_RECIPE_PHOTO_INDEX={});
const uniq=a=>[...new Set((a||[]).filter(Boolean).map(x=>String(x).toLowerCase()))];
const has=(t,rx)=>rx.test(t);
function inferAllergens(ingredients){
  const raw=(' '+(ingredients||[]).join(' ')+' ').toLowerCase();
  const out=[];
  if(has(raw,/\b(soy sauce|tamari|miso|tofu|soybean|soybeans|edamame|soy milk|doubanjiang|gochujang|doenjang|axone|akhuni|fermented soybeans?|fermented bean paste)\b/))out.push('soy');
  if(has(raw,/\b(wheat|whole wheat|whole-wheat|atta|all-purpose flour|bread flour|cake flour|tempura flour|pâte brisée|semolina|sooji|rava|maida|panko|breadcrumbs?|bread crumbs?|puff pastry|filo pastry|phyllo pastry|pastry sheets?|ramen|udon|soba|wheat noodles?|egg noodles?|noodles|spaghetti|pasta|cannelloni|gyoza wrappers?|dumpling wrappers?|wonton wrappers?|momo wrappers?|spring roll wrappers?|soy sauce|hoisin sauce|bread|baguette|hot dog buns?|hamburger buns?|oyster crackers?|pav|naan|kulcha|bhature?|parotta)\b/))out.push('gluten');
  if(has(raw,/\b(egg|eggs|egg yolks?|egg whites?|mayonnaise|mayo|hollandaise)\b/))out.push('egg');
  const dairy=raw
    .replace(/\bmilk[- ]fed\b/g,' young-fed ')
    .replace(/\b(coconut|soy|almond|oat|rice|cashew|macadamia) milk\b/g,' plantmilk ')
    .replace(/\b(peanut|almond|cashew|walnut|hazelnut|pistachio|macadamia|sunflower seed) butter\b/g,' nutbutter ');
  if(has(dairy,/\b(whole milk|fresh milk|evaporated milk|condensed milk|buttermilk|cream|heavy cream|whipping cream|crème fraîche|butter|ghee|cheese|parmesan|mozzarella|cheddar|beaufort|comté|emmental|gruyère|reblochon|fromage blanc|tomme|cantal|paneer|chhena|chhenna|chenna|chhurpi|khoya|khoa|mawa|rabri|curd|dahi|yogurt|yoghurt|milk powder|powdered milk|ice cream)\b/)||/(^|[^a-z])milk([^a-z]|$)/.test(dairy))out.push('milk');
  if(has(raw,/\b(fish|fish sauce|bonito|katsuobushi|dashi|anchov(?:y|ies)|salmon|tuna|mackerel|cod|sardines?|fish cake|chikuwa|kamaboko|tilapia|catfish|bangus|milkfish|sea bass|sea bream|bream|monkfish|hake|dogfish|swordfish|marlin|rockfish|whitebait|whiting|eel|perch|trout|snapper|sole|zander|lamprey|shirasu|hilsa|ilish|rohu|carp|fermented fish|fermented dried fish)\b/))out.push('fish');
  const shell=raw.replace(/\b(vegetarian|vegan|mushroom) oyster sauce\b/g,' oyster-style-sauce ');
  if(has(shell,/\b(shrimp|prawns?|crawfish|crabs?|clams?|mussels?|oyster(?:s| sauce)?|scallops?|squid|octopus|abalone|lobster|langoustines?|cuttlefish|limpets?|snails?|cockles?|razor clams?)\b/))out.push('shellfish');
  if(has(raw,/\b(peanuts?|peanut butter|cashews?|walnuts?|almonds?|hazelnuts?|pistachios?|pine nuts?|chestnuts?|pecans?|macadamia)\b/))out.push('nuts');
  if(has(raw,/\b(sesame|tahini)\b/))out.push('sesame');
  if(has(raw,/\b(coconut|coconut milk|coconut cream|coconut water|coconut oil|grated coconut)\b/))out.push('coconut');
  if(has(raw,/\b(mustard|mustard seeds?|mustard oil|mustard paste|kasundi)\b/))out.push('mustard');
  return uniq(out);
}
for(const r of lib){
  const inferred=inferAllergens(r.ingredients);
  r.allergens=uniq([...(Array.isArray(r.allergens)?r.allergens:[]),...inferred]);
  const prep=Number(r.prep),cook=Number(r.cook),total=Number(r.total);
  if(!Number.isFinite(total)&&Number.isFinite(prep)&&Number.isFinite(cook))r.total=prep+cook;
  if(!Number.isFinite(Number(r.inactiveMinutes)))r.inactiveMinutes=Math.max(0,Number(r.total||0)-Number(r.prep||0)-Number(r.cook||0));
  if(!photos[r.id]&&!(Array.isArray(r.photoQueries)&&r.photoQueries.length)&&r.id&&r.title){
    r.photoQueries=[`${r.title} ${r.cuisine||''} food`.trim(),`${r.title} dish`];
    photos[r.id]={queries:r.photoQueries,square:true,source:'Wikimedia Commons runtime search'};
  }
  r.recipeQualityVersion=37;
}
window.BENTO_RECIPE_QUALITY_VERSION=37;
window.BENTO_INFER_ALLERGENS=inferAllergens;
})();