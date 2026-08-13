from pathlib import Path
import re

ROOT = Path('.')
INDEX = ROOT / 'index.html'
STYLE = ROOT / 'style.css'
APP = ROOT / 'app.js'
SW = ROOT / 'service-worker.js'
UI_JS = ROOT / 'v20-ui.js'
UI_CSS = ROOT / 'v20-ui.css'
PERF_JS = ROOT / 'v20-perf.js'
PERF_CSS = ROOT / 'v20-perf.css'
WORKFLOW = ROOT / '.github/workflows/bento-consolidate.yml'
SELF = ROOT / 'tools/consolidate_bento.py'

for p in [INDEX, STYLE, APP, SW, UI_JS, UI_CSS, PERF_JS, PERF_CSS]:
    if not p.exists():
        raise SystemExit(f'Missing expected file: {p}')

def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Expected source not found for {label}')
    return text.replace(old, new, 1)

def sub_once(text, pattern, replacement, label, flags=0):
    out, n = re.subn(pattern, replacement, text, count=1, flags=flags)
    if n != 1:
        raise SystemExit(f'Expected exactly one replacement for {label}; got {n}')
    return out

# index.html — own the final wiring directly.
index = INDEX.read_text(encoding='utf-8')
index = sub_once(index, r'href="style\.css\?v=\d+"', 'href="style.css?v=21"', 'style version')

scripts = [
    '<script src="data/recipes-data.js?v=21" defer></script>',
    '<script src="data/photo-index.js?v=21" defer></script>',
    '<script src="data/korean-runtime.js?v=21" defer></script>',
    *[f'<script src="data/korean-recipes-{i:02d}.js?v=21" defer></script>' for i in range(10)],
    '<script src="data/anime-runtime.js?v=21" defer></script>',
    *[f'<script src="data/anime-recipes-{i:02d}.js?v=21" defer></script>' for i in range(10)],
    '<script src="app.js?v=21" defer></script>',
]
script_block = '\n  ' + '\n  '.join(scripts)
index = sub_once(
    index,
    r'\n\s*<script src="data/recipes-data\.js\?v=\d+" defer></script>\s*\n\s*<script src="data/photo-index\.js\?v=\d+" defer></script>\s*\n\s*<script src="app\.js\?v=\d+" defer></script>',
    script_block,
    'direct data/app scripts',
    flags=re.S,
)

old_results = '''        <div class="recipe-results-heading">
          <div><h2 id="recipeResultsTitle">All recipes</h2><small id="recipeResultsCount" class="muted"></small></div>
          <button class="soft-btn compact-filter-clear hidden" type="button" data-clear-recipe-filters>Reset</button>
        </div>'''
new_results = '''        <div class="recipe-results-heading">
          <div><h2 id="recipeResultsTitle">All recipes</h2><small id="recipeResultsCount" class="muted"></small></div>
          <div class="recipe-result-actions">
            <button id="recipeCardPhotosQuick" class="recipe-photo-quick-toggle" type="button" aria-label="Toggle recipe card photos" aria-pressed="false"><span aria-hidden="true">▧</span><b>Photos</b><small>Off</small></button>
            <button class="soft-btn compact-filter-clear hidden" type="button" data-clear-recipe-filters>Reset</button>
          </div>
        </div>'''
index = replace_once(index, old_results, new_results, 'recipe photo quick toggle')

settings_anchor = '        <div class="section-heading"><h2>Kitchen automation</h2></div>'
settings_insert = '''        <div class="section-heading"><h2>Recipe display</h2></div>
        <div class="settings-card settings-toggle-grid recipe-display-settings">
          <label class="toggle-line recipe-photo-toggle"><span><b>Show photos on recipe cards</b><small>Off by default for a faster, denser library. Full photos still appear when a recipe is opened.</small></span><input id="recipeCardPhotosInput" type="checkbox" /></label>
        </div>
        <div class="section-heading"><h2>Kitchen automation</h2></div>'''
