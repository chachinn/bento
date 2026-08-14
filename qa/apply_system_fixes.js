'use strict';
const fs=require('fs');
function writeIfChanged(path,next){const cur=fs.readFileSync(path,'utf8');if(cur===next)return false;fs.writeFileSync(path,next);console.log('patched',path);return true}
let app=fs.readFileSync('app.js','utf8');
if(!app.includes('function ingredientScaleFactor')){
  const scaleRx=/  function scaleIngredientLine\(line,factor=1\)\{[\s\S]*?\n  function recipeServingFactor/;
  if(!scaleRx.test(app))throw new Error('Could not locate scaleIngredientLine block');
  app=app.replace(scaleRx,`  function ingredientScaleFactor(line,factor=1){
    const f=Number(factor);if(!Number.isFinite(f)||f<=0)return 1;
    const raw=String(line||'').toLowerCase();
    const keepUntilDouble=/\\b(salt|seasoning salt|black pepper|white pepper|ground pepper|pepper flakes|chili flakes|chilli flakes|cayenne)\\b/i.test(raw);
    if(keepUntilDouble&&f<2)return 1;
    return f;
  }
  function scaleIngredientLine(line,factor=1){const raw=String(line||''),effective=ingredientScaleFactor(raw,factor);if(Math.abs(effective-1)<0.001)return raw;const m=raw.match(/^(\\s*)(\\d+\\s+\\d+\\/\\d+|\\d+\\/\\d+|\\d+(?:\\.\\d+)?)(.*)$/);if(!m)return raw;const qty=parseQuantityToken(m[2]);if(!Number.isFinite(qty))return raw;const scaled=qty*effective;if(!Number.isFinite(scaled)||scaled<=0)return raw;return m[1]+formatScaledQuantity(scaled)+m[3]}
  function recipeServingFactor`);
}
if(!/if\(plan\.special==='genshin'\)return await genshinArtworkSearch\(plan\);if\(plan\.special==='anime'\)return await animeArtworkSearch\(plan\)/.test(app)){
  const photoRx=/  async function resolvePhotoMeta\(plan,variant=0\)\{[\s\S]*?return weak\}/;
  if(!photoRx.test(app))throw new Error('Could not locate resolvePhotoMeta');
  app=app.replace(photoRx,`  async function resolvePhotoMeta(plan,variant=0){if(!plan)return null;if(plan.special==='genshin')return await genshinArtworkSearch(plan);if(plan.special==='anime')return await animeArtworkSearch(plan);const qs=Array.isArray(plan.queries)?plan.queries:[];let weak=null;for(const q of qs){if(!q)continue;const meta=await commonsSearchOne(q,plan.kind||'recipe',variant);if(meta&&!meta.missing){if((meta.score??0)>=2)return meta;if(!weak)weak=meta}}return weak}`);
}
app=app.replace("toast('Trying another real photo…')","toast(plan.special==='genshin'?'Trying another Genshin image…':plan.special==='anime'?'Trying another anime image…':'Trying another real photo…')");
app=app.replace(/Download real photos for the full \$\{BUILTIN_RECIPES\.length\}-recipe library\?/g,'Download recipe images for the full ${BUILTIN_RECIPES.length}-recipe library?');
app=app.replace(/function addPhotoCredit\(shell,img\)\{if\(!shell\|\|shell\.querySelector\('\.photo-credit'\)\)return;const page=img\.dataset\.photoPage\|\|'',license=img\.dataset\.photoLicense\|\|'',artist=img\.dataset\.photoArtist\|\|'';const a=document\.createElement\(page\?'a':'span'\);a\.className='photo-credit';if\(page\)\{a\.href=page;a\.target='_blank';a\.rel='noopener noreferrer'\}a\.textContent=`Photo: Wikimedia Commons\$\{artist\?` · \$\{artist\}`:''\}\$\{license\?` · \$\{license\}`:''\}`;shell\.append\(a\)\}/,`function addPhotoCredit(shell,img){if(!shell||shell.querySelector('.photo-credit'))return;const page=img.dataset.photoPage||'',license=img.dataset.photoLicense||'',artist=img.dataset.photoArtist||'';const a=document.createElement(page?'a':'span');a.className='photo-credit';if(page){a.href=page;a.target='_blank';a.rel='noopener noreferrer'}const source=/game artwork/i.test(license)?'Genshin source artwork':/anime series artwork/i.test(license)?'Anime source artwork':'Wikimedia Commons';a.textContent=\`Image: \${source}\${artist?\` · \${artist}\`:''}\${license?\` · \${license}\`:''}\`;shell.append(a)}`);
writeIfChanged('app.js',app);
let index=fs.readFileSync('index.html','utf8').replace(/24p1/g,'24p2');
const scripts=['data/recipe-content-fixes-standard.js','data/recipe-content-fixes-genshin.js','data/recipe-content-fixes-anime.js','data/recipe-quality-runtime.js'];
for(const file of scripts){if(!index.includes(file)){const tag=`<script src="${file}?v=24p2" defer></script>\n  `;if(file==='data/recipe-quality-runtime.js')index=index.replace(/(<script src="app\.js\?v=24p2" defer><\/script>)/,tag+'$1');else index=index.replace(/(<script src="data\/recipe-quality-runtime\.js\?v=24p2" defer><\/script>)/,tag+'$1')}}
writeIfChanged('index.html',index);
let sw=fs.readFileSync('service-worker.js','utf8').replace(/24p1/g,'24p2').replace(/bento-shell-v1\.0\.0-v24p2-refs1/g,'bento-shell-v1.0.0-v24p2-qa1');
for(const file of scripts){const asset=`'./${file}?v=24p2'`;if(!sw.includes(asset))sw=sw.replace("  './app.js?v=24p2'",`  ${asset},\n  './app.js?v=24p2'`)}
writeIfChanged('service-worker.js',sw);
console.log('system fixes complete');
