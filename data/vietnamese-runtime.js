(()=>{'use strict';
const FOOD='https://www.vietnam.travel/things-to-do/food';
const REGION='https://vietnam.travel/things-to-do/vietnam-foodie-guide-region';
const MUST='https://www.vietnam.travel/things-to-do/21-must-try-vietnamese-dishes/';
const HANOI='https://www.vietnam.travel/things-to-do/10-must-try-hanoi-dishes/';
const HUE='https://vietnam.travel/things-to-do/how-eat-local-hue';
const HUE2='https://vietnam.travel/things-to-do/hue-best-to-eat-palace-street';
const HOIAN='https://vietnam.travel/things-to-do/explore-food-hoi-an';
const HOIAN2='https://vietnam.travel/things-to-do/4-must-try-dishes-in-hoi-an';
const RECIPES='https://vietnam.travel/things-to-do/recipes-from-vietnam';
const contextFor=r=>{const x=String(r.region||'').toLowerCase();if(x.includes('hanoi')||x.includes('northern'))return HANOI;if(x.includes('huế')||x.includes('hue'))return HUE;if(x.includes('hoi an')||x.includes('quảng nam')||x.includes('quang nam'))return HOIAN;if(x.includes('central'))return HUE2;return REGION};
window.BENTO_VIETNAMESE_ADD=rows=>{const lib=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:(window.BENTO_RECIPE_LIBRARY=[]),seen=new Set(lib.map(r=>String(r.id||'')));for(const o of rows||[]){if(!o||seen.has(String(o.id||'')))continue;const context=o.contextUrl||contextFor(o);const r={cuisine:'Vietnamese',country:'Vietnam',countryCode:'VN',recipeType:'Reviewed regional classic',energy:'normal',cleanup:2,freezer:'no',collection:'Vietnamese Kitchen',favorite:false,builtIn:true,dietTags:[],libraryVersion:31,instructionVersion:31,instructionStyle:'comprehensive-variable-length',createdAt:'2026-08-14T14:45:00+08:00',updatedAt:'2026-08-14T14:45:00+08:00',verifiedAt:'2026-08-14',auditStatus:'Vietnamese v27 QA · 2026',inactiveMinutes:Math.max(0,Number(o.total||0)-Number(o.prep||0)-Number(o.cook||0)),source:'Bento Vietnamese Kitchen · reviewed August 2026 against Vietnam Tourism regional and dish guides. Practical quantities and wording are Bento home-cooking adaptations; regional, vendor, and household versions vary.',sourceUrls:Array.from(new Set([context,MUST,FOOD,RECIPES].filter(Boolean))).slice(0,4),photoQueries:[`${o.title} Vietnamese food`,`${o.title} ${o.region||'Vietnam'} dish`],...o};delete r.contextUrl;lib.push(r);seen.add(String(r.id))}}
window.BENTO_VIETNAMESE_SOURCE_URLS={FOOD,REGION,MUST,HANOI,HUE,HUE2,HOIAN,HOIAN2,RECIPES};
})();
