window.BENTO_RECIPE_PHOTO_INDEX=Object.fromEntries((window.BENTO_RECIPE_LIBRARY||[]).map(r=>[r.id,{id:r.id,title:r.title,kind:'recipe',queries:Array.isArray(r.photoQueries)&&r.photoQueries.length?r.photoQueries:[`${r.title} ${r.japaneseName||''} Japanese food`.trim(),`${r.title} Japanese food`]}]));
window.BENTO_INGREDIENT_PHOTO_INDEX={};