index = replace_once(index, settings_anchor, settings_insert, 'recipe photo settings')
INDEX.write_text(index, encoding='utf-8')

# style.css — absorb all UI/performance sidecar styles.
style = STYLE.read_text(encoding='utf-8').rstrip()
ui_css = UI_CSS.read_text(encoding='utf-8')
perf_css = PERF_CSS.read_text(encoding='utf-8')
merged_css = ui_css + '\n' + perf_css
merged_css = re.sub(r'/\*\s*Bento v20[^*]*\*/', '', merged_css)
merged_css = re.sub(r'\n{3,}', '\n\n', merged_css).strip()
style += '\n\n/* Consolidated recipe library, photo display, and scroll performance */\n' + merged_css + '\n'
STYLE.write_text(style, encoding='utf-8')

# app.js — make the source file match the app that runs.
app = APP.read_text(encoding='utf-8')
perf_js = PERF_JS.read_text(encoding='utf-8').replace('__BENTO_PERF_V20P2__', '__BENTO_PERF__')

app = sub_once(app, r'const VERSION = \d+;', 'const VERSION = 21;', 'app version')
app = replace_once(app, 'const RECIPE_RENDER_BATCH = 30;', 'const RECIPE_RENDER_BATCH = 20;', 'recipe batch size')
app = replace_once(app, 'const MAX_PHOTO_FETCHES=3;', 'const MAX_PHOTO_FETCHES=2;', 'photo concurrency')
app = replace_once(app, "{rootMargin:'120px'}", "{rootMargin:'48px'}", 'photo observer margin')
app = replace_once(
    app,
    'showHomeStats:true,showHomeFavorites:true,showTomorrowPrep:true,showHomeQuickActions:true,autoStapleGroceries:true',
    'showHomeStats:true,showHomeFavorites:true,showTomorrowPrep:true,showHomeQuickActions:true,recipeCardPhotos:false,autoStapleGroceries:true',
    'photo default setting',
)
bool_line = "for(const key of ['showHomeStats','showHomeFavorites','showTomorrowPrep','showHomeQuickActions','autoStapleGroceries','askPantryDeductAfterCook'])s.settings[key]=s.settings[key]!==false;"
app = replace_once(app, bool_line, bool_line + "s.settings.recipeCardPhotos=s.settings.recipeCardPhotos===true;", 'photo preference normalization')

new_apply = '''  function syncRecipePhotoControls(){const on=state.settings.recipeCardPhotos===true;const quick=$('#recipeCardPhotosQuick');if(quick){quick.classList.toggle('active',on);quick.setAttribute('aria-pressed',String(on));const status=quick.querySelector('small');if(status)status.textContent=on?'On':'Off'}const input=$('#recipeCardPhotosInput');if(input)input.checked=on}
  function applyTheme(){const t=THEMES[state.settings.theme]||THEMES.blossom,r=document.documentElement.style;r.setProperty('--accent',t.accent);r.setProperty('--accent-strong',t.strong);r.setProperty('--accent-soft',t.soft);r.setProperty('--bg',t.bg);r.setProperty('--surface-2',t.surface2);$('meta[name="theme-color"]')?.setAttribute('content',t.accent);document.body.classList.toggle('compact-mode',state.settings.density==='compact');const photos=state.settings.recipeCardPhotos===true;document.body.classList.toggle('recipe-card-photos-on',photos);document.body.classList.toggle('recipe-card-photos-off',!photos);syncRecipePhotoControls()}'''
app = sub_once(app, r'^  function applyTheme\(\)\{.*$', new_apply, 'theme/photo UI sync', flags=re.M)

new_schedule = "  function scheduleRender(){renderRequested=true;if(renderRAF)return;renderRAF=requestAnimationFrame(()=>{renderRAF=null;if(!renderRequested)return;renderRequested=false;try{renderCurrentView()}catch(err){console.error('Bento render error',err)}try{renderGlobalBadges()}catch(err){console.warn('Bento badge refresh skipped',err)}try{observePhotos()}catch(err){console.warn('Bento photo refresh skipped',err)}})}"
app = sub_once(app, r'^  function scheduleRender\(\)\{.*$', new_schedule, 'safe scheduled render', flags=re.M)

