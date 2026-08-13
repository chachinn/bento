from pathlib import Path
import json, re

app_path=Path('app.js')
style_path=Path('style.css')
index_path=Path('index.html')
sw_path=Path('service-worker.js')
manifest_path=Path('manifest.json')
library_path=Path('data/library_manifest.json')

app=app_path.read_text(encoding='utf-8')
style=style_path.read_text(encoding='utf-8')
index=index_path.read_text(encoding='utf-8')
sw=sw_path.read_text(encoding='utf-8')

def replace_once(text, old, new, label):
    count=text.count(old)
    if count != 1:
        raise SystemExit(f'Patch anchor {label!r} expected once, found {count}')
    return text.replace(old,new,1)

# Settings/goals synchronization.
app=replace_once(app,
    "s.goals={...base.goals,...(raw.goals||{})};s.stats={...base.stats,...(raw.stats||{})};",
    "s.goals={...base.goals,...(raw.goals||{})};s.stats={...base.stats,...(raw.stats||{})};if(raw.goals?.cookPerWeek==null&&raw.settings?.weeklyGoal!=null)s.goals.cookPerWeek=clamp(Number(raw.settings.weeklyGoal)||0,0,28);s.settings.weeklyGoal=clamp(Number(s.goals.cookPerWeek)||0,0,28);",
    'goal normalization')

# Recipe browse consistency / dead renderer cleanup.
app=replace_once(app,
    "  function recipeStyleCount(kind,name){return standardRecipePool().filter(r=>kind==='dessert'?r.category==='Sweets & Desserts'&&(!name||r.dessertStyle===name):r.category==='Drinks'&&(!name||r.drinkStyle===name)).length}\n  function renderStyleCards(items,kind){return `<div class=\"type-card-grid feature-type-grid\">${items.map(item=>{const styleName=item.name.startsWith('All ')?'':item.name,count=recipeStyleCount(kind,styleName),on=recipeFilter===item.filter;return `<button class=\"type-card feature-type-card ${on?'selected':''}\" data-style-filter=\"${esc(item.filter)}\"><span>${item.icon}</span><b>${esc(item.name)}</b><small>${count} recipe${count===1?'':'s'}</small></button>`}).join('')}</div>`}\n",
    "  function recipeStyleCount(kind,name){const categories=kind==='dessert'?RECIPE_TYPE_GROUPS.desserts.categories:RECIPE_TYPE_GROUPS.drinks.categories;return standardRecipePool().filter(r=>categories.includes(r.category)&&(!name||(kind==='dessert'?r.dessertStyle:r.drinkStyle)===name)).length}\n",
    'recipe style count')
app=replace_once(app,
    "      const builtins=(Array.isArray(BUILTIN_RECIPES)?BUILTIN_RECIPES:[]).filter(r=>r&&typeof r==='object');\n",
    "",
    'unused browse builtins')
app=replace_once(app,
    "        const cuisines=[...new Set(builtins.filter(r=>r&&!isGameRecipe(r)&&!isAnimeRecipe(r)).map(r=>String(r.cuisine||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));",
    "        const cuisines=[...new Set(standardRecipePool().map(r=>String(r.cuisine||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));",
    'cuisine source')
app=replace_once(app,
    "    if(recipeFilter==='Meals')return 'Meals';",
    "    if(recipeFilter==='Meals')return 'Meals';\n    if(recipeFilter==='NeverCooked')return 'Never Cooked';",
    'never cooked label')
app=replace_once(app,
    "else if(filter==='Meals')list=list.filter(r=>!['Sweets & Desserts','Dessert','Drinks','Drink','Beverages'].includes(r.category));",
    "else if(filter==='NeverCooked')list=list.filter(r=>countCooked(r.id)===0);else if(filter==='Meals')list=list.filter(r=>!['Sweets & Desserts','Dessert','Drinks','Drink','Beverages'].includes(r.category));",
    'never cooked filter')
old_cf="    const cf=e.target.closest('[data-collection-filter]');if(cf){const f=cf.dataset.collectionFilter;if(f==='NeverCooked'){recipeFilter='All';navigate('recipes');$('#recipeSearch').value='';recipeBrowseMode='cuisines';recipeCuisineFilter='All';const never=standardRecipePool().filter(r=>countCooked(r.id)===0);$('#recipeGrid').innerHTML=never.length?never.map(recipeCard).join(''):emptyCard('Every saved recipe has been cooked.');}else{recipeBrowseMode='cuisines';recipeCuisineFilter='All';recipeFilter=f;navigate('recipes')}return}"
new_cf="    const cf=e.target.closest('[data-collection-filter]');if(cf){const f=cf.dataset.collectionFilter;recipeBrowseMode='cuisines';recipeCuisineFilter='All';recipeFilter=f;recipeRenderLimit=RECIPE_RENDER_BATCH;const q=$('#recipeSearch');if(q)q.value='';navigate('recipes');return}"
app=replace_once(app,old_cf,new_cf,'collection filter')

