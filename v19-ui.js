(()=>{'use strict';
  const FLAGS={Japanese:'🇯🇵',Filipino:'🇵🇭',Korean:'🇰🇷',Chinese:'🇨🇳',Thai:'🇹🇭',Vietnamese:'🇻🇳',Indian:'🇮🇳',Italian:'🇮🇹',French:'🇫🇷',Spanish:'🇪🇸',Greek:'🇬🇷',Turkish:'🇹🇷',Mexican:'🇲🇽',American:'🇺🇸',Brazilian:'🇧🇷',Peruvian:'🇵🇪',Moroccan:'🇲🇦',British:'🇬🇧'};
  const panel=document.getElementById('recipeBrowsePanel');
  const cuisineTab=document.querySelector('[data-recipe-browse="cuisines"]');
  if(!panel||!cuisineTab)return;
  let queued=false;
  function enhanceCuisines(){
    queued=false;
    if(!cuisineTab.classList.contains('active')||panel.querySelector('.cuisine-picker-card'))return;
    const grid=panel.querySelector('.browse-card-grid');
    const buttons=grid?[...grid.querySelectorAll('[data-browse-cuisine]')]:[];
    if(!grid||!buttons.length)return;
    const selectedButton=buttons.find(b=>b.classList.contains('selected'));
    const selected=selectedButton?.dataset.browseCuisine||'All';
    grid.classList.add('v19-cuisine-source');grid.hidden=true;
    const picker=document.createElement('div');picker.className='cuisine-picker-card';
    const head=document.createElement('div');head.className='cuisine-picker-head';
    const icon=document.createElement('span');icon.className='cuisine-picker-icon';icon.textContent=selected==='All'?'🌏':(FLAGS[selected]||'🍽️');
    const copy=document.createElement('span');const title=document.createElement('b');title.textContent=selected==='All'?'Choose a cuisine':selected;
    const meta=document.createElement('small');meta.textContent=selectedButton?.querySelector('small')?.textContent||`${buttons.length} cuisines in Bento`;
    copy.append(title,meta);head.append(icon,copy);
    const label=document.createElement('label');label.className='cuisine-select-wrap';
    const select=document.createElement('select');select.className='cuisine-browse-select';select.setAttribute('aria-label','Choose cuisine');
    const all=document.createElement('option');all.value='All';all.textContent='🌏 All cuisines';select.append(all);
    for(const b of buttons){const c=b.dataset.browseCuisine||'';const o=document.createElement('option');o.value=c;o.textContent=`${FLAGS[c]||'🍽️'} ${c}`;select.append(o)}
    select.value=selected;
    const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='⌄';label.append(select,arrow);
    const note=document.createElement('p');note.className='cuisine-picker-note';note.textContent=selected==='All'?'Pick a cuisine to narrow the library. The list stays compact as Bento grows.':`Showing ${selected} recipes only.`;
    select.addEventListener('change',()=>{const value=select.value;if(value==='All'){cuisineTab.click();return}const target=buttons.find(b=>b.dataset.browseCuisine===value);target?.click()});
    picker.append(head,label,note);panel.insertBefore(picker,grid);
  }
  function queueEnhance(){if(queued)return;queued=true;queueMicrotask(enhanceCuisines)}
  const observer=new MutationObserver(queueEnhance);observer.observe(panel,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target.closest('[data-recipe-browse]'))setTimeout(enhanceCuisines,0)},true);
  enhanceCuisines();
})();