new_nav = "  function navigate(view,pushHash=true){if(view==='more')view='home';if(!document.querySelector(`.view[data-view=\"${view}\"]`))view='home';closeMenu();if(currentView!==view)previousView=currentView;currentView=view;$$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));if(pushHash&&location.hash!==`#${view}`)history.pushState({view},'',`#${view}`);window.scrollTo(0,0);$('#mainContent')?.focus({preventScroll:true});try{renderCurrentView()}catch(err){console.error('Bento navigation render error',err)}try{renderGlobalBadges()}catch(err){console.warn('Bento badge refresh skipped',err)}try{observePhotos()}catch(err){console.warn('Bento photo refresh skipped',err)}}"
app = sub_once(app, r'^  function navigate\(view,pushHash=true\)\{.*$', new_nav, 'safe navigation render', flags=re.M)

new_observe = "  function observePhotos(root=document){$$('[data-real-photo]',root).forEach(img=>{if(img.dataset.photoObserved)return;if(img.closest('.recipe-card')&&state.settings.recipeCardPhotos!==true)return;const view=img.closest('.view');if(view&&!view.classList.contains('active'))return;img.dataset.photoObserved='1';photoObserver?photoObserver.observe(img):queuePhoto(img)})}"
app = sub_once(app, r'^  function observePhotos\(root=document\)\{.*$', new_observe, 'photo observation guard', flags=re.M)

new_drain = "  function drainPhotoQueue(){while(photoActive<MAX_PHOTO_FETCHES&&photoQueue.length){const img=photoQueue.shift();if(!img?.isConnected)continue;photoActive++;resolveAndApplyPhoto(img).catch(()=>markPhotoUnavailable(img)).finally(()=>{photoActive--;drainPhotoQueue()})}}"
app = sub_once(app, r'^  function drainPhotoQueue\(\)\{.*$', new_drain, 'photo queue disconnect guard', flags=re.M)

app = replace_once(app, "gsrlimit:'8'", "gsrlimit:'5'", 'photo metadata search limit')
app = replace_once(app, "iiurlwidth:kind==='ingredient'?'280':'760'", "iiurlwidth:kind==='ingredient'?'240':'640'", 'photo request width')
app = replace_once(
    app,
    "${r?.realWorldInspiration||''} ${(r?.tags||[]).join(' ')}",
    "${r?.realWorldInspiration||''} ${r?.animeSeries||''} ${r?.animeEpisode||''} ${r?.animeEpisodeTitle||''} ${r?.animeDishName||''} ${r?.realWorldDish||''} ${r?.adaptationType||''} ${(r?.tags||[]).join(' ')}",
    'anime search fields',
)
app = replace_once(
    app,
    "$('#recipeSearch').addEventListener('input',debounce(()=>{recipeRenderLimit=RECIPE_RENDER_BATCH;renderRecipes()},100));",
    "$('#recipeSearch').addEventListener('input',debounce(()=>{recipeRenderLimit=RECIPE_RENDER_BATCH;renderRecipes()},140));",
    'recipe search debounce',
)

