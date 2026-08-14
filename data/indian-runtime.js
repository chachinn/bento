(()=>{'use strict';
const NATIONAL='https://www.prod.incredibleindia.gov.in/content/incredible-india-v2/en/experiences/food-and-cuisine.html';
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
      createdAt:'2026-08-14T17:28:00+08:00',updatedAt:'2026-08-14T17:28:00+08:00',verifiedAt:'2026-08-14',
      auditStatus:'Indian v28 QA · 2026',
      inactiveMinutes:Math.max(0,Number(o.total||0)-Number(o.prep||0)-Number(o.cook||0)),
      source:'Bento Indian Kitchen · reviewed August 2026 against official Incredible India / India Tourism regional food guides. Quantities and sequencing are practical Bento home-cooking adaptations; regional, religious, community and household versions vary.',
      ...o,sourceUrls:refs
    };
    lib.push(r);seen.add(String(r.id));
  }
};
})();
