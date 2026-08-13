(()=>{'use strict';
const FLAGS={Japanese:'🇯🇵',Filipino:'🇵🇭',Korean:'🇰🇷',Chinese:'🇨🇳',Thai:'🇹🇭',Vietnamese:'🇻🇳',Indian:'🇮🇳',Italian:'🇮🇹',French:'🇫🇷',Spanish:'🇪🇸',Greek:'🇬🇷',Turkish:'🇹🇷',Mexican:'🇲🇽',American:'🇺🇸',Brazilian:'🇧🇷',Peruvian:'🇵🇪',Moroccan:'🇲🇦',British:'🇬🇧'};
const panel=document.getElementById('recipeBrowsePanel'),cuisineTab=document.querySelector('[data-recipe-browse="cuisines"]'),animeTab=document.querySelector('[data-recipe-browse="anime"]'),search=document.getElementById('recipeSearch'),detail=document.getElementById('recipeDetailContent');
if(!panel)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const ANIME=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY.filter(r=>r&&(r.animeDish||r.animeSeries)):[];
const ANIME_BY_ID=new Map(ANIME.map(r=>[String(r.id),r]));
const SERIES=[...new Set(ANIME.map(r=>norm(r.animeSeries)).filter(Boolean))];
const ALIASES=['jujutsu kaisen','jjk','food wars','shokugeki','campfire cooking','dungeon meshi','delicious in dungeon','emiya','sweetness lightning','restaurant to another world','isekai izakaya','dr stone','laid back camp','yuru camp'];
function queryIsAnime(value){const q=norm(value);if(!q)return false;if(ALIASES.some(a=>q.includes(a)))return true;return SERIES.some(s=>q===s||(q.length>=8&&(q.includes(s)||s.includes(q))))}
function enhanceCuisines(){
  if(!cuisineTab?.classList.contains('active')||panel.querySelector('.cuisine-picker-card'))return;
  const source=panel.querySelector('.browse-card-grid'),buttons=source?[...source.querySelectorAll('[data-browse-cuisine]')]:[];
  if(!source||!buttons.length)return;
  const selectedButton=buttons.find(b=>b.classList.contains('selected')),selected=selectedButton?.dataset.browseCuisine||'All',summary=selectedButton?.querySelector('small')?.textContent||`${buttons.length} cuisines in Bento`;
  source.hidden=true;
  const picker=document.createElement('div');picker.className='cuisine-picker-card';
  picker.innerHTML=`<div class="cuisine-picker-head"><span class="cuisine-picker-icon">${selected==='All'?'🌏':(FLAGS[selected]||'🍽️')}</span><span><b>${esc(selected==='All'?'Choose a cuisine':selected)}</b><small>${esc(summary)}</small></span></div><label class="cuisine-select-wrap"><span class="sr-only">Choose cuisine</span><select class="cuisine-browse-select" aria-label="Choose cuisine"><option value="All">🌏 All cuisines</option>${buttons.map(b=>{const c=b.dataset.browseCuisine||'';return `<option value="${esc(c)}" ${c===selected?'selected':''}>${FLAGS[c]||'🍽️'} ${esc(c)}</option>`}).join('')}</select><span aria-hidden="true">⌄</span></label><p class="cuisine-picker-note">${selected==='All'?'Pick a cuisine to narrow the library. This list stays compact as Bento grows.':`Showing ${esc(selected)} recipes only.`}</p>`;
  picker.querySelector('select')?.addEventListener('change',e=>{const value=e.target.value;if(value==='All'){cuisineTab.click();return}buttons.find(b=>b.dataset.browseCuisine===value)?.click()});
  panel.insertBefore(picker,source);
}
function addFact(grid,label,value){if(!value)return;const d=document.createElement('div'),s=document.createElement('small'),b=document.createElement('b');s.textContent=label;b.textContent=value;d.append(s,b);grid.append(d)}
function enhanceDetail(){
  if(!detail||detail.querySelector('.anime-source-card')||detail.querySelector('.cook-mode'))return;
  const marker=detail.querySelector('[data-detail-fav]');if(!marker)return;
  const r=ANIME_BY_ID.get(String(marker.dataset.detailFav));if(!r)return;
  const card=document.createElement('div');card.className='anime-source-card';
  const h=document.createElement('div');h.className='anime-source-title';h.innerHTML=`<span>📺</span><div><small>From anime</small><b>${esc(r.animeSeries||'Anime')}</b></div>`;
  const facts=document.createElement('div');facts.className='anime-source-grid';
  addFact(facts,'Episode',[r.animeEpisode,r.animeEpisodeTitle].filter(Boolean).join(' · '));addFact(facts,'Anime dish',r.animeDishName);addFact(facts,'Real-world version',r.realWorldDish);addFact(facts,'Recreation',r.adaptationType);card.append(h,facts);
  detail.querySelector('.recipe-facts')?.insertAdjacentElement('afterend',card);
  const source=detail.querySelector('.source-disclosure>div');
  if(source&&!source.querySelector('.anime-reference-copy')){const ref=document.createElement('div');ref.className='anime-reference-copy';ref.innerHTML=`<p><b>Anime:</b> ${esc(r.animeSeries||'')}</p>${r.animeEpisode?`<p><b>Episode:</b> ${esc(r.animeEpisode)}${r.animeEpisodeTitle?` · ${esc(r.animeEpisodeTitle)}`:''}</p>`:''}<p><b>Dish shown/referenced:</b> ${esc(r.animeDishName||r.title)}</p><p><b>Bento recreation:</b> ${esc(r.realWorldDish||r.title)}${r.adaptationType?` · ${esc(r.adaptationType)}`:''}</p>`;source.append(ref)}
}
let panelQueued=false;function queuePanelEnhance(){if(panelQueued)return;panelQueued=true;requestAnimationFrame(()=>{panelQueued=false;enhanceCuisines()})}
new MutationObserver(queuePanelEnhance).observe(panel,{childList:true,subtree:true});
if(detail)new MutationObserver(enhanceDetail).observe(detail,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-recipe-browse]'))setTimeout(queuePanelEnhance,0);if(e.target.closest('[data-recipe-id],[data-detail-plan],[data-meal-date],[data-history-recipe]'))setTimeout(enhanceDetail,0)},true);
if(search)search.addEventListener('input',()=>{if(queryIsAnime(search.value)&&!animeTab?.classList.contains('active'))animeTab?.click()},true);
queuePanelEnhance();enhanceDetail();
})();