# Native compact cuisine dropdown.
cuisine_pattern = r"      if\(recipeBrowseMode==='cuisines'\)\{.*?\n      \}\n      if\(recipeBrowseMode==='meals'\)\{"
cuisine_replacement = '''      if(recipeBrowseMode==='cuisines'){
        const cuisines=[...new Set(builtins.filter(r=>r&&!isGameRecipe(r)&&!isAnimeRecipe(r)).map(r=>String(r.cuisine||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
        const selected=cuisines.includes(recipeCuisineFilter)?recipeCuisineFilter:'All';
        const selectedRows=selected==='All'?rows.filter(r=>!isGameRecipe(r)&&!isAnimeRecipe(r)):rows.filter(r=>String(r.cuisine||'')===selected&&!isGameRecipe(r)&&!isAnimeRecipe(r));
        const sweets=selectedRows.filter(r=>['Sweets & Desserts','Dessert'].includes(r.category)).length,drinks=selectedRows.filter(r=>['Drinks','Drink','Beverages'].includes(r.category)).length;
        panel.innerHTML=cuisines.length?`<div class="cuisine-picker-card"><div class="cuisine-picker-head"><span class="cuisine-picker-icon">${selected==='All'?'🌏':cuisineFlag(selected)}</span><span><b>${esc(selected==='All'?'Choose a cuisine':selected)}</b><small>${selected==='All'?`${cuisines.length} cuisines in Bento`:`${selectedRows.length} recipes · ${sweets} desserts · ${drinks} drinks`}</small></span></div><label class="cuisine-select-wrap"><span class="sr-only">Choose cuisine</span><select class="cuisine-browse-select" aria-label="Choose cuisine"><option value="All">🌏 All cuisines</option>${cuisines.map(c=>`<option value="${esc(c)}" ${selected===c?'selected':''}>${cuisineFlag(c)} ${esc(c)}</option>`).join('')}</select><span aria-hidden="true">⌄</span></label><p class="cuisine-picker-note">${selected==='All'?'Pick a cuisine to narrow the library.':`Showing ${esc(selected)} recipes only.`}</p></div>`:emptyCard('No cuisines yet.');
        return;
      }
      if(recipeBrowseMode==='meals'){'''
app = sub_once(app, cuisine_pattern, cuisine_replacement, 'native cuisine dropdown', flags=re.S)

# Restore Anime series categories and make them filterable.
anime_pattern = r"      if\(recipeBrowseMode==='anime'\)\{.*?\n      \}\n      panel\.innerHTML=emptyCard\('Choose a recipe section above\.'\);"
anime_replacement = '''      if(recipeBrowseMode==='anime'){
        const anime=rows.filter(r=>r.animeDish||r.animeSeries);
        if(!anime.length){panel.innerHTML=emptyCard('No anime-inspired recipes yet.');return;}
        const series=[...new Set(anime.map(r=>r.animeSeries).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
        panel.innerHTML=`<div class="special-collection-stack anime-series-stack"><button class="special-collection-card ${recipeFilter==='Anime'?'selected':''}" data-anime-series=""><span class="special-icon">📺</span><span><b>All Anime</b><small>${anime.length} recipes</small></span><i>›</i></button>${series.map(name=>{const n=anime.filter(r=>r.animeSeries===name).length,on=recipeFilter===`AnimeSeries:${name}`;return `<button class="special-collection-card ${on?'selected':''}" data-anime-series="${esc(name)}"><span class="special-icon">📺</span><span><b>${esc(name)}</b><small>${n} recipes</small></span><i>›</i></button>`}).join('')}</div>`;
        return;
      }
      panel.innerHTML=emptyCard('Choose a recipe section above.');'''
app = sub_once(app, anime_pattern, anime_replacement, 'anime category restoration', flags=re.S)

app = replace_once(
    app,
    "    if(recipeFilter.startsWith('Collection:'))return recipeFilter.slice(11);",
    "    if(recipeFilter.startsWith('Collection:'))return recipeFilter.slice(11);\n    if(recipeFilter.startsWith('AnimeSeries:'))return recipeFilter.slice(12);",
    'anime filter label',
)
app = replace_once(
    app,
    "else if(filter==='Meals')list=list.filter",
    "else if(filter.startsWith('AnimeSeries:')){const series=filter.slice(12);list=list.filter(r=>r.animeSeries===series);}else if(filter==='Meals')list=list.filter",
    'anime series filtering',
)

