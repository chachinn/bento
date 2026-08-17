const fs=require('fs');const vm=require('vm');const path=require('path');global.window=global;
const files=['001-010','011-020','021-030','031-040','041-050','051-060','061-070','071-080','081-090','091-100','101-110','111-120','121-130','131-140','141-150','151-160','161-171'];
function load(p){vm.runInThisContext(fs.readFileSync(p,'utf8'),{filename:p});}
load('data/indian-runtime.js');for(const f of files)load(`data/indian-recipes-${f}.js`);
const R=(global.BENTO_RECIPE_LIBRARY||[]).filter(r=>r.cuisine==='Indian');
const stop=new Set('g ml kg tsp tbsp cup cups small medium large fresh finely chopped sliced minced grated ground whole as needed plus more for serving taste optional neutral oil water salt fine the and or of to with'.split(/\s+/));
function words(s){return new Set(String(s).toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/\s+/).filter(w=>w.length>2&&!stop.has(w)));}
function ingredientTokens(r){const out=new Set();for(const x of r.ingredients||[])for(const w of words(x))out.add(w);return out;}
function jacc(a,b){let i=0;for(const x of a)if(b.has(x))i++;return i/(a.size+b.size-i||1);}
const templatePairs=[];for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=ingredientTokens(R[i]),b=ingredientTokens(R[j]);const s=jacc(a,b);if(s>=0.68&&Math.min(a.size,b.size)>=7)templatePairs.push({score:+s.toFixed(2),a:R[i].id+' '+R[i].title,b:R[j].id+' '+R[j].title});}
templatePairs.sort((a,b)=>b.score-a.score);
const signatureRules=[
[/butter chicken|murgh makhani/i,['chicken','butter','tomato']],[/dal makhani/i,['urad','kidney']],[/sarson.*saag/i,['mustard']],[/makki.*roti/i,['cornmeal']],[/chole bhature/i,['chickpea','flour']],[/rajma/i,['kidney']],[/palak paneer/i,['spinach','paneer']],[/paneer tikka/i,['paneer','yogurt']],[/biryani/i,['rice']],[/pulao|pilaf/i,['rice']],[/dosa/i,['rice','urad']],[/idli/i,['rice','urad']],[/dhokla|khandvi/i,['gram']],[/poha/i,['flattened','rice']],[/upma/i,['semolina']],[/appam/i,['rice','coconut']],[/puttu/i,['rice','coconut']],[/kadhi/i,['yogurt','gram']],[/khichdi/i,['rice']],[/sambar/i,['dal','tamarind']],[/rasam/i,['tamarind']],[/gulab jamun/i,['khoya|milk']],[/rasgulla|rosogolla/i,['chhena|paneer']],[/jalebi/i,['flour']],[/pav bhaji/i,['pav','potato']],[/vada pav/i,['pav','potato']],[/samosa/i,['flour','potato']],[/bhel/i,['puffed','rice']],[/aloo/i,['potato']],[/rogan josh/i,['lamb|mutton']],[/vindaloo/i,['vinegar']],[/xacuti/i,['coconut']],[/fish/i,['fish']],[/prawn|shrimp/i,['prawn|shrimp']],[/pork/i,['pork']],[/chicken/i,['chicken']],[/lamb|mutton/i,['lamb|mutton']],[/lassi/i,['yogurt']],[/chai/i,['tea']],[/coffee/i,['coffee']]
];
function hasAlt(text,expr){return expr.split('|').some(x=>text.includes(x));}
const signatureMiss=[];for(const r of R){const text=(r.ingredients||[]).join(' ').toLowerCase();for(const [rx,needs] of signatureRules){if(rx.test(r.title)){const miss=needs.filter(n=>!hasAlt(text,n));if(miss.length)signatureMiss.push({id:r.id,title:r.title,missing:miss});break;}}}
const genericBundles=[['onion','tomato','ginger','garlic','green chill','cumin','turmeric','coriander','garam masala'],['onion','tomato','ginger','garlic','cumin','turmeric','coriander','kashmiri','garam masala']];
const bundleHits=[];for(const r of R){const t=(r.ingredients||[]).join(' ').toLowerCase();for(const b of genericBundles){const n=b.filter(x=>t.includes(x)).length;if(n>=8){bundleHits.push({id:r.id,title:r.title,matched:n,bundle:b.length});break;}}}
function qty(line,unit){const m=String(line).match(new RegExp('([0-9]+(?:\\.[0-9]+)?)\\s*'+unit+'\\b','i'));return m?+m[1]:null;}
const ratioFlags=[];for(const r of R){const ing=r.ingredients||[];let dryPulse=0,rice=0,flour=0,water=0,milk=0;for(const x of ing){const l=x.toLowerCase();const g=qty(l,'g');const ml=qty(l,'ml');if(g&&(l.includes('dried')||l.includes('dal')||l.includes('urad')||l.includes('lentil')||l.includes('chickpea')||l.includes('kidney bean')))dryPulse+=g;if(g&&l.includes('rice'))rice+=g;if(g&&(l.includes('flour')||l.includes('atta')||l.includes('cornmeal')||l.includes('semolina')||l.includes('besan')||l.includes('gram flour')))flour+=g;if(ml&&l.includes('water'))water+=ml;if(ml&&(l.includes('milk')||l.includes('cream')||l.includes('yogurt')))milk+=ml;}
if(dryPulse>=180&&water>0&&water/dryPulse<2.5)ratioFlags.push({id:r.id,title:r.title,type:'pulse-water-low',dryPulse,water,ratio:+(water/dryPulse).toFixed(2)});
if(flour>=200&&water>0&&water/flour<0.3&&!/puri|paratha|kachori|samosa/i.test(r.title))ratioFlags.push({id:r.id,title:r.title,type:'dough-water-low',flour,water,ratio:+(water/flour).toFixed(2)});
if(flour>=200&&water>0&&water/flour>1.25&&!/batter|dosa|idli|appam|dhokla/i.test(r.title))ratioFlags.push({id:r.id,title:r.title,type:'dough-water-high',flour,water,ratio:+(water/flour).toFixed(2)});
if(rice>=200&&water>0&&water/rice<1.15&&!/biryani|pulao|pilaf/i.test(r.title))ratioFlags.push({id:r.id,title:r.title,type:'rice-water-low',rice,water,ratio:+(water/rice).toFixed(2)});
}
const stepCounts={};for(const r of R)stepCounts[(r.steps||[]).length]=(stepCounts[(r.steps||[]).length]||0)+1;
const exactFive=stepCounts[5]||0;
const report={recipeCount:R.length,stepCounts,exactFive,exactFivePct:+(100*exactFive/R.length).toFixed(1),templatePairCount:templatePairs.length,topTemplatePairs:templatePairs.slice(0,80),genericBundleHits:bundleHits,signatureMisses:signatureMiss,ratioFlags};
console.log(JSON.stringify(report,null,2));if(R.length!==171)process.exitCode=1;