# Planner and Kitchen Magic correctness.
app=replace_once(app,
    "function preferredSlotForRecipe(r){const c=String(r?.category||'').toLowerCase();if(c==='breakfast'&&activeMealSlots().includes('breakfast'))return'breakfast';if(c==='lunch'&&activeMealSlots().includes('lunch'))return'lunch';if(/snack|dessert/.test(c)&&activeMealSlots().includes('snack'))return'snack';return activeMealSlots().includes('dinner')?'dinner':activeMealSlots()[0]}",
    "function preferredSlotForRecipe(r){const c=String(r?.category||'').toLowerCase();if(c==='breakfast'&&activeMealSlots().includes('breakfast'))return'breakfast';if(c==='lunch'&&activeMealSlots().includes('lunch'))return'lunch';if(/snack|dessert|sweets|fried & street food/.test(c)&&activeMealSlots().includes('snack'))return'snack';return activeMealSlots().includes('dinner')?'dinner':activeMealSlots()[0]}",
    'preferred slot')
app=replace_once(app,
    "const sideCats=['Side','Soup','Snack','Dessert'];",
    "const sideCats=['Side Dishes','Soups & Hot Pots','Fried & Street Food','Sweets & Desserts','Breads & Pastries'];",
    'complete meal categories')
old_copy="  function copyWeek(){const from=weekDates(),to=weekDates(weekOffset+1),before=new Map();let count=0;from.forEach((d,i)=>{const src=state.mealPlan[dateKey(d)],key=dateKey(to[i]);before.set(key,cloneData(state.mealPlan[key]||null));if(src){state.mealPlan[key]=cloneData(src);count+=Object.keys(src).length}});commit();toast(count?`Copied ${count} meal${count===1?'':'s'} to next week`:'Nothing planned to copy',count?()=>{for(const [key,val] of before){if(val)state.mealPlan[key]=val;else delete state.mealPlan[key]}}:null)}"
new_copy="  function copyWeek(){const from=weekDates(),to=weekDates(weekOffset+1),occupied=to.filter(d=>Object.keys(state.mealPlan[dateKey(d)]||{}).length);if(occupied.length&&!confirm('Next week already has planned meals. Replace those days with this week?'))return;const before=new Map();let count=0;from.forEach((d,i)=>{const src=state.mealPlan[dateKey(d)],key=dateKey(to[i]);before.set(key,cloneData(state.mealPlan[key]||null));if(src){state.mealPlan[key]=cloneData(src);count+=Object.keys(src).length}else delete state.mealPlan[key]});commit();toast(count?`Copied ${count} meal${count===1?'':'s'} to next week`:'Nothing planned to copy',count?()=>{for(const [key,val] of before){if(val)state.mealPlan[key]=val;else delete state.mealPlan[key]}}:null)}"
app=replace_once(app,old_copy,new_copy,'copy week')

# Leftover defaults and wording.
app=replace_once(app,
    "  function openLeftoverForm(){ $('#leftoverForm').reset();$('#leftoverPortionsInput').value=1;const d=new Date();d.setDate(d.getDate()+3);$('#leftoverUseByInput').value=dateKey(d);openDialog($('#leftoverDialog')) }",
    "  function openLeftoverForm(){ $('#leftoverForm').reset();$('#leftoverPortionsInput').value=1;const d=new Date();d.setDate(d.getDate()+clamp(Number(state.settings.defaultLeftoverDays)||3,1,14));$('#leftoverUseByInput').value=dateKey(d);openDialog($('#leftoverDialog')) }",
    'leftover default')
app=replace_once(app,'Plan tomorrow lunch</button>','Plan tomorrow</button>','leftover plan wording')

# Grocery HTML typo.
app=replace_once(app,'</span></span><button data-grocery-delete=','</span><button data-grocery-delete=','grocery markup')

# Shopping mode lifecycle and bottom-nav semantics.
app=replace_once(app,
    "function navigate(view,pushHash=true){if(view==='more')view='home';",
    "function navigate(view,pushHash=true){if(view==='more')view='home';if(view!=='grocery'&&document.body.classList.contains('shopping-mode')){document.body.classList.remove('shopping-mode');$('#shoppingModeButton')?.setAttribute('aria-pressed','false');if(!cookingSession)releaseWakeLock()}",
    'navigate shopping cleanup')
app=replace_once(app,
    "$$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===view));",
    "$$('.bottom-nav button').forEach(b=>{const on=b.dataset.nav===view;b.classList.toggle('active',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});",
    'nav aria current')