# Card photos are not even created/fetched when off.
card_pattern = r"  function recipeCard\(r\)\{.*?\n  \}\n\n  function typeRecipeCount"
card_replacement = '''  function recipeCard(r){
    const jp=r.japaneseName?`<small class="recipe-card-jp">${esc(r.japaneseName)}</small>`:'';
    const secondary=[`${totalTime(r)} min`,r.difficulty||'',r.servings?`${r.servings} servings`:'' ].filter(Boolean).join(' · ');
    const gameApp=activeGameAppearance(r),secondaryBadge=gameApp?.region||(r.gameDish?(r.gameRegion||'Teyvat'):(r.cuisine||'')),displayTitle=displayRecipeTitle(r),photo=state.settings.recipeCardPhotos===true?`<div class="thumb">${recipeVisual(r,'card')}</div>`:'';
    return `<article class="recipe-card"><button class="heart-btn" data-favorite="${r.id}" aria-label="${r.favorite?'Remove from favorites':'Add to favorites'}">${r.favorite?'♥':'♡'}</button><button class="recipe-open" data-recipe-id="${r.id}">${photo}<div class="body"><div class="recipe-card-title"><b>${esc(displayTitle)}</b>${jp}</div><small class="recipe-card-meta">${esc(secondary)}</small><div class="badge-row recipe-card-badges"><span class="badge">${esc(r.category||'Other')}</span>${secondaryBadge?`<span class="badge quiet-badge">${esc(secondaryBadge)}</span>`:''}</div></div></button></article>`}

  function typeRecipeCount'''
app = sub_once(app, card_pattern, card_replacement, 'photo-aware recipe cards', flags=re.S)

# Native dropdown/category events.
change_anchor = "  document.addEventListener('change',e=>{\n    const g=e.target.closest('[data-grocery-check]');"
change_replacement = "  document.addEventListener('change',e=>{\n    const cuisineSelect=e.target.closest('.cuisine-browse-select');if(cuisineSelect){recipeCuisineFilter=cuisineSelect.value||'All';recipeFilter='Cuisines';recipeRenderLimit=RECIPE_RENDER_BATCH;renderRecipes();return}\n    const g=e.target.closest('[data-grocery-check]');"
app = replace_once(app, change_anchor, change_replacement, 'cuisine dropdown change handler')

genshin_line = "    const genshinRegion=e.target.closest('[data-genshin-region]');if(genshinRegion){recipeFilter=`GenshinRegion:${genshinRegion.dataset.genshinRegion}`;recipeCuisineFilter='All';recipeRenderLimit=RECIPE_RENDER_BATCH;renderRecipes();return}"
anime_line = genshin_line + "\n    const animeSeries=e.target.closest('[data-anime-series]');if(animeSeries){const series=animeSeries.dataset.animeSeries||'';recipeFilter=series?`AnimeSeries:${series}`:'Anime';recipeCuisineFilter='All';recipeRenderLimit=RECIPE_RENDER_BATCH;renderRecipes();return}"
app = replace_once(app, genshin_line, anime_line, 'anime category click handler')

# Settings + Recipes-tab photo toggle use the same persisted app state.
settings_piece = "$('#showHomeQuickActionsInput').checked=state.settings.showHomeQuickActions!==false;$('#autoStapleGroceriesInput').checked=state.settings.autoStapleGroceries!==false;"
app = replace_once(app, settings_piece, "$('#showHomeQuickActionsInput').checked=state.settings.showHomeQuickActions!==false;$('#recipeCardPhotosInput').checked=state.settings.recipeCardPhotos===true;$('#autoStapleGroceriesInput').checked=state.settings.autoStapleGroceries!==false;", 'settings photo checkbox render')

settings_listener = "$('#askPantryDeductInput').addEventListener('change',e=>{state.settings.askPantryDeductAfterCook=e.target.checked;commit()});"
app = replace_once(app, settings_listener, settings_listener + "\n  $('#recipeCardPhotosInput')?.addEventListener('change',e=>{state.settings.recipeCardPhotos=e.target.checked;commit(false);applyTheme();if(currentView==='recipes'){renderRecipes();observePhotos($('#recipeGrid'))}});", 'settings photo checkbox listener')

