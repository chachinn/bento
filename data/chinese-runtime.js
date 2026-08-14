(()=>{'use strict';
const K='id title localName romanization category region prep cook total servings difficulty equipment ingredients steps notes spiceLevel'.split(' '),A=window.BENTO_RECIPE_LIBRARY||(window.BENTO_RECIPE_LIBRARY=[]);
const CHINA_CUISINE='https://english.scio.gov.cn/m/featured/chinakeywords/2024-08/30/content_117397262.htm';
const sourceUrls=title=>{const q=encodeURIComponent(title).replace(/%20/g,'+');return [`https://thewoksoflife.com/?s=${q}`,`https://www.chinasichuanfood.com/?s=${q}`,CHINA_CUISINE]};
const SOURCE='Bento Chinese Kitchen · reviewed August 2026 against current Chinese regional-cuisine references plus established tested-recipe archives. Practical quantities and wording are Bento adaptations; regional and household versions vary.';
for(const x of window.BENTO_CN||[]){let r={cuisine:'Chinese',country:'China',builtIn:true,collection:'Chinese Kitchen'};K.forEach((k,i)=>r[k]=x[i]);r.source=SOURCE;r.sourceUrls=sourceUrls(r.title);A.push(r)}})();
