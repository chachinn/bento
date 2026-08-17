(()=>{'use strict';
const NATIONAL='https://www.prod.incredibleindia.gov.in/content/incredible-india-v2/en/experiences/food-and-cuisine.html';
const GLUTEN_RX=/\b(wheat|whole wheat|whole-wheat|atta|all-purpose flour|bread flour|cake flour|tempura flour|semolina|sooji|rava|maida|panko|breadcrumbs?|bread crumbs?|ramen|udon|soba|wheat noodles?|egg noodles?|noodles|spaghetti|pasta|gyoza wrappers?|dumpling wrappers?|wonton wrappers?|momo wrappers?|spring roll wrappers?|soy sauce|hoisin sauce|bread|pav|naan|kulcha|bhature?|parotta)\b/;
function normalizeStoredAllergens(o){
  const raw=(' '+(Array.isArray(o?.ingredients)?o.ingredients:[]).join(' ')+' ').toLowerCase();
  const allergens=Array.from(new Set((Array.isArray(o?.allergens)?o.allergens:[]).filter(Boolean).map(x=>String(x).toLowerCase())));
  return allergens.filter(a=>a!=='gluten'||GLUTEN_RX.test(raw));
}
window.BENTO_INDIAN_ADD=rows=>{
  const lib=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:(window.BENTO_RECIPE_LIBRARY=[]);
  const seen=new Set(lib.map(r=>String(r.id||'')));
  for(const o of rows||[]){
    if(!o||seen.has(String(o.id||'')))continue;
    const refs=Array.from(new Set([...(Array.isArray(o.sourceUrls)?o.sourceUrls:[]),NATIONAL].filter(Boolean))).slice(0,4);
    const r={
      cuisine:'Indian',country:'India',countryCode:'IN',recipeType:'Reviewed regional classic',
      energy:'normal',cleanup:2,freezer:'no',collection:'Indian Kitchen',favorite:false,builtIn:true,dietTags:[],
      libraryVersion:32,instructionVersion:32,instructionStyle:'comprehensive-variable-length',
      createdAt:'2026-08-14T17:28:00+08:00',updatedAt:'2026-08-17T22:20:00+08:00',verifiedAt:'2026-08-17',
      auditStatus:'Indian v28 integrity hardening · 2026-08-17',
      inactiveMinutes:Math.max(0,Number(o.total||0)-Number(o.prep||0)-Number(o.cook||0)),
      source:'Bento Indian Kitchen · reviewed August 2026 against official Incredible India / India Tourism regional food guides. Quantities and sequencing are practical Bento home-cooking adaptations; regional, religious, community and household versions vary.',
      ...o,allergens:normalizeStoredAllergens(o),sourceUrls:refs
    };
    lib.push(r);seen.add(String(r.id));
  }
};
})();