search_listener = "$('#recipeSearch').addEventListener('input',debounce(()=>{recipeRenderLimit=RECIPE_RENDER_BATCH;renderRecipes()},140));$('#recipeSort').addEventListener('change',renderRecipes);"
app = replace_once(app, search_listener, search_listener + "\n  $('#recipeCardPhotosQuick')?.addEventListener('click',()=>{state.settings.recipeCardPhotos=state.settings.recipeCardPhotos!==true;commit(false);applyTheme();renderRecipes();observePhotos($('#recipeGrid'))});", 'recipe-tab photo toggle listener')

# Preserve Anime detail/source information inside the mother app file.
anime_detail_helper = r'''

;(()=>{
  'use strict';
  const detail=document.getElementById('recipeDetailContent');
  if(!detail)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const rows=()=>Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY.filter(r=>r&&(r.animeDish||r.animeSeries)):[];
  function addFact(grid,label,value){if(!value)return;const d=document.createElement('div'),s=document.createElement('small'),b=document.createElement('b');s.textContent=label;b.textContent=value;d.append(s,b);grid.append(d)}
  function enhance(){
    if(detail.querySelector('.anime-source-card')||detail.querySelector('.cook-mode'))return;
    const marker=detail.querySelector('[data-detail-fav]');if(!marker)return;
    const r=rows().find(x=>String(x.id)===String(marker.dataset.detailFav));if(!r)return;
    const card=document.createElement('div');card.className='anime-source-card';
    const h=document.createElement('div');h.className='anime-source-title';h.innerHTML=`<span>📺</span><div><small>From anime</small><b>${esc(r.animeSeries||'Anime')}</b></div>`;
    const facts=document.createElement('div');facts.className='anime-source-grid';
    addFact(facts,'Episode',[r.animeEpisode,r.animeEpisodeTitle].filter(Boolean).join(' · '));
    addFact(facts,'Anime dish',r.animeDishName);
    addFact(facts,'Real-world version',r.realWorldDish);
    addFact(facts,'Recreation',r.adaptationType);
    card.append(h,facts);
    detail.querySelector('.recipe-facts')?.insertAdjacentElement('afterend',card);
  }
  new MutationObserver(enhance).observe(detail,{childList:true,subtree:true});
  enhance();
})();
'''
anime_detail_helper = anime_detail_helper.replace("'&quot'", "'&quot;'")

# Preserve the useful scroll/network tuning, now housed in app.js.
app = app.rstrip() + anime_detail_helper + '\n' + perf_js.strip() + '\n'
APP.write_text(app, encoding='utf-8')