old_shop="$('#shoppingModeButton').addEventListener('click',async()=>{document.body.classList.toggle('shopping-mode');if(document.body.classList.contains('shopping-mode')){await requestWakeLock();toast('Shopping mode on')}else await releaseWakeLock()});"
new_shop="$('#shoppingModeButton').addEventListener('click',async()=>{const on=!document.body.classList.contains('shopping-mode');document.body.classList.toggle('shopping-mode',on);$('#shoppingModeButton').setAttribute('aria-pressed',String(on));if(on){await requestWakeLock();toast('Shopping mode on')}else{if(!cookingSession)await releaseWakeLock();toast('Shopping mode off')}});"
app=replace_once(app,old_shop,new_shop,'shopping toggle')

# Goals edited from Insights stay synchronized with Settings.
old_goal="$('#goalForm').addEventListener('submit',e=>{e.preventDefault();state.goals.cookPerWeek=Number($('#goalCookInput').value)||0;state.goals.newPerMonth=Number($('#goalNewInput').value)||0;state.goals.rescuePerMonth=Number($('#goalRescueInput').value)||0;commit();$('#goalDialog').close();toast('Goals updated')});"
new_goal="$('#goalForm').addEventListener('submit',e=>{e.preventDefault();state.goals.cookPerWeek=clamp(Number($('#goalCookInput').value)||0,0,28);state.goals.newPerMonth=clamp(Number($('#goalNewInput').value)||0,0,31);state.goals.rescuePerMonth=clamp(Number($('#goalRescueInput').value)||0,0,50);state.settings.weeklyGoal=state.goals.cookPerWeek;commit();$('#goalDialog').close();toast('Goals updated')});"
app=replace_once(app,old_goal,new_goal,'goal form sync')

# Photo object-URL lifecycle: register load/error handlers first and always revoke blobs.
photo_pattern=re.compile(r"  async function resolveAndApplyPhoto\(img\)\{.*?\n  function addPhotoCredit",re.S)
match=photo_pattern.search(app)
if not match:
    raise SystemExit('Photo resolver not found')
photo_new="""  async function resolveAndApplyPhoto(img){
    const plan=planForPhotoElement(img);if(!plan)return markPhotoUnavailable(img);const variant=Number(img.dataset.photoVariant||photoVariantByRecipe.get(String(plan.id||img.dataset.photoKey||''))||0),meta=await resolvePhotoMeta(plan,variant);if(!meta||meta.missing||!meta.url)return markPhotoUnavailable(img);
    const releaseObjectUrl=()=>{const u=img.dataset.objectUrl;if(u){try{URL.revokeObjectURL(u)}catch{}delete img.dataset.objectUrl}};
    const onLoad=()=>{const shell=img.closest('.photo-shell,.ingredient-photo-shell');shell?.classList.add('has-photo');shell?.classList.remove('photo-unavailable');shell?.querySelector('.photo-skeleton')?.remove();if(shell?.classList.contains('detail-photo-shell'))addPhotoCredit(shell,img);releaseObjectUrl()};
    const onError=()=>{releaseObjectUrl();markPhotoUnavailable(img)};
    img.addEventListener('load',onLoad,{once:true});img.addEventListener('error',onError,{once:true});
    const blob=await cachedPhotoBlob(meta.url);if(blob){const objectUrl=URL.createObjectURL(blob);img.dataset.objectUrl=objectUrl;img.src=objectUrl}else if(navigator.onLine)img.src=meta.url;else{img.removeEventListener('load',onLoad);img.removeEventListener('error',onError);return markPhotoUnavailable(img)}
    img.dataset.photoLoaded='1';img.dataset.photoPage=meta.page||'';img.dataset.photoLicense=meta.license||'';img.dataset.photoArtist=meta.artist||'';img.dataset.photoTitle=meta.title||'';
  }
  function addPhotoCredit"""
app=app[:match.start()]+photo_new+app[match.end():]
app=replace_once(app,
    "  function markPhotoUnavailable(img){if(!img)return;photoQueued.delete(img);img.dataset.photoLoaded='0';const shell=img.closest('.photo-shell,.ingredient-photo-shell');shell?.classList.add('photo-unavailable');shell?.querySelector('.photo-skeleton')?.remove()}",
    "  function markPhotoUnavailable(img){if(!img)return;photoQueued.delete(img);const u=img.dataset.objectUrl;if(u){try{URL.revokeObjectURL(u)}catch{}delete img.dataset.objectUrl}img.dataset.photoLoaded='0';const shell=img.closest('.photo-shell,.ingredient-photo-shell');shell?.classList.add('photo-unavailable');shell?.querySelector('.photo-skeleton')?.remove()}",
    'photo failure cleanup')
app=replace_once(app,
    "const img=$('.detail-photo',$('#recipeDetailContent'));if(!img)return;img.removeAttribute('src');",
    "const img=$('.detail-photo',$('#recipeDetailContent'));if(!img)return;const prior=img.dataset.objectUrl;if(prior){try{URL.revokeObjectURL(prior)}catch{}delete img.dataset.objectUrl}img.removeAttribute('src');",
    'photo retry cleanup')

