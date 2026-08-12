(()=>{'use strict';
const FLAGS={Japanese:'🇯🇵',Filipino:'🇵🇭',Korean:'🇰🇷',Chinese:'🇨🇳',Thai:'🇹🇭',Vietnamese:'🇻🇳',Indian:'🇮🇳',Italian:'🇮🇹',French:'🇫🇷',Spanish:'🇪🇸',Greek:'🇬🇷',Turkish:'🇹🇷',Mexican:'🇲🇽',American:'🇺🇸',Brazilian:'🇧🇷',Peruvian:'🇵🇪',Moroccan:'🇲🇦',British:'🇬🇧'};
const panel=document.getElementById('recipeBrowsePanel'),cuisineTab=document.querySelector('[data-recipe-browse="cuisines"]'),animeTab=document.querySelector('[data-recipe-browse="anime"]'),search=document.getElementById('recipeSearch'),detail=document.getElementById('recipeDetailContent');
if(!panel)return;
const norm=v=>String(v||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const animeRows=()=>Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY.filter(r=>r&&(r.animeDish||r.animeSeries)):[];
const aliases=['jujutsu kaisen','jjk','food wars','shokugeki','campfire cooking','dungeon meshi','delicious in dungeon','emiya','sweetness lightning','restaurant to another world','isekai izakaya','dr stone','laid back camp','yuru camp'];
function queryIsAnime(v){const q=norm(v);if(!q)return false;if(aliases.some(a=>q.includes(a)))return true;return animeRows().some(r=>{const s=norm(r.animeSeries);return s&&(q===s||(q.length>=8&&(q.includes(s)||s.includes(q))))})}
function enhanceCuisines(){
  if(!cuisineTab?.classList.contains('active')||panel.querySelector('.cuisine-picker-card'))return;
  const grid=panel.querySelector('.browse-card-grid'),buttons=grid?[...grid.querySelectorAll('[data-browse-cuisine]')]:[];
  if(!grid||!buttons.length)return;
  const selectedButton=buttons.find(b=>b.classList.contains('selected')),selected=selectedButton?.dataset.browseCuisine||'All';
  grid.hidden=true;grid.classList.add('v20-cuisine-source');
  const picker=document.createElement('div');picker.className='cuisine-picker-card';
  const head=document.createElement('div');head.className='cuisine-picker-head';
  const icon=document.createElement('span');icon.className='cuisine-picker-icon';icon.textContent=selected==='All'?'🌏':(FLAGS[selected]||'🍽️');
  const copy=document.createElement('span'),title=document.createElement('b'),meta=document.createElement('small');
  title.textContent=selected==='All'?'Choose a cuisine':selected;
  meta.textContent=selectedButton?.querySelector('small')?.textContent||`${buttons.length} cuisines in Bento`;
  copy.append(title,meta);head.append(icon,copy);
  const label=document.createElement('label');label.className='cuisine-select-wrap';
  const select=document.createElement('select');select.className='cuisine-browse-select';select.setAttribute('aria-label','Choose cuisine');
  const all=document.createElement('option');all.value='All';all.textContent='🌏 All cuisines';select.append(all);
  for(const b of buttons){const c=b.dataset.browseCuisine||'',o=document.createElement('option');o.value=c;o.textContent=`${FLAGS[c]||'🍽️'} ${c}`;select.append(o)}
  select.value=selected;
  const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';label.append(select,arrow);
  const note=document.createElement('p');note.className='cuisine-picker-note';note.textContent=selected==='All'?'Pick a cuisine to narrow the library. The list stays compact as Bento grows.':`Showing ${selected} recipes only.`;
  select.addEventListener('change',()=>{const value=select.value;if(value==='All'){cuisineTab.click();return}buttons.find(b=>b.dataset.browseCuisine===value)?.click()});
  picker.append(head,label,note);panel.insertBefore(picker,grid);
}
function enhanceAnime(){
  if(!animeTab?.classList.contains('active')||panel.querySelector('.anime-library-intro'))return;
  const n=animeRows().length;
  panel.replaceChildren();
  const box=document.createElement('div');box.className='anime-library-intro';
  const icon=document.createElement('span');icon.className='anime-library-icon';icon.textContent='📺';
  const copy=document.createElement('div'),title=document.createElement('b'),meta=document.createElement('small'),note=document.createElement('p');
  title.textContent='Anime recipes';meta.textContent=`${n} recipes · search by dish or anime title`;
  note.textContent='All anime recipes live together here. Series information stays inside recipe details and references so the library stays clean.';
  copy.append(title,meta,note);box.append(icon,copy);panel.append(box);
}
function addFact(grid,label,value){if(!value)return;const d=document.createElement('div'),s=document.createElement('small'),b=document.createElement('b');s.textContent=label;b.textContent=value;d.append(s,b);grid.append(d)}
function enhanceDetail(){
  if(!detail||detail.querySelector('.anime-source-card')||detail.querySelector('.cook-mode'))return;
  const marker=detail.querySelector('[data-detail-fav]');if(!marker)return;
  const r=animeRows().find(x=>String(x.id)===String(marker.dataset.detailFav));if(!r)return;
  const card=document.createElement('div');card.className='anime-source-card';
  const h=document.createElement('div');h.className='anime-source-title';const icon=document.createElement('span');icon.textContent='📺';
  const text=document.createElement('div'),small=document.createElement('small'),strong=document.createElement('b');small.textContent='From anime';strong.textContent=r.animeSeries||'Anime';text.append(small,strong);h.append(icon,text);
  const grid=document.createElement('div');grid.className='anime-source-grid';
  addFact(grid,'Episode',[r.animeEpisode,r.animeEpisodeTitle].filter(Boolean).join(' · '));
  addFact(grid,'Anime dish',r.animeDishName);
  addFact(grid,'Real-world version',r.realWorldDish);
  addFact(grid,'Recreation',r.adaptationType);
  card.append(h,grid);
  const facts=detail.querySelector('.recipe-facts');facts?.insertAdjacentElement('afterend',card);
}
let queued=false;function queue(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;enhanceCuisines();enhanceAnime();enhanceDetail()})}
new MutationObserver(queue).observe(panel,{childList:true,subtree:true});
if(detail)new MutationObserver(enhanceDetail).observe(detail,{childList:true,subtree:true});
document.addEventListener('click',e=>{if(e.target.closest('[data-recipe-browse]'))setTimeout(queue,0)},true);
if(search)search.addEventListener('input',()=>{if(queryIsAnime(search.value)&&!animeTab?.classList.contains('active'))animeTab?.click()},true);
queue();
})();