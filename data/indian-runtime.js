(()=>{'use strict';
const NATIONAL='https://www.prod.incredibleindia.gov.in/content/incredible-india-v2/en/experiences/food-and-cuisine.html';
const GLUTEN_RX=/\b(wheat|whole wheat|whole-wheat|atta|all-purpose flour|bread flour|cake flour|tempura flour|semolina|sooji|rava|maida|panko|breadcrumbs?|bread crumbs?|ramen|udon|soba|wheat noodles?|egg noodles?|noodles|spaghetti|pasta|gyoza wrappers?|dumpling wrappers?|wonton wrappers?|momo wrappers?|spring roll wrappers?|soy sauce|hoisin sauce|bread|pav|naan|kulcha|bhature?|parotta)\b/;
const CULINARY_PATCHES={
  ind_001:{ingredients:[
    '700 g boneless chicken thighs, cut into large pieces','120 g plain yogurt','2 tbsp lemon juice','2 tbsp butter','60 g raw cashews','120 ml heavy cream','1 large onion, finely sliced','3 ripe tomatoes, chopped','20 g fresh ginger, grated','5 garlic cloves, minced','2 green chillies, slit','1 tsp cumin seeds','1/2 tsp ground turmeric','1 1/2 tsp ground coriander','1 tsp Kashmiri chilli powder','1 tsp garam masala','1 tsp crushed kasuri methi (dried fenugreek leaves)','1 tsp honey or sugar, optional','2 tbsp neutral oil','1 1/4 tsp fine salt','120 ml hot water, plus more only if needed','2 tbsp chopped cilantro'
  ],steps:[
    'Mix the yogurt, lemon juice, half the ginger and garlic, Kashmiri chilli, turmeric, coriander, garam masala, and salt. Coat the chicken thoroughly and refrigerate at least 1 hour; 4–8 hours gives better seasoning and tenderness.',
    'Heat a grill pan, broiler, or heavy skillet until very hot. Shake excess marinade from the chicken, brush with a little neutral oil, and cook in batches until browned and lightly charred outside; the chicken may remain slightly underdone in the center because it will finish in the sauce.',
    'In a saucepan, heat the remaining oil with cumin seeds until fragrant, then add the onion and cook over medium heat until soft and golden, 8–10 minutes. Add the remaining ginger, garlic, and green chillies and cook until the raw aroma disappears.',
    'Add the tomatoes and cook until they collapse and the mixture looks glossy rather than watery, 10–15 minutes. Stir in the cashews and only enough of the hot water to prevent catching, then simmer until the cashews soften.',
    'Cool the tomato mixture briefly, blend until very smooth, and pass through a fine sieve if you want the classic restaurant-smooth texture.',
    'Return the sauce to low heat and whisk in the butter. Add the browned chicken and any resting juices, cover loosely, and simmer gently until the thickest piece reaches at least 74°C and remains juicy.',
    'Crush the kasuri methi between your palms and stir it in with the cream and optional honey or sugar. Warm for 2–3 minutes without a hard boil; the sauce should be buttery, tomato-forward, mildly tangy, and thick enough to coat the chicken.',
    'Rest off the heat for 5 minutes, then finish with cilantro. The final sauce should be silky and orange-red, with visible char on the chicken rather than a boiled texture.'
  ]},
  ind_002:{ingredients:[
    '200 g whole black urad dal and 60 g kidney beans','2 tbsp butter','120 ml heavy cream','1 large onion, finely sliced','3 ripe tomatoes, chopped','20 g fresh ginger, grated','5 garlic cloves, minced','2 green chillies, slit','1 tsp cumin seeds','1/2 tsp ground turmeric','1 1/2 tsp ground coriander','1 tsp Kashmiri chilli powder','1 tsp garam masala','2 tbsp neutral oil','1 1/4 tsp fine salt','1.2 litres water for pressure-cooking, plus hot water as needed during the long simmer','2 tbsp chopped cilantro'
  ]},
  ind_006:{ingredients:[
    '300 g dried chickpeas','300 g all-purpose flour','120 g plain yogurt','1 tsp baking powder','1/4 tsp baking soda','1 tsp sugar','1 large onion, finely sliced','3 ripe tomatoes, chopped','20 g fresh ginger, grated','5 garlic cloves, minced','2 green chillies, slit','1 tsp cumin seeds','1/2 tsp ground turmeric','1 1/2 tsp ground coriander','1 tsp Kashmiri chilli powder','1 tsp amchur (dried mango powder)','1 tsp garam masala','2 tbsp neutral oil','1 1/4 tsp fine salt','1.5 litres water for cooking chickpeas, plus more as needed','90–130 ml warm water for bhatura dough, as needed','2 tbsp chopped cilantro','neutral oil, for deep-frying bhature'
  ],steps:[
    'Rinse and soak the dried chickpeas in plenty of water for 8–12 hours, then drain.',
    'Cover the soaked chickpeas with the measured fresh cooking water and pressure-cook or simmer until completely tender, 35–60 minutes depending on method; a chickpea should crush easily between two fingers. Reserve the cooking liquor.',
    'While the chickpeas cook, mix flour, yogurt, baking powder, baking soda, sugar, salt, a little oil, and enough of the measured warm dough water into a soft but shape-holding bhatura dough. Knead 6–8 minutes, cover, and rest 60–90 minutes.',
    'For the chole, heat oil and cook cumin, onion, ginger, garlic, and green chilli until browned. Add tomato, coriander, turmeric, Kashmiri chilli, garam masala, and amchur.',
    'Cook the masala 6–8 minutes until glossy, then add the tender chickpeas with some reserved cooking liquor.',
    'Simmer 20–25 minutes, mashing a small spoonful of chickpeas into the gravy, until dark, tangy, and thick enough to coat.',
    'Divide the rested dough into balls and roll into 14–16 cm discs without dusting with excessive flour.',
    'Heat frying oil to about 185°C. Slide in one bhatura and press gently with a slotted spoon until it balloons; turn and fry 45–60 seconds more until pale golden.',
    'Drain each bhatura on a rack and serve immediately with hot chole and cilantro. The bread should be inflated and tender while the chickpeas are creamy, not watery.'
  ]},
  ind_007:{ingredients:[
    '300 g dried chickpeas','2 black tea bags or 2 tsp black tea tied in muslin, optional for a traditional darker colour','1 tbsp dried pomegranate powder or amchur','1 large onion, finely sliced','3 ripe tomatoes, chopped','20 g fresh ginger, grated','5 garlic cloves, minced','2 green chillies, slit','1 tsp cumin seeds','1/2 tsp ground turmeric','1 1/2 tsp ground coriander','1 tsp Kashmiri chilli powder','1 tsp garam masala','2 tbsp neutral oil','1 1/4 tsp fine salt','1.5 litres water for cooking chickpeas, plus more as needed','2 tbsp chopped cilantro'
  ],steps:[
    'Rinse the chickpeas, cover generously with water, and soak 8–12 hours.',
    'Drain and add the measured fresh cooking water. Add the optional tea bags or tea bundle, then pressure-cook or simmer until the chickpeas crush easily between two fingers but still hold their shape. Remove the tea and reserve some cooking liquid.',
    'Heat the oil in a wide pot and toast cumin until fragrant. Add onion and cook until deep golden, then add ginger, garlic, and green chillies.',
    'Add tomatoes, turmeric, coriander, and Kashmiri chilli. Cook over medium heat until the tomatoes are reduced and the masala looks glossy.',
    'Add the cooked chickpeas, salt, and a little reserved cooking liquid. Stir well and mash a small spoonful of chickpeas into the masala to help it cling.',
    'Simmer uncovered, stirring often, until the liquid reduces and the chickpeas are coated in a dark, relatively dry masala rather than sitting in gravy.',
    'Stir in dried pomegranate powder or amchur and garam masala near the end so their tart aroma remains distinct.',
    'Taste and adjust salt and sourness. Pindi chole should be tangy, warmly spiced, and moist enough to coat the chickpeas without pooling liquid.',
    'Finish with cilantro and rest 5–10 minutes before serving; the masala tightens and clings more as it cools slightly.'
  ]},
  ind_008:{ingredients:[
    '300 g dried kidney beans','300 g basmati rice','1 large onion, finely sliced','3 ripe tomatoes, chopped','20 g fresh ginger, grated','5 garlic cloves, minced','2 green chillies, slit','1 tsp cumin seeds','1/2 tsp ground turmeric','1 1/2 tsp ground coriander','1 tsp Kashmiri chilli powder','1 tsp garam masala','2 tbsp neutral oil','1 1/4 tsp fine salt','1.5 litres water for cooking kidney beans, plus more as needed','500 ml water for cooking the basmati rice','2 tbsp chopped cilantro'
  ],steps:[
    'Rinse the kidney beans, soak in plenty of water for 8–12 hours, then drain.',
    'Cover the soaked beans with the measured fresh bean-cooking water and pressure-cook or simmer until fully tender; kidney beans must be cooked through, with no chalky center. Reserve the cooking liquid.',
    'Rinse the basmati rice until the water is mostly clear. Cook separately with the measured rice water until the grains are tender and separate, then keep covered off the heat.',
    'Heat oil in a heavy pot, add cumin, then cook the onion until golden. Add ginger, garlic, and green chillies and sauté until fragrant.',
    'Add tomatoes, turmeric, coriander, Kashmiri chilli, and salt. Cook until the tomatoes break down and the masala becomes thick and glossy.',
    'Add the cooked kidney beans and enough reserved cooking liquid for a loose gravy. Mash a small portion of beans against the pot to help thicken the sauce.',
    'Simmer gently 20–30 minutes so the bean starch and masala combine. Stir from the bottom and add hot water if the gravy tightens too much.',
    'Stir in garam masala and cilantro. The beans should be creamy inside and the gravy thick enough to coat a spoon without being pasty.',
    'Serve the rajma hot over the basmati rice; the rice should remain fluffy enough to absorb the gravy rather than becoming mushy.'
  ]},
  ind_031:{ingredients:[
    '300 g whole wheat flour','100 g moong dal','500 g potatoes','1 tsp fine salt','60 ml neutral oil or ghee, for pastry','120–150 ml water for kachori dough, as needed','15 g fresh ginger, grated','1 tsp cumin seeds','1 tsp fennel seeds','1 tsp ground coriander','1/2 tsp turmeric','1 tsp red chilli powder','1 tsp amchur','1/2 tsp asafoetida','400 ml water for potato sabzi, plus more as needed','neutral oil, for deep-frying'
  ]},
  ind_037:{ingredients:[
    '300 g dried black chickpeas (kala chana) or dried yellow peas','1 large onion, thinly sliced','15 g fresh ginger, grated','4 garlic cloves, minced','2 green chillies, chopped','1 bay leaf','1 tsp cumin seeds','1/2 tsp ground turmeric','1 tsp ground coriander','1/2 tsp red chilli powder','1/2 tsp freshly ground black pepper','1/2 tsp roasted cumin powder','1 tsp fine salt','900 ml water for cooking, plus more as needed','1 small onion, finely chopped, for garnish','1 green chilli, finely chopped, for garnish','1 tbsp lemon juice','2 tbsp chopped cilantro'
  ],steps:[
    'Rinse the dried chickpeas or peas and soak 8–12 hours. Drain, cover with the measured fresh water, add a pinch of turmeric, and cook until tender but not falling apart; reserve a little cooking liquor.',
    'Heat oil in a wide pan. Add the bay leaf and cumin seeds, then the sliced onion and green chillies. Cook until the onion is translucent with light golden edges rather than deeply browned.',
    'Add ginger and garlic and cook until the raw aroma disappears.',
    'Add coriander, red chilli, the remaining turmeric, black pepper, and roasted cumin powder. Stir briefly so the spices bloom without scorching.',
    'Add the cooked chickpeas or peas with a small splash of reserved cooking liquor and the salt. Mash only a spoonful to give the mixture light body while keeping most legumes intact.',
    'Simmer 15–20 minutes until moist and spoonable but not soupy. Add more reserved liquor only if it begins to dry before the flavors come together.',
    'Turn off the heat and stir in lemon juice and cilantro. Taste for salt, chilli, and acidity.',
    'Serve topped with finely chopped raw onion and green chilli. Bihari-style ghugni should taste legume-forward and lightly spiced, not like a heavy tomato gravy.'
  ]},
  ind_058:{ingredients:[
    '220 g mixed toor, moong and chana dal','350 g whole wheat flour (atta)','120 g ghee, divided','90 g jaggery, grated','1 medium onion, finely chopped','2 ripe tomatoes, chopped','15 g fresh ginger, grated','3 garlic cloves, minced','1 green chilli, chopped','1 tsp cumin seeds','1/2 tsp turmeric','1 tsp ground coriander','1/2 tsp red chilli powder','1 tsp fine salt','650 ml water for cooking the dal, plus more as needed','120–150 ml water for the baati dough, as needed'
  ]},
  ind_073:{ingredients:[
    '200 g toor dal','200 g whole wheat flour (atta)','40 g peanuts','40 g jaggery','1 tbsp tamarind pulp','1/2 tsp turmeric','1 tsp red chilli powder','1 tsp ground coriander','1 tsp fine salt','1 tbsp neutral oil','1 tsp mustard seeds','1/2 tsp cumin seeds','10 curry leaves','1/8 tsp asafoetida (hing; use gluten-free if needed)','900 ml water for cooking and thinning the dal, plus more as needed','90–120 ml water for dhokli dough, as needed','2 tbsp chopped cilantro'
  ]},
  ind_078:{ingredients:[
    '220 g mixed toor, chana and moong dal','350 g whole wheat flour','80 g plain yogurt','100 g ghee','1 medium onion, finely sliced','2 ripe tomatoes, chopped','20 g fresh ginger, grated','4 garlic cloves, minced','2 green chillies, slit','1 tsp cumin seeds','1/2 tsp ground turmeric','1 1/2 tsp ground coriander','1 tsp red chilli powder','1 tsp garam masala','2 tbsp neutral oil','1 1/4 tsp fine salt','650 ml water for cooking the dal, plus more as needed','120–160 ml water for the bafla dough, as needed','2 litres water for boiling the bafla'
  ],steps:[
    'Rinse the mixed dals and cook with turmeric in the measured dal water until soft and creamy, 25–35 minutes; add hot water if needed to keep the dal loose enough to simmer.',
    'Rub ghee into the wheat flour with salt, then add the yogurt and enough of the measured dough water to form a firm, smooth dough. Rest 20 minutes.',
    'Shape into smooth balls. Bring the separate boiling water to a full boil and simmer the bafla 12–15 minutes until they float and feel set at the surface.',
    'Drain thoroughly and let surface steam evaporate for 5 minutes.',
    'Bake at 210°C for 20–25 minutes, turning once, until browned and dry-sounding outside with a fully cooked center.',
    'Meanwhile temper the dal with ghee, cumin, ginger, garlic, chilli, tomato, and warm spices; simmer 8–10 minutes.',
    'Crack the hot bafla slightly and spoon or dip in melted ghee so some fat reaches the crumb without saturating it.',
    'Serve with the hot dal. The bafla should be crisp-browned outside, dense-tender within, and never doughy at the center.'
  ]}
};
function normalizeStoredAllergens(o){
  const ingredients=CULINARY_PATCHES[o?.id]?.ingredients||o?.ingredients||[];
  const raw=(' '+ingredients.join(' ')+' ').toLowerCase();
  const allergens=Array.from(new Set((Array.isArray(o?.allergens)?o.allergens:[]).filter(Boolean).map(x=>String(x).toLowerCase())));
  return allergens.filter(a=>a!=='gluten'||GLUTEN_RX.test(raw));
}
function normalizeIngredients(o){
  if(CULINARY_PATCHES[o?.id]?.ingredients)return [...CULINARY_PATCHES[o.id].ingredients];
  const ingredients=Array.isArray(o?.ingredients)?[...o.ingredients]:[];
  if(o?.id==='ind_075'){
    const matches=[];ingredients.forEach((x,i)=>{if(String(x).trim()==='1/2 tsp cumin seeds')matches.push(i)});
    if(matches.length===2){ingredients[matches[0]]='1/2 tsp cumin seeds, for khichdi';ingredients[matches[1]]='1/2 tsp cumin seeds, for kadhi tempering';}
  }
  return ingredients;
}
function normalizeSteps(o){return CULINARY_PATCHES[o?.id]?.steps?[...CULINARY_PATCHES[o.id].steps]:(Array.isArray(o?.steps)?[...o.steps]:[]);}
window.BENTO_INDIAN_ADD=rows=>{
  const lib=Array.isArray(window.BENTO_RECIPE_LIBRARY)?window.BENTO_RECIPE_LIBRARY:(window.BENTO_RECIPE_LIBRARY=[]);
  const seen=new Set(lib.map(r=>String(r.id||'')));
  for(const o of rows||[]){
    if(!o||seen.has(String(o.id||'')))continue;
    const refs=Array.from(new Set([...(Array.isArray(o.sourceUrls)?o.sourceUrls:[]),NATIONAL].filter(Boolean))).slice(0,4);
    const r={
      cuisine:'Indian',country:'India',countryCode:'IN',recipeType:'Reviewed regional classic',
      energy:'normal',cleanup:2,freezer:'no',collection:'Indian Kitchen',favorite:false,builtIn:true,dietTags:[],
      libraryVersion:32,instructionVersion:32,instructionStyle:'comprehensive-variable-length',
      createdAt:'2026-08-14T17:28:00+08:00',updatedAt:'2026-08-17T22:45:00+08:00',verifiedAt:'2026-08-17',
      auditStatus:'Indian v28 culinary accuracy hardening · 2026-08-17',
      inactiveMinutes:Math.max(0,Number(o.total||0)-Number(o.prep||0)-Number(o.cook||0)),
      source:'Bento Indian Kitchen · reviewed August 2026 against official Incredible India / India Tourism regional food guides and established Indian culinary references. Quantities and sequencing are practical Bento home-cooking adaptations; regional, religious, community and household versions vary.',
      ...o,ingredients:normalizeIngredients(o),steps:normalizeSteps(o),allergens:normalizeStoredAllergens(o),sourceUrls:refs
    };
    lib.push(r);seen.add(String(r.id));
  }
};
})();