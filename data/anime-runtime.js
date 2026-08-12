(()=>{'use strict';
const SERIES_SOURCE_NOTE='Bento verifies the anime identity/appearance from the listed series references, then provides a practical home-cooking recreation. Recipe quantities and method wording are Bento adaptations rather than copied source recipes.';
const allergenMap=[
  ['soy',['soy sauce','miso','tofu','soybean','edamame','soy milk','doubanjiang']],
  ['gluten',['wheat flour','all-purpose flour','bread flour','panko','breadcrumbs','bread crumbs','noodles','spaghetti','soba','ramen','gyoza wrapper','dumpling wrapper','puff pastry','naan','soy sauce']],
  ['egg',[' egg','eggs','egg yolk','egg white','mayonnaise','hollandaise']],
  ['milk',['milk','cream','butter','cheese','parmesan','yogurt']],
  ['fish',['fish sauce','salmon','tuna','mackerel','aji','cod','dashi','bonito','anchovy','fish cake','chikuwa']],
  ['shellfish',['shrimp','prawn','crab','clam','mussel','oyster','squid','octopus']],
  ['nuts',['peanut','walnut','almond','hazelnut','pine nut','pistachio','chestnut']],
  ['sesame',['sesame']]
];
function allergens(ingredients){const t=(' '+(ingredients||[]).join(' ')+' ').toLowerCase(),out=[];for(const [name,keys] of allergenMap)if(keys.some(k=>t.includes(k)))out.push(name);return [...new Set(out)]}
function dessertStyle(title){const x=String(title||'').toLowerCase();if(/sorbet|semifreddo|parfait|pudding|jelly|cream/.test(x))return'Chilled & creamy';if(/tart|pie|cake|coulibiac|bread|cookie/.test(x))return'Cakes & baked';if(/candy|cotton|brittle|chocolate/.test(x))return'Candies & confections';if(/fried|doughnut|donut|crepe|crêpe/.test(x))return'Fried & griddled';return'Rice & traditional'}
function drinkStyle(title){const x=String(title||'').toLowerCase();if(/tea|cha/.test(x))return'Tea & infusions';if(/coffee|cacao|chocolate/.test(x))return'Coffee & cacao';if(/cola|soda|ade|juice|punch/.test(x))return'Juices & coolers';return'Traditional'}
window.BENTO_ANIME_ADD_ROWS=(rows)=>{
  window.BENTO_RECIPE_LIBRARY=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:[];
  window.BENTO_RECIPE_PHOTO_INDEX=window.BENTO_RECIPE_PHOTO_INDEX||{};
  const existing=new Set(window.BENTO_RECIPE_LIBRARY.map(r=>String(r?.id||'')));
  for(const raw of (Array.isArray(rows)?rows:[])){
    if(!raw||!raw.id||existing.has(String(raw.id)))continue;
    const r={...raw,
      animeDish:true,cuisine:'',country:'',region:'',
      recipeType:'Reviewed anime recreation',collection:'Anime',
      source:`Anime: ${raw.animeSeries}${raw.animeEpisode?` · ${raw.animeEpisode}${raw.animeEpisodeTitle?` · ${raw.animeEpisodeTitle}`:''}`:''}. ${SERIES_SOURCE_NOTE}`,builtIn:true,favorite:false,
      libraryVersion:20,instructionVersion:15,instructionStyle:'detailed-concise',
      createdAt:'2026-08-13T06:45:00+08:00',updatedAt:'2026-08-13T06:45:00+08:00',verifiedAt:'2026-08-13',
      auditStatus:'Reviewed · 2026',
      allergens:allergens(raw.ingredients),
      tags:[...(Array.isArray(raw.tags)?raw.tags:[]),raw.animeSeries,raw.animeEpisode,raw.animeEpisodeTitle,raw.animeDishName,raw.realWorldDish,raw.adaptationType].filter(Boolean),
      inactiveMinutes:Math.max(0,Number(raw.total||0)-Number(raw.prep||0)-Number(raw.cook||0))
    };
    if(r.category==='Sweets & Desserts'&&!r.dessertStyle)r.dessertStyle=dessertStyle(r.realWorldDish||r.title);
    if(r.category==='Drinks'&&!r.drinkStyle)r.drinkStyle=drinkStyle(r.realWorldDish||r.title);
    window.BENTO_RECIPE_LIBRARY.push(r);
    existing.add(String(r.id));
    window.BENTO_RECIPE_PHOTO_INDEX[r.id]={queries:(r.photoQueries||[]).slice(0,4),square:true,source:'Wikimedia Commons runtime search'};
  }
};
})();