(()=>{'use strict';
const lib=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:[];
const paella=lib.find(r=>r?.id==='es_027');
if(paella){
  paella.allergens=[...new Set([...(paella.allergens||[]),'shellfish'])];
  paella.auditStatus='Spanish v31 regional coverage + culinary QA · stored allergen correction for optional snails';
}
})();