# HTML: truthful labels + accessibility.
index=replace_once(index,'<button class="soft-btn" data-view-link="smart">✨ Smart fill</button>','<button class="soft-btn" data-view-link="smart">✨ Kitchen Magic</button>','planner label')
index=replace_once(index,'<button class="primary-round" id="newBentoButton">＋</button>','<button class="primary-round" id="newBentoButton" aria-label="Start a new bento">＋</button>','bento aria')
index=replace_once(index,'<button class="primary-round" data-action="add-leftover">＋</button>','<button class="primary-round" data-action="add-leftover" aria-label="Add leftover">＋</button>','leftover aria')
index=replace_once(index,'<button class="icon-btn" id="shoppingModeButton" aria-label="Shopping mode">◉</button>','<button class="icon-btn" id="shoppingModeButton" aria-label="Shopping mode" aria-pressed="false">◉</button>','shopping aria')

# CSS: one clean selector surface; fix cuisine inner-border conflict; no clipped planner toolbar.
marker='/* Bento v21 QA UI normalization */'
if marker not in style:
    style=style.rstrip()+"""

/* Bento v21 QA UI normalization */
.compact-browse-select{overflow:hidden!important}
.compact-browse-select .browse-select-icon{flex:0 0 24px!important;width:24px!important;text-align:center!important}
.compact-browse-select select,.recipe-library-view .compact-browse-select .cuisine-browse-select{width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0 26px 0 0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;appearance:none!important;-webkit-appearance:none!important;color:var(--text)!important;font-weight:750!important}
.compact-browse-select .browse-select-chevron{z-index:2}
.stat-card strong{min-width:0;overflow-wrap:anywhere}
@media(max-width:520px){
  .plan-toolbar{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px!important;overflow:visible!important}
  .plan-toolbar button{width:100%!important;min-width:0!important;white-space:normal!important;line-height:1.15!important;text-align:center!important}
  .compact-browse-select{height:36px!important;min-height:36px!important;padding:0 9px!important;gap:5px!important;border-radius:11px!important}
  .compact-browse-select select,.recipe-library-view .compact-browse-select .cuisine-browse-select{font-size:11.5px!important;padding-right:24px!important}
  .recipe-library-view .recipe-browse-panel{margin-bottom:5px!important}
}
@media(max-width:370px){.stat-card strong{font-size:18px}}
"""

# PWA cache bump only; still no runtime source rewriting.
sw,n=re.subn(r"const CACHE='bento-shell-v0\.7\.\d+-v21';","const CACHE='bento-shell-v0.7.3-v21';",sw,count=1)
if n!=1:
    raise SystemExit('Service-worker cache version anchor missing')

# Manifest shortcut should describe what it actually opens.
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
for shortcut in manifest.get('shortcuts',[]):
    if shortcut.get('url')=='./index.html#recipes':
        shortcut['name']='Recipes';shortcut['short_name']='Recipes'

# Internal library metadata should match v21 behavior.
lib=json.loads(library_path.read_text(encoding='utf-8'))
if isinstance(lib.get('animeLibraries'),dict):
    lib['animeLibraries']['navigation']='Compact Anime series dropdown with All Anime plus per-series recipe counts.'
lib['navigation']='Cuisines, Meals, Desserts and Drinks use compact selectors; Games and Anime remain dedicated icon tabs.'
lib['cuisineNavigation']='Compact cuisine selector sourced from the full standard library, including user-created cuisines.'
lib['cacheFix']='v21 uses a conventional versioned shell cache with network-first navigation; the service worker no longer rewrites app or HTML source at runtime.'
lib['performance']='Recipe cards render in batches of 20; card photos are off by default, remote photos are lazy/on-demand, and temporary object URLs are released after image load.'
lib['generatedAt']='2026-08-13T16:32:00+08:00'

# In-memory sanity checks before writing.
assert 'That section could not refresh' not in app
assert "filter==='NeverCooked'" in app
assert "defaultLeftoverDays" in app
assert "Side Dishes','Soups & Hot Pots" in app
assert "aria-current','page'" in app
assert 'URL.revokeObjectURL' in app
assert '</span></span><button data-grocery-delete=' not in app
assert index.count('data-recipe-browse=') >= 6
assert marker in style
assert "bento-shell-v0.7.3-v21" in sw

app_path.write_text(app,encoding='utf-8')
style_path.write_text(style+'\n',encoding='utf-8')
index_path.write_text(index,encoding='utf-8')
sw_path.write_text(sw,encoding='utf-8')
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
library_path.write_text(json.dumps(lib,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Bento v21 reviewed QA patch applied to working tree.')
