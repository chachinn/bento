(()=>{'use strict';
const uniq=a=>[...new Set((a||[]).filter(Boolean).map(x=>String(x).toLowerCase()))];
window.BENTO_SPANISH_ADD=rows=>{
  const lib=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:(window.BENTO_RECIPE_LIBRARY=[]);
  const seen=new Set(lib.map(r=>String(r.id||'')));
  for(const o of rows||[]){
    if(!o||seen.has(String(o.id||'')))continue;
    const r={
      cuisine:'Spanish',country:'Spain',countryCode:'ES',recipeType:'Reviewed classic',
      energy:'normal',cleanup:2,freezer:'no',collection:'Spanish Kitchen',favorite:false,builtIn:true,dietTags:[],
      libraryVersion:35,instructionVersion:35,instructionStyle:'comprehensive-variable-length',
      createdAt:'2026-08-22T18:00:00+08:00',updatedAt:'2026-08-22T18:00:00+08:00',verifiedAt:'2026-08-22',
      auditStatus:'Spanish v31 regional coverage + culinary QA · 2026-08-22',
      inactiveMinutes:Math.max(0,Number(o.total||0)-Number(o.prep||0)-Number(o.cook||0)),
      source:'Bento Spanish Kitchen · reviewed August 2026 against official Spain.info regional gastronomy and dish-specific recipe references, with protected-origin or public culinary sources where useful. Quantities and sequencing are practical Bento home-cooking formulations; regional and household versions vary.',
      ...o,
      allergens:uniq(o.allergens),
      sourceUrls:Array.from(new Set((o.sourceUrls||[]).filter(Boolean)))
    };
    lib.push(r);seen.add(String(r.id));
  }
};
})();
