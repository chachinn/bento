(()=>{'use strict';
const uniq=a=>[...new Set((a||[]).filter(Boolean).map(x=>String(x).toLowerCase()))];
window.BENTO_AMERICAN_ADD=rows=>{
  const lib=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:(window.BENTO_RECIPE_LIBRARY=[]);
  const seen=new Set(lib.map(r=>String(r.id||'')));
  for(const o of rows||[]){
    if(!o||seen.has(String(o.id||'')))continue;
    const r={
      cuisine:'American',country:'United States',countryCode:'US',recipeType:'Reviewed classic',
      energy:'normal',cleanup:2,freezer:'no',collection:'American Kitchen',favorite:false,builtIn:true,dietTags:[],
      libraryVersion:36,instructionVersion:36,instructionStyle:'comprehensive-variable-length',
      createdAt:'2026-08-22T19:00:00+08:00',updatedAt:'2026-08-22T19:00:00+08:00',verifiedAt:'2026-08-22',
      auditStatus:'American v32 coverage-first regional build · 2026-08-22',
      inactiveMinutes:Math.max(0,Number(o.total||0)-Number(o.prep||0)-Number(o.cook||0)),
      source:'Bento American Kitchen · coverage-first U.S. regional foodways review using official state/regional tourism, National Park Service, Smithsonian/NMAAHC/NMAI and other authoritative cultural or culinary references. Community, household and restaurant versions vary; Indigenous and diaspora-derived dishes retain specific attribution where supported.',
      ...o,
      allergens:uniq(o.allergens),
      sourceUrls:Array.from(new Set((o.sourceUrls||[]).filter(Boolean)))
    };
    lib.push(r);seen.add(String(r.id));
  }
};
})();
