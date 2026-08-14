(()=>{'use strict';
const P=window.BENTO_RECIPE_PHOTO_INDEX||(window.BENTO_RECIPE_PHOTO_INDEX={});
for(const r of (window.BENTO_RECIPE_LIBRARY||[]).filter(x=>x.cuisine==='Chinese')){
  const existing=Array.isArray(r.photoQueries)?r.photoQueries.filter(Boolean):[];
  const defaults=[`${r.title} Chinese food`,`${r.title} ${r.region||'China'} dish`];
  r.photoQueries=[...new Set([...existing,...defaults])];
  P[r.id]={...(P[r.id]||{}),queries:r.photoQueries,square:true};
}
})();