# service-worker.js — cache/offline only. No source rewriting.
core = [
    './index.html','./style.css?v=21','./data/recipes-data.js?v=21','./data/photo-index.js?v=21','./data/library_manifest.json','./manifest.json','./data/korean-runtime.js?v=21',
    *[f'./data/korean-recipes-{i:02d}.js?v=21' for i in range(10)],
    './data/anime-runtime.js?v=21',
    *[f'./data/anime-recipes-{i:02d}.js?v=21' for i in range(10)],
    './app.js?v=21',
]
icons = ['./icon/apple-touch-icon.png','./icon/icon-72.png','./icon/icon-96.png','./icon/icon-128.png','./icon/icon-144.png','./icon/icon-152.png','./icon/icon-180.png','./icon/icon-192.png','./icon/icon-384.png','./icon/icon-512.png','./icon/icon-maskable-192.png','./icon/icon-maskable-512.png']
js_core = ',\n  '.join(repr(x) for x in core)
js_icons = ',\n  '.join(repr(x) for x in icons)
sw = f'''const CACHE='bento-shell-v0.7.0-v21';
const SHELL_PREFIX='bento-shell-';
const ASSET_VERSION='21';
const CORE=[
  {js_core}
];
const OPTIONAL_ICONS=[
  {js_icons}
];

async function cacheFresh(cache,asset){{
  const response=await fetch(asset,{{cache:'no-store'}});
  if(!response.ok)throw new Error(`Failed to cache ${{asset}}`);
  await cache.put(asset,response);
}}
async function cacheInBatches(cache,assets,size=4){{
  for(let i=0;i<assets.length;i+=size){{
    await Promise.all(assets.slice(i,i+size).map(asset=>cacheFresh(cache,asset)));
    await new Promise(resolve=>setTimeout(resolve,0));
  }}
}}
self.addEventListener('install',event=>{{
  event.waitUntil((async()=>{{
    const cache=await caches.open(CACHE);
    await cacheInBatches(cache,CORE,4);
    await Promise.allSettled(OPTIONAL_ICONS.map(asset=>cacheFresh(cache,asset)));
  }})());
  self.skipWaiting();
}});
self.addEventListener('activate',event=>{{
  event.waitUntil((async()=>{{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith(SHELL_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  }})());
}});
function fetchWithTimeout(request,ms=4000){{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  return fetch(request,{{cache:'no-store',signal:controller.signal}}).finally(()=>clearTimeout(timer));
}}
self.addEventListener('fetch',event=>{{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){{
    event.respondWith(fetchWithTimeout(event.request).then(response=>{{if(response.ok)caches.open(CACHE).then(cache=>cache.put('./index.html',response.clone()));return response}}).catch(()=>caches.match('./index.html')));
    return;
  }}
  const versioned=url.searchParams.get('v')===ASSET_VERSION;
  if(versioned){{
    event.respondWith(caches.open(CACHE).then(async cache=>{{const hit=await cache.match(event.request);if(hit)return hit;const response=await fetch(event.request);if(response.ok)cache.put(event.request,response.clone());return response}}));
    return;
  }}
  event.respondWith(caches.open(CACHE).then(async cache=>{{const hit=await cache.match(event.request);const fresh=fetch(event.request).then(response=>{{if(response.ok)cache.put(event.request,response.clone());return response}}).catch(()=>hit);return hit||fresh}}));
}});
'''
SW.write_text(sw, encoding='utf-8')

# Remove the sidecars and one-time migration machinery.
for p in [UI_JS, UI_CSS, PERF_JS, PERF_CSS]:
    p.unlink()
if WORKFLOW.exists(): WORKFLOW.unlink()
if SELF.exists(): SELF.unlink()

# Structural QA before the commit.
final_index = INDEX.read_text(encoding='utf-8')
final_app = APP.read_text(encoding='utf-8')
final_style = STYLE.read_text(encoding='utf-8')
final_sw = SW.read_text(encoding='utf-8')
checks = {
    'index photo quick toggle': 'id="recipeCardPhotosQuick"' in final_index,
    'index settings photo toggle': 'id="recipeCardPhotosInput"' in final_index,
    'all Korean chunks': all(f'korean-recipes-{i:02d}.js?v=21' in final_index for i in range(10)),
    'all Anime chunks': all(f'anime-recipes-{i:02d}.js?v=21' in final_index for i in range(10)),
    'Anime series categories/filter': 'AnimeSeries:' in final_app and 'data-anime-series' in final_app,
    'photo preference in app': 'recipeCardPhotos' in final_app,
    'false refresh popup gone': 'That section could not refresh' not in final_app,
    'compact recipe controls in style': '.recipe-photo-quick-toggle' in final_style and '.cuisine-picker-card' in final_style,
    'performance rules in style': 'bento-fast-scroll' in final_style,
    'cache-only service worker': 'upgradeHtml' not in final_sw and 'upgradeApp' not in final_sw,
    'no v20 sidecar refs in index': 'v20-' not in final_index,
    'no v20 sidecar refs in service worker': 'v20-' not in final_sw,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit('QA failed: ' + ', '.join(failed))

for ref in re.findall(r'(?:src|href)="([^"#]+)"', final_index):
    if ref.startswith(('http:', 'https:', 'data:')):
        continue
    path = ref.split('?', 1)[0]
    if path.endswith(('.js', '.css', '.png', '.json')) and not Path(path).exists():
        raise SystemExit(f'Broken local asset reference: {ref}')

print('Consolidation structural QA passed.')
