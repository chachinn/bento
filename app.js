(() => {
  'use strict';

  const STORAGE_KEY = 'bento.app.state.v1';
  const VERSION = 1;
  const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
  const THEMES = {
    blossom: { label: 'Blossom', accent: '#f28aa4', strong: '#df6787', soft: '#ffd9e2', bg: '#fff8f5', surface2: '#fff1f0' },
    peach: { label: 'Peach', accent: '#ef9b7b', strong: '#d77d5f', soft: '#ffe0d3', bg: '#fff9f4', surface2: '#fff0e8' },
    matcha: { label: 'Matcha', accent: '#8eaa7d', strong: '#6f8d61', soft: '#dce8d6', bg: '#fbfaf5', surface2: '#f0f5eb' },
    lavender: { label: 'Lavender', accent: '#b79bd4', strong: '#9274b2', soft: '#eadff4', bg: '#fcf9ff', surface2: '#f4eef9' },
    sakura: { label: 'Sakura', accent: '#f4a9bb', strong: '#dc7894', soft: '#fde0e7', bg: '#fffafc', surface2: '#fff0f4' }
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const el = (tag, cls = '', text = '') => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== '') node.textContent = text;
    return node;
  };
  const uid = (prefix = 'id') => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function defaultState() {
    return {
      version: VERSION,
      recipes: [],
      pantry: [],
      grocery: [],
      mealPlan: {},
      history: [],
      settings: {
        displayName: '', defaultServings: 2, units: 'metric', weekStart: 'monday',
        diet: '', allergies: '', theme: 'blossom'
      }
    };
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return parsed && typeof parsed === 'object' ? { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...(parsed.settings || {}) } } : defaultState();
    } catch { return defaultState(); }
  }

  let state = loadState();
  let currentView = 'home';
  let previousView = 'home';
  let weekOffset = 0;
  let recipeFilter = 'All';
  let pantryFilter = 'All';
  let pantrySort = 'expiry';
  let deferredInstallPrompt = null;
  let wakeLock = null;
  let cookingTimer = null;
  let timerSeconds = 0;
  let cookingSession = null;

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
  }

  function toast(message) {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => node.classList.remove('show'), 1800);
  }

  function dateKey(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function startOfWeek(date = new Date()) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay();
    const mondayMode = state.settings.weekStart !== 'sunday';
    const diff = mondayMode ? (day === 0 ? -6 : 1 - day) : -day;
    d.setDate(d.getDate() + diff + weekOffset * 7);
    return d;
  }

  function weekDates() {
    const start = startOfWeek();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
  }

  function formatShortDate(d) { return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
  function formatLongDate(d) { return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }); }
  function formatDateTime(iso) { return new Date(iso).toLocaleString(undefined, { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }); }

  function applyTheme() {
    const t = THEMES[state.settings.theme] || THEMES.blossom;
    const r = document.documentElement.style;
    r.setProperty('--accent', t.accent); r.setProperty('--accent-strong', t.strong); r.setProperty('--accent-soft', t.soft); r.setProperty('--bg', t.bg); r.setProperty('--surface-2', t.surface2);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.accent);
  }

  function ingredientName(line) {
    return String(line || '')
      .toLowerCase()
      .replace(/\([^)]*\)/g, ' ')
      .replace(/^\s*[\d¼½¾⅓⅔⅛⅜⅝⅞.,/\-]+\s*/u, '')
      .replace(/^\s*(cups?|cup|tbsp|tablespoons?|tsp|teaspoons?|grams?|g|kg|ml|l|liters?|litres?|oz|ounces?|lbs?|pounds?|pcs?|pieces?|cans?|packs?|slices?|cloves?|heads?|bunch(?:es)?|pinch(?:es)?|dash(?:es)?)\b\s*/i, '')
      .replace(/\b(chopped|diced|minced|sliced|optional|divided|to taste|for serving|fresh|frozen)\b/g, ' ')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function ingredientMatches(a, b) {
    const x = ingredientName(a), y = ingredientName(b);
    if (!x || !y) return false;
    return x === y || x.includes(y) || y.includes(x) || x.split(' ').some(w => w.length > 3 && y.includes(w));
  }

  function groceryCategory(text) {
    const s = ingredientName(text);
    if (/apple|banana|berry|strawber|lemon|lime|orange|tomato|onion|garlic|carrot|cabbage|spinach|lettuce|broccoli|pepper|potato|mushroom|cucumber|ginger|scallion|green onion|herb/.test(s)) return 'Produce';
    if (/chicken|beef|pork|fish|salmon|tuna|shrimp|tofu|egg/.test(s)) return 'Protein';
    if (/milk|cream|cheese|butter|yogurt/.test(s)) return 'Dairy & Eggs';
    if (/rice|flour|sugar|salt|oil|sauce|vinegar|noodle|pasta|bread|crumb|miso|nori|spice|stock|broth/.test(s)) return 'Pantry';
    return 'Other';
  }

  function getRecipe(id) { return state.recipes.find(r => r.id === id); }
  function totalTime(recipe) { return Number(recipe.prep || 0) + Number(recipe.cook || 0); }
  function foodEmoji(recipe) {
    const s = `${recipe.title} ${recipe.category} ${recipe.cuisine}`.toLowerCase();
    if (/dessert|cake|mochi|daifuku|sweet/.test(s)) return '🍡';
    if (/soup|ramen|miso/.test(s)) return '🍜';
    if (/rice|bento|don|onigiri/.test(s)) return '🍱';
    if (/breakfast|egg|omelet|omelette/.test(s)) return '🍳';
    if (/salad|vegetarian|veggie/.test(s)) return '🥗';
    if (/fish|salmon|tuna/.test(s)) return '🐟';
    if (/drink|tea|coffee/.test(s)) return '🍵';
    return '🍽️';
  }

  function navigate(view, pushHash = true) {
    if (!document.querySelector(`.view[data-view="${view}"]`)) view = 'home';
    if (currentView !== view) previousView = currentView;
    currentView = view;
    $$('.view').forEach(v => v.classList.toggle('active', v.dataset.view === view));
    $$('.bottom-nav button').forEach(b => b.classList.toggle('active', b.dataset.nav === view));
    if (pushHash) history.replaceState(null, '', `#${view}`);
    window.scrollTo(0,0);
    $('#mainContent')?.focus({preventScroll:true});
    renderAll();
  }

  function emptyCard(text, buttonText = '', action = '') {
    return `<div class="empty-card">${escapeHTML(text)}${buttonText ? `<br><button data-action="${action}">${escapeHTML(buttonText)}</button>` : ''}</div>`;
  }

  function renderGreeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const name = state.settings.displayName.trim();
    $('#greetingText').textContent = `${greeting}${name ? `, ${name}` : ''} ✿`;
  }

  function renderToday() {
    const box = $('#todayMeals');
    const today = dateKey(new Date());
    const plan = state.mealPlan[today] || {};
    box.innerHTML = MEAL_SLOTS.map(slot => {
      const item = plan[slot];
      let title = 'Nothing planned'; let sub = 'Tap to add';
      if (item?.recipeId) {
        const r = getRecipe(item.recipeId); if (r) { title = r.title; sub = `${totalTime(r)} min · ${r.servings || 2} servings`; }
      } else if (item?.custom) { title = item.custom; sub = 'Custom meal'; }
      return `<button class="meal-card" data-meal-date="${today}" data-meal-slot="${slot}"><span class="meal-slot">${slot}</span><span class="meal-main"><b>${escapeHTML(title)}</b><small>${escapeHTML(sub)}</small></span><span class="arrow">›</span></button>`;
    }).join('');
  }

  function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(`${dateStr}T00:00:00`);
    return Math.ceil((d - today) / 86400000);
  }

  function renderAttention() {
    const expiring = state.pantry.filter(p => daysUntil(p.expiry) >= 0 && daysUntil(p.expiry) <= 3).sort((a,b)=>daysUntil(a.expiry)-daysUntil(b.expiry));
    const low = state.pantry.filter(p => p.lowStock);
    const unchecked = state.grocery.filter(g => !g.checked).length;
    const cards = [];
    if (expiring.length) cards.push(`<button class="attention-card" data-nav="pantry"><span class="dot"></span><div><b>${expiring.length} item${expiring.length>1?'s':''} expiring soon</b><small>${escapeHTML(expiring.slice(0,3).map(x=>x.name).join(', '))}</small></div><span>›</span></button>`);
    if (low.length) cards.push(`<button class="attention-card" data-nav="pantry"><span class="dot"></span><div><b>${low.length} low-stock item${low.length>1?'s':''}</b><small>Restock when convenient</small></div><span>›</span></button>`);
    if (unchecked) cards.push(`<button class="attention-card" data-view-link="grocery"><span class="dot"></span><div><b>${unchecked} grocery item${unchecked>1?'s':''} waiting</b><small>Open your shopping list</small></div><span>›</span></button>`);
    $('#attentionCards').innerHTML = cards.join('') || emptyCard('Nothing urgent right now. Your kitchen is looking tidy ✿');
    $('#groceryCountQuick').textContent = `${unchecked} item${unchecked===1?'':'s'}`;
    $('#pantryCountQuick').textContent = `${state.pantry.length} item${state.pantry.length===1?'':'s'}`;
  }

  function recipeMini(r) {
    return `<button class="mini-recipe" data-recipe-id="${r.id}"><b>${foodEmoji(r)} ${escapeHTML(r.title)}</b><small>${totalTime(r)} min · ${escapeHTML(r.category || 'Other')}</small></button>`;
  }

  function renderHomeFavorites() {
    const favs = state.recipes.filter(r => r.favorite).slice(0,6);
    $('#homeFavorites').innerHTML = favs.length ? favs.map(recipeMini).join('') : emptyCard('Heart recipes you love and they’ll appear here.', 'Browse recipes', 'go-recipes');
  }

  function renderPlan() {
    const dates = weekDates();
    $('#weekLabel').textContent = `${formatShortDate(dates[0])} – ${formatShortDate(dates[6])}`;
    const todayKey = dateKey(new Date());
    $('#weekDays').innerHTML = dates.map(d => `<div class="day-pill ${dateKey(d)===todayKey?'today':''}"><b>${d.toLocaleDateString(undefined,{weekday:'short'})}</b><span>${d.getDate()}</span></div>`).join('');
    $('#mealPlanGrid').innerHTML = dates.map(d => {
      const key = dateKey(d), plan = state.mealPlan[key] || {};
      return `<article class="plan-day"><div class="plan-day-head"><b>${escapeHTML(formatLongDate(d))}</b><small>${key===todayKey?'Today':''}</small></div>${MEAL_SLOTS.map(slot => {
        const item = plan[slot]; let main='Add meal', sub='';
        if (item?.recipeId) { const r=getRecipe(item.recipeId); if(r){main=r.title;sub=`${totalTime(r)} min`;}}
        else if(item?.custom){main=item.custom;sub='Custom meal'}
        return `<button class="plan-slot" data-meal-date="${key}" data-meal-slot="${slot}"><span>${slot}</span><div><b>${escapeHTML(main)}</b>${sub?`<small>${escapeHTML(sub)}</small>`:''}</div><i class="plan-add">${item?'›':'+'}</i></button>`;
      }).join('')}</article>`;
    }).join('');
  }

  function recipeCard(r) {
    return `<article class="recipe-card"><button class="heart-btn" data-favorite="${r.id}" aria-label="Favorite">${r.favorite?'♥':'♡'}</button><button class="recipe-open" data-recipe-id="${r.id}"><div class="thumb">${foodEmoji(r)}</div><div class="body"><b>${escapeHTML(r.title)}</b><small>${totalTime(r)} min · ${r.servings||2} servings</small><div class="badge-row"><span class="badge">${escapeHTML(r.category||'Other')}</span>${r.cuisine?`<span class="badge">${escapeHTML(r.cuisine)}</span>`:''}${r.collection?`<span class="badge">${escapeHTML(r.collection)}</span>`:''}</div></div></button></article>`;
  }

  function renderRecipeFilters() {
    const categories = ['All','Favorites','Quick', ...[...new Set(state.recipes.map(r=>r.category).filter(Boolean))]];
    $('#recipeFilters').innerHTML = categories.map(c => `<button class="chip ${recipeFilter===c?'active':''}" data-recipe-filter="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
  }

  function filteredRecipes() {
    const q = ($('#recipeSearch')?.value || '').trim().toLowerCase();
    let list = [...state.recipes];
    if (recipeFilter === 'Favorites') list = list.filter(r=>r.favorite);
    else if (recipeFilter === 'Quick') list = list.filter(r=>totalTime(r)<=30);
    else if (recipeFilter !== 'All') list = list.filter(r=>r.category===recipeFilter);
    if (q) list = list.filter(r => `${r.title} ${r.cuisine} ${r.category} ${r.collection} ${(r.ingredients||[]).join(' ')} ${r.notes||''}`.toLowerCase().includes(q));
    const sort = $('#recipeSort')?.value || 'newest';
    if (sort==='name') list.sort((a,b)=>a.title.localeCompare(b.title));
    else if (sort==='quick') list.sort((a,b)=>totalTime(a)-totalTime(b));
    else if (sort==='favorite') list.sort((a,b)=>Number(b.favorite)-Number(a.favorite) || a.title.localeCompare(b.title));
    else list.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
    return list;
  }

  function renderRecipes() {
    renderRecipeFilters();
    const list = filteredRecipes();
    $('#recipeGrid').innerHTML = list.length ? list.map(recipeCard).join('') : emptyCard(state.recipes.length ? 'No recipes match this search.' : 'Your recipe book is empty. Add your first recipe to begin.', 'Add recipe', 'add-recipe');
    $('#favoritesGrid').innerHTML = state.recipes.filter(r=>r.favorite).length ? state.recipes.filter(r=>r.favorite).map(recipeCard).join('') : emptyCard('No favorites yet. Tap ♡ on a recipe you love.', 'Browse recipes', 'go-recipes');
  }

  function renderPantryFilters() {
    const options = ['All','Expiring Soon','Low Stock','Fridge','Freezer','Pantry','Spice Rack','Other'];
    $('#pantryFilters').innerHTML = options.map(c => `<button class="chip ${pantryFilter===c?'active':''}" data-pantry-filter="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join('');
  }

  function pantryEmoji(item) {
    const s=item.name.toLowerCase();
    if(/egg/.test(s)) return '🥚'; if(/milk/.test(s)) return '🥛'; if(/rice/.test(s)) return '🍚'; if(/fruit|apple|berry|straw/.test(s)) return '🍓'; if(/veget|carrot|broccoli|onion|cabbage|spinach/.test(s)) return '🥕'; if(/chicken|meat|beef|pork/.test(s)) return '🍗'; if(/fish|salmon|tuna/.test(s)) return '🐟'; return '🥫';
  }

  function renderPantry() {
    renderPantryFilters();
    const q = ($('#pantrySearch')?.value || '').trim().toLowerCase();
    let list = state.pantry.filter(p => !q || `${p.name} ${p.location}`.toLowerCase().includes(q));
    if (pantryFilter==='Expiring Soon') list=list.filter(p=>daysUntil(p.expiry)>=0&&daysUntil(p.expiry)<=5);
    else if (pantryFilter==='Low Stock') list=list.filter(p=>p.lowStock);
    else if (pantryFilter!=='All') list=list.filter(p=>p.location===pantryFilter);
    if (pantrySort==='expiry') list.sort((a,b)=>(daysUntil(a.expiry)-daysUntil(b.expiry)) || a.name.localeCompare(b.name));
    else list.sort((a,b)=>a.name.localeCompare(b.name));
    $('#pantrySortButton').textContent = pantrySort==='expiry' ? 'Expiry' : 'A–Z';
    $('#pantryList').innerHTML = list.length ? list.map(p=>{
      const due=daysUntil(p.expiry); let status='';
      if(Number.isFinite(due)){ if(due<0) status='<span class="status-pill warn">Expired</span>'; else if(due<=3) status=`<span class="status-pill warn">${due===0?'Today':`${due}d left`}</span>`; else status=`<span class="status-pill">${due}d left</span>`; }
      if(p.lowStock) status += '<span class="status-pill warn">Low stock</span>';
      if(p.staple) status += '<span class="status-pill">Staple</span>';
      return `<button class="list-card" data-pantry-id="${p.id}"><span class="emoji">${pantryEmoji(p)}</span><span class="content"><b>${escapeHTML(p.name)}</b><small>${escapeHTML(`${p.quantity ?? ''} ${p.unit||''}`.trim() || 'Quantity not set')} · ${escapeHTML(p.location)}</small>${status}</span><span class="meta">›</span></button>`;
    }).join('') : emptyCard(state.pantry.length ? 'No pantry items match this filter.' : 'Your pantry is empty. Add what you already have at home.', 'Add pantry item', 'add-pantry');
  }

  function renderGrocery() {
    const unchecked=state.grocery.filter(g=>!g.checked).length, checked=state.grocery.length-unchecked;
    $('#groceryUnchecked').textContent=unchecked; $('#groceryChecked').textContent=checked;
    const groups={};
    [...state.grocery].sort((a,b)=>Number(a.checked)-Number(b.checked)||a.text.localeCompare(b.text)).forEach(g=>{const cat=g.category||groceryCategory(g.text);(groups[cat] ||= []).push(g)});
    const order=['Produce','Protein','Dairy & Eggs','Pantry','Other'];
    $('#groceryList').innerHTML = state.grocery.length ? order.filter(k=>groups[k]?.length).map(cat=>`<section class="grocery-group"><h3>${cat}</h3>${groups[cat].map(g=>`<div class="grocery-item ${g.checked?'checked':''}"><input type="checkbox" data-grocery-check="${g.id}" ${g.checked?'checked':''} aria-label="Check ${escapeHTML(g.text)}"><span>${escapeHTML(g.text)}</span><button data-grocery-delete="${g.id}" aria-label="Delete">×</button></div>`).join('')}</section>`).join('') : emptyCard('Your grocery list is empty. Add an item or generate one from this week’s meal plan.');
  }

  function pantryAvailableNames(extra = []) {
    return [...state.pantry.map(p=>p.name), ...state.pantry.filter(p=>p.staple).map(p=>p.name), ...extra].filter(Boolean);
  }

  function recipeMatch(recipe, extra = []) {
    const available=pantryAvailableNames(extra);
    const ingredients=(recipe.ingredients||[]).filter(Boolean);
    const missing=ingredients.filter(i=>!available.some(a=>ingredientMatches(i,a)));
    const matched=ingredients.length-missing.length;
    return { matched, total:ingredients.length, missing, percent: ingredients.length ? Math.round(matched/ingredients.length*100) : 0 };
  }

  function renderCookMatches() {
    const extras=($('#customCookIngredients')?.value||'').split(',').map(s=>s.trim()).filter(Boolean);
    const results=state.recipes.map(r=>({recipe:r,...recipeMatch(r,extras)})).sort((a,b)=>b.percent-a.percent||a.missing.length-b.missing.length||totalTime(a.recipe)-totalTime(b.recipe));
    $('#cookMatchList').innerHTML = results.length ? results.map(x=>`<article class="match-card"><div class="match-card-head"><div><b>${foodEmoji(x.recipe)} ${escapeHTML(x.recipe.title)}</b><small class="muted">${x.matched}/${x.total} ingredients available · ${totalTime(x.recipe)} min</small></div><strong>${x.percent}%</strong></div><div class="match-bar"><i style="width:${x.percent}%"></i></div><div class="missing">${x.missing.length?`Missing: ${escapeHTML(x.missing.join(', '))}`:'Perfect match — you have everything listed.'}</div><div class="action-row" style="margin-top:10px;margin-bottom:0"><button class="soft-btn" data-recipe-id="${x.recipe.id}">View</button>${x.missing.length?`<button class="soft-btn" data-add-missing="${x.recipe.id}">Add missing</button>`:''}</div></article>`).join('') : emptyCard('Add some recipes first, then Bento can match them to your pantry.', 'Add recipe', 'add-recipe');
  }

  function renderHistory() {
    $('#historyList').innerHTML = state.history.length ? [...state.history].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(h=>{const r=getRecipe(h.recipeId);return `<button class="list-card" ${r?`data-recipe-id="${r.id}"`:''}><span class="emoji">${r?foodEmoji(r):'🍽️'}</span><span class="content"><b>${escapeHTML(r?.title || h.title || 'Recipe')}</b><small>${escapeHTML(formatDateTime(h.date))}</small></span><span class="meta">${h.rating?`${'★'.repeat(h.rating)}`:'Cooked'}</span></button>`}).join('') : emptyCard('When you finish cooking a recipe, it will be remembered here.');
  }

  function renderSettings() {
    $('#displayNameInput').value=state.settings.displayName||'';
    $('#servingsInput').value=state.settings.defaultServings||2;
    $('#unitsSelect').value=state.settings.units||'metric';
    $('#weekStartSelect').value=state.settings.weekStart||'monday';
    $('#dietInput').value=state.settings.diet||'';
    $('#allergyInput').value=state.settings.allergies||'';
    $('#themePicker').innerHTML=Object.entries(THEMES).map(([key,t])=>`<button class="theme-swatch ${state.settings.theme===key?'active':''}" data-theme="${key}" style="background:linear-gradient(135deg,${t.soft},${t.accent})"><span>${t.label}</span></button>`).join('');
  }

  function renderAll() {
    applyTheme(); renderGreeting(); renderToday(); renderAttention(); renderHomeFavorites(); renderPlan(); renderRecipes(); renderPantry(); renderGrocery(); renderCookMatches(); renderHistory(); renderSettings();
  }

  function openDialog(dialog) { if (!dialog.open) dialog.showModal(); }
  function closeDialogs() { $$('dialog[open]').forEach(d=>d.close()); stopCookingTimer(false); }

  function openRecipeForm(recipe = null) {
    const form=$('#recipeForm'); form.reset();
    $('#recipeId').value=recipe?.id||''; $('#recipeDialogTitle').textContent=recipe?'Edit Recipe':'Add Recipe';
    $('#recipeTitleInput').value=recipe?.title||''; $('#recipeCategoryInput').value=recipe?.category||'Dinner'; $('#recipeCuisineInput').value=recipe?.cuisine||'';
    $('#recipePrepInput').value=recipe?.prep??0; $('#recipeCookInput').value=recipe?.cook??0; $('#recipeServingsInput').value=recipe?.servings||state.settings.defaultServings||2;
    $('#recipeIngredientsInput').value=(recipe?.ingredients||[]).join('\n'); $('#recipeStepsInput').value=(recipe?.steps||[]).join('\n'); $('#recipeNotesInput').value=recipe?.notes||''; $('#recipeCollectionInput').value=recipe?.collection||'';
    openDialog($('#recipeDialog')); setTimeout(()=>$('#recipeTitleInput').focus(),100);
  }

  function openPantryForm(item = null) {
    $('#pantryForm').reset(); $('#pantryId').value=item?.id||''; $('#pantryDialogTitle').textContent=item?'Edit Pantry Item':'Add Pantry Item';
    $('#pantryNameInput').value=item?.name||''; $('#pantryQtyInput').value=item?.quantity??1; $('#pantryUnitInput').value=item?.unit||''; $('#pantryLocationInput').value=item?.location||'Pantry'; $('#pantryExpiryInput').value=item?.expiry||''; $('#pantryStapleInput').checked=!!item?.staple; $('#pantryLowInput').checked=!!item?.lowStock;
    openDialog($('#pantryDialog')); setTimeout(()=>$('#pantryNameInput').focus(),100);
  }

  function openMealForm(date, slot) {
    const current=state.mealPlan[date]?.[slot];
    $('#mealDateInput').value=date; $('#mealSlotInput').value=slot; $('#mealDialogDate').textContent=new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'}); $('#mealDialogTitle').textContent=`${slot[0].toUpperCase()+slot.slice(1)}`;
    $('#mealRecipeSelect').innerHTML='<option value="">Choose a recipe…</option>'+[...state.recipes].sort((a,b)=>a.title.localeCompare(b.title)).map(r=>`<option value="${r.id}">${escapeHTML(r.title)}</option>`).join('');
    $('#mealRecipeSelect').value=current?.recipeId||''; $('#mealCustomInput').value=current?.custom||''; $('#removeMealButton').style.visibility=current?'visible':'hidden'; openDialog($('#mealDialog'));
  }

  function openRecipeDetail(id) {
    const r=getRecipe(id); if(!r) return;
    $('#recipeDetailContent').innerHTML=`<div class="sheet-handle"></div><div class="dialog-title"><div><p class="eyebrow">${escapeHTML(r.cuisine||'Recipe')}</p><h2>${escapeHTML(r.title)}</h2></div><button class="icon-btn close-dialog">×</button></div><div class="detail-hero"><div class="food-emoji">${foodEmoji(r)}</div><div class="detail-meta"><span class="badge">${totalTime(r)} min</span><span class="badge">${r.servings||2} servings</span><span class="badge">${escapeHTML(r.category||'Other')}</span>${r.collection?`<span class="badge">${escapeHTML(r.collection)}</span>`:''}</div></div><div class="detail-section"><h3>Ingredients</h3>${(r.ingredients||[]).length?r.ingredients.map(i=>`<div class="ingredient-line">○ ${escapeHTML(i)}</div>`).join(''):'<span class="muted">No ingredients added.</span>'}</div><div class="detail-section"><h3>Steps</h3>${(r.steps||[]).length?r.steps.map((s,i)=>`<div class="step-line"><b>${i+1}.</b> ${escapeHTML(s)}</div>`).join(''):'<span class="muted">No steps added.</span>'}</div>${r.notes?`<div class="detail-section"><h3>Notes</h3><p>${escapeHTML(r.notes)}</p></div>`:''}<div class="detail-actions"><button class="soft-btn" data-detail-fav="${r.id}">${r.favorite?'♥ Favorited':'♡ Favorite'}</button><button class="soft-btn" data-detail-edit="${r.id}">Edit</button><button class="soft-btn" data-detail-grocery="${r.id}">Add ingredients</button><button class="soft-btn" data-detail-plan="${r.id}">Plan this</button><button class="primary-btn" data-start-cook="${r.id}">Start cooking</button><button class="danger-btn" data-detail-delete="${r.id}">Delete recipe</button></div>`;
    openDialog($('#recipeDetailDialog'));
  }

  async function requestWakeLock() {
    try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch {}
  }
  async function releaseWakeLock() { try { await wakeLock?.release(); } catch {} wakeLock=null; }

  function startCooking(id) {
    const recipe=getRecipe(id); if(!recipe) return;
    cookingSession={recipeId:id,step:0}; timerSeconds=0; stopCookingTimer(false); requestWakeLock(); renderCookingMode();
  }

  function renderCookingMode() {
    const r=getRecipe(cookingSession?.recipeId); if(!r) return;
    const steps=(r.steps||[]).length?r.steps:['Enjoy making your recipe!'];
    const i=clamp(cookingSession.step,0,steps.length-1); cookingSession.step=i;
    $('#recipeDetailContent').innerHTML=`<div class="cook-mode"><div class="sheet-handle"></div><div class="dialog-title"><div><p class="eyebrow">Cooking mode · ${i+1}/${steps.length}</p><h2>${escapeHTML(r.title)}</h2></div><button class="icon-btn close-dialog">×</button></div><div class="cook-progress"><i style="width:${((i+1)/steps.length)*100}%"></i></div><div class="cook-step">${escapeHTML(steps[i])}</div><div class="timer-box"><strong id="timerDisplay">${formatTimer(timerSeconds)}</strong><div class="action-row" style="justify-content:center;margin-top:8px"><button class="soft-btn" data-timer-add="60">+1 min</button><button class="soft-btn" data-timer-add="300">+5 min</button><button class="soft-btn" data-timer-toggle>${cookingTimer?'Pause':'Start timer'}</button><button class="soft-btn" data-timer-reset>Reset</button></div></div><div class="detail-actions"><button class="soft-btn" data-cook-prev ${i===0?'disabled':''}>‹ Previous</button><button class="soft-btn" data-cook-next>${i===steps.length-1?'Stay here':'Next ›'}</button><button class="primary-btn" data-cook-finish>Finish cooking</button></div></div>`;
  }

  function formatTimer(sec) { const m=Math.floor(sec/60), s=sec%60; return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
  function startCookingTimer() {
    if(cookingTimer) return; if(timerSeconds<=0) timerSeconds=60;
    cookingTimer=setInterval(()=>{ timerSeconds=Math.max(0,timerSeconds-1); const d=$('#timerDisplay'); if(d)d.textContent=formatTimer(timerSeconds); if(timerSeconds===0){stopCookingTimer(false);toast('Timer finished ✿'); if(navigator.vibrate) navigator.vibrate([120,80,120]); renderCookingMode();}},1000); renderCookingMode();
  }
  function stopCookingTimer(render=true){ if(cookingTimer){clearInterval(cookingTimer);cookingTimer=null;} if(render&&cookingSession)renderCookingMode(); }

  function finishCooking() {
    const r=getRecipe(cookingSession?.recipeId); if(!r) return;
    state.history.push({id:uid('history'),recipeId:r.id,title:r.title,date:new Date().toISOString(),rating:0});
    saveState(); cookingSession=null; stopCookingTimer(false); releaseWakeLock(); $('#recipeDetailDialog').close(); toast('Saved to cooking history ♡');
  }

  function addRecipeIngredientsToGrocery(recipe, missingOnly=false) {
    const pantry=state.pantry.map(p=>p.name); let lines=(recipe.ingredients||[]);
    if(missingOnly) lines=lines.filter(i=>!pantry.some(p=>ingredientMatches(i,p)));
    let added=0;
    lines.forEach(line=>{const name=ingredientName(line)||line.trim(); if(!name)return; const exists=state.grocery.find(g=>ingredientMatches(g.text,name)&&!g.checked); if(!exists){state.grocery.push({id:uid('g'),text:line.trim(),checked:false,category:groceryCategory(line),source:`recipe:${recipe.id}`});added++;}});
    saveState(); toast(added?`${added} item${added===1?'':'s'} added to groceries`:'Everything is already listed');
  }

  function generateGroceriesFromWeek() {
    const recipes=[];
    weekDates().forEach(d=>{const plan=state.mealPlan[dateKey(d)]||{};MEAL_SLOTS.forEach(slot=>{if(plan[slot]?.recipeId){const r=getRecipe(plan[slot].recipeId);if(r)recipes.push(r)}})});
    if(!recipes.length){toast('Plan at least one saved recipe this week first');return;}
    const pantryNames=state.pantry.map(p=>p.name); let added=0;
    recipes.flatMap(r=>r.ingredients||[]).forEach(line=>{const name=ingredientName(line)||line.trim();if(!name)return;if(pantryNames.some(p=>ingredientMatches(p,name)))return;const exists=state.grocery.find(g=>ingredientMatches(g.text,name)&&!g.checked);if(!exists){state.grocery.push({id:uid('g'),text:line.trim(),checked:false,category:groceryCategory(line),source:'week-plan'});added++;}});
    saveState(); toast(added?`${added} grocery item${added===1?'':'s'} added`:'Your current pantry/list already covers the plan');
  }

  async function shareGroceries() {
    const items=state.grocery.filter(g=>!g.checked); if(!items.length){toast('Nothing unchecked to share');return;}
    const text=['Bento Grocery List',...items.map(g=>`☐ ${g.text}`)].join('\n');
    try { if(navigator.share) await navigator.share({title:'Bento Grocery List',text}); else {await navigator.clipboard.writeText(text);toast('Grocery list copied');} } catch {}
  }

  function exportBackup() {
    const blob=new Blob([JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`bento-backup-${dateKey(new Date())}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);toast('Backup exported');
  }

  function importBackup(file) {
    if(!file)return; const reader=new FileReader(); reader.onload=()=>{try{const data=JSON.parse(reader.result); if(!data||typeof data!=='object')throw new Error(); state={...defaultState(),...data,settings:{...defaultState().settings,...(data.settings||{})}};saveState();toast('Backup restored');navigate('home');}catch{toast('That backup file could not be read');}};reader.readAsText(file);
  }

  function quickAddGrocery() {
    closeDialogs(); navigate('grocery'); setTimeout(()=>$('#groceryAddInput').focus(),100);
  }

  function handleAction(action) {
    if(action==='add-recipe'){closeDialogs();openRecipeForm();}
    else if(action==='add-pantry'){closeDialogs();openPantryForm();}
    else if(action==='add-grocery'){quickAddGrocery();}
    else if(action==='go-recipes'){navigate('recipes');}
  }

  // Delegated clicks
  document.addEventListener('click', e => {
    const nav=e.target.closest('[data-nav]'); if(nav){navigate(nav.dataset.nav);return;}
    const view=e.target.closest('[data-view-link]'); if(view){navigate(view.dataset.viewLink);return;}
    const back=e.target.closest('[data-back]'); if(back){navigate(['home','plan','recipes','pantry','more'].includes(previousView)?previousView:'more');return;}
    const act=e.target.closest('[data-action]'); if(act){handleAction(act.dataset.action);return;}
    const close=e.target.closest('.close-dialog'); if(close){closeDialogs();return;}

    const meal=e.target.closest('[data-meal-date][data-meal-slot]'); if(meal){openMealForm(meal.dataset.mealDate,meal.dataset.mealSlot);return;}
    const fav=e.target.closest('[data-favorite]'); if(fav){e.preventDefault();e.stopPropagation();const r=getRecipe(fav.dataset.favorite);if(r){r.favorite=!r.favorite;saveState();}return;}
    const rec=e.target.closest('[data-recipe-id]'); if(rec){openRecipeDetail(rec.dataset.recipeId);return;}
    const pantry=e.target.closest('[data-pantry-id]'); if(pantry){openPantryForm(state.pantry.find(p=>p.id===pantry.dataset.pantryId));return;}
    const rf=e.target.closest('[data-recipe-filter]'); if(rf){recipeFilter=rf.dataset.recipeFilter;renderRecipes();return;}
    const pf=e.target.closest('[data-pantry-filter]'); if(pf){pantryFilter=pf.dataset.pantryFilter;renderPantry();return;}
    const theme=e.target.closest('[data-theme]'); if(theme){state.settings.theme=theme.dataset.theme;saveState();return;}

    const gc=e.target.closest('[data-grocery-delete]'); if(gc){state.grocery=state.grocery.filter(g=>g.id!==gc.dataset.groceryDelete);saveState();return;}
    const miss=e.target.closest('[data-add-missing]'); if(miss){const r=getRecipe(miss.dataset.addMissing);if(r)addRecipeIngredientsToGrocery(r,true);return;}

    const df=e.target.closest('[data-detail-fav]'); if(df){const r=getRecipe(df.dataset.detailFav);if(r){r.favorite=!r.favorite;saveState();openRecipeDetail(r.id);}return;}
    const de=e.target.closest('[data-detail-edit]'); if(de){const r=getRecipe(de.dataset.detailEdit);$('#recipeDetailDialog').close();openRecipeForm(r);return;}
    const dg=e.target.closest('[data-detail-grocery]'); if(dg){const r=getRecipe(dg.dataset.detailGrocery);if(r)addRecipeIngredientsToGrocery(r,false);return;}
    const dp=e.target.closest('[data-detail-plan]'); if(dp){const r=getRecipe(dp.dataset.detailPlan);if(!r)return;$('#recipeDetailDialog').close();navigate('plan');toast('Tap a meal slot to add this recipe');return;}
    const dd=e.target.closest('[data-detail-delete]'); if(dd){if(confirm('Delete this recipe? Meal-plan references will be left empty.')){const id=dd.dataset.detailDelete;state.recipes=state.recipes.filter(r=>r.id!==id);Object.values(state.mealPlan).forEach(day=>MEAL_SLOTS.forEach(slot=>{if(day?.[slot]?.recipeId===id)delete day[slot]}));saveState();$('#recipeDetailDialog').close();toast('Recipe deleted');}return;}
    const sc=e.target.closest('[data-start-cook]'); if(sc){startCooking(sc.dataset.startCook);return;}

    if(e.target.closest('[data-cook-prev]')){cookingSession.step--;renderCookingMode();return;}
    if(e.target.closest('[data-cook-next]')){const r=getRecipe(cookingSession.recipeId);cookingSession.step=Math.min((r.steps||[]).length-1,cookingSession.step+1);renderCookingMode();return;}
    if(e.target.closest('[data-cook-finish]')){finishCooking();return;}
    const ta=e.target.closest('[data-timer-add]'); if(ta){timerSeconds+=Number(ta.dataset.timerAdd);renderCookingMode();return;}
    if(e.target.closest('[data-timer-toggle]')){cookingTimer?stopCookingTimer():startCookingTimer();return;}
    if(e.target.closest('[data-timer-reset]')){timerSeconds=0;stopCookingTimer();return;}
  });

  document.addEventListener('change', e => {
    const check=e.target.closest('[data-grocery-check]'); if(check){const g=state.grocery.find(x=>x.id===check.dataset.groceryCheck);if(g){g.checked=check.checked;saveState();}return;}
  });

  $('#recipeForm').addEventListener('submit', e => {
    e.preventDefault();
    const id=$('#recipeId').value; const existing=id?getRecipe(id):null;
    const recipe={id:id||uid('recipe'),title:$('#recipeTitleInput').value.trim(),category:$('#recipeCategoryInput').value,cuisine:$('#recipeCuisineInput').value.trim(),prep:Number($('#recipePrepInput').value)||0,cook:Number($('#recipeCookInput').value)||0,servings:Number($('#recipeServingsInput').value)||2,ingredients:$('#recipeIngredientsInput').value.split('\n').map(s=>s.trim()).filter(Boolean),steps:$('#recipeStepsInput').value.split('\n').map(s=>s.trim()).filter(Boolean),notes:$('#recipeNotesInput').value.trim(),collection:$('#recipeCollectionInput').value.trim(),favorite:existing?.favorite||false,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(!recipe.title){toast('Give the recipe a name');return;}
    if(existing) Object.assign(existing,recipe); else state.recipes.push(recipe);
    saveState(); $('#recipeDialog').close(); toast(existing?'Recipe updated':'Recipe saved'); navigate('recipes');
  });

  $('#pantryForm').addEventListener('submit', e => {
    e.preventDefault(); const id=$('#pantryId').value; const existing=state.pantry.find(p=>p.id===id);
    const item={id:id||uid('pantry'),name:$('#pantryNameInput').value.trim(),quantity:Number($('#pantryQtyInput').value)||0,unit:$('#pantryUnitInput').value.trim(),location:$('#pantryLocationInput').value,expiry:$('#pantryExpiryInput').value,staple:$('#pantryStapleInput').checked,lowStock:$('#pantryLowInput').checked,updatedAt:new Date().toISOString()};
    if(!item.name){toast('Add an item name');return;} if(existing)Object.assign(existing,item);else state.pantry.push(item);saveState();$('#pantryDialog').close();toast(existing?'Pantry item updated':'Added to pantry');
  });

  $('#mealForm').addEventListener('submit', e => {
    e.preventDefault(); const date=$('#mealDateInput').value, slot=$('#mealSlotInput').value, recipeId=$('#mealRecipeSelect').value, custom=$('#mealCustomInput').value.trim();
    state.mealPlan[date] ||= {}; if(recipeId)state.mealPlan[date][slot]={recipeId}; else if(custom)state.mealPlan[date][slot]={custom}; else delete state.mealPlan[date][slot]; saveState();$('#mealDialog').close();toast('Meal plan updated');
  });

  $('#removeMealButton').addEventListener('click', () => {const date=$('#mealDateInput').value,slot=$('#mealSlotInput').value;if(state.mealPlan[date])delete state.mealPlan[date][slot];saveState();$('#mealDialog').close();toast('Meal removed');});
  $('#mealRecipeSelect').addEventListener('change',()=>{if($('#mealRecipeSelect').value)$('#mealCustomInput').value='';});
  $('#mealCustomInput').addEventListener('input',()=>{if($('#mealCustomInput').value.trim())$('#mealRecipeSelect').value='';});

  $('#prevWeek').addEventListener('click',()=>{weekOffset--;renderPlan();}); $('#nextWeek').addEventListener('click',()=>{weekOffset++;renderPlan();});
  $('#generateGroceriesButton').addEventListener('click',()=>{generateGroceriesFromWeek();navigate('grocery');});
  $('#groceryFromPlanButton').addEventListener('click',generateGroceriesFromWeek);
  $('#groceryAddButton').addEventListener('click',()=>{const input=$('#groceryAddInput');const text=input.value.trim();if(!text)return;state.grocery.push({id:uid('g'),text,checked:false,category:groceryCategory(text),source:'manual'});input.value='';saveState();});
  $('#groceryAddInput').addEventListener('keydown',e=>{if(e.key==='Enter'){$('#groceryAddButton').click();}});
  $('#clearCheckedButton').addEventListener('click',()=>{state.grocery=state.grocery.filter(g=>!g.checked);saveState();toast('Checked items cleared');});
  $('#shareGroceryButton').addEventListener('click',shareGroceries);
  $('#shoppingModeButton').addEventListener('click',async()=>{document.body.classList.toggle('shopping-mode');if(document.body.classList.contains('shopping-mode')){await requestWakeLock();toast('Shopping mode on');}else{await releaseWakeLock();}});
  $('#matchRecipesButton').addEventListener('click',renderCookMatches);
  $('#customCookIngredients').addEventListener('input',renderCookMatches);
  $('#pantrySortButton').addEventListener('click',()=>{pantrySort=pantrySort==='expiry'?'name':'expiry';renderPantry();});
  $('#recipeSearch').addEventListener('input',renderRecipes); $('#recipeSort').addEventListener('change',renderRecipes); $('#pantrySearch').addEventListener('input',renderPantry);

  $('#displayNameInput').addEventListener('change',e=>{state.settings.displayName=e.target.value.trim();saveState();});
  $('#servingsInput').addEventListener('change',e=>{state.settings.defaultServings=clamp(Number(e.target.value)||2,1,30);saveState();});
  $('#unitsSelect').addEventListener('change',e=>{state.settings.units=e.target.value;saveState();});
  $('#weekStartSelect').addEventListener('change',e=>{state.settings.weekStart=e.target.value;saveState();});
  $('#dietInput').addEventListener('change',e=>{state.settings.diet=e.target.value.trim();saveState();});
  $('#allergyInput').addEventListener('change',e=>{state.settings.allergies=e.target.value.trim();saveState();});
  $('#exportButton').addEventListener('click',exportBackup); $('#importInput').addEventListener('change',e=>importBackup(e.target.files?.[0]));
  $('#resetButton').addEventListener('click',()=>{if(confirm('Reset Bento and permanently clear all local recipes, plans, pantry items, groceries, history and settings on this device?')){state=defaultState();localStorage.removeItem(STORAGE_KEY);saveState();navigate('home');toast('Bento reset');}});

  $('#quickAddButton').addEventListener('click',()=>openDialog($('#quickAddDialog'))); $('#brandButton').addEventListener('click',()=>navigate('about'));
  $('#searchButton').addEventListener('click',()=>{navigate('recipes');setTimeout(()=>$('#recipeSearch').focus(),100);});

  // PWA install support
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstallPrompt=e; $('#installButton').classList.remove('hidden'); });
  $('#installButton').addEventListener('click',async()=>{if(!deferredInstallPrompt){toast('On iPhone: Share → Add to Home Screen');return;}deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('#installButton').classList.add('hidden');});
  window.addEventListener('appinstalled',()=>toast('Bento installed ♡'));
  if(!('BeforeInstallPromptEvent' in window) && /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) $('#installButton').classList.remove('hidden');

  // Make it behave like an app: suppress browser pinch/double-tap zoom while retaining normal form controls.
  ['gesturestart','gesturechange','gestureend'].forEach(type=>document.addEventListener(type,e=>e.preventDefault(),{passive:false}));
  document.addEventListener('touchstart',e=>{if(e.touches && e.touches.length>1)e.preventDefault();},{passive:false});
  let lastTouchEnd=0;
  document.addEventListener('touchend',e=>{const now=Date.now();if(now-lastTouchEnd<=300)e.preventDefault();lastTouchEnd=now;},{passive:false});

  // Keep accidental drag/image behaviors out of the installed-app experience.
  document.addEventListener('dragstart',e=>e.preventDefault());
  document.addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea'))e.preventDefault();});

  // Close dialogs cleanly and release screen wake lock.
  $$('dialog').forEach(d=>d.addEventListener('close',()=>{if(d.id==='recipeDetailDialog'){cookingSession=null;stopCookingTimer(false);releaseWakeLock();}}));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible' && (cookingSession||document.body.classList.contains('shopping-mode')))requestWakeLock();});

  // Service worker
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));

  // Initial route
  const hash=location.hash.replace('#','');
  if(hash && document.querySelector(`.view[data-view="${hash}"]`)) currentView=hash;
  navigate(currentView,false);
})();
