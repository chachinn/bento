import fs from 'node:fs';
import path from 'node:path';

const files=fs.readdirSync('data').filter(f=>f.endsWith('.js')).map(f=>path.join('data',f));
const rows=[];
for(const file of files){
  const text=fs.readFileSync(file,'utf8');
  const matches=[...text.matchAll(/["']?id["']?\s*:\s*["'](jp_\d+)["']/g)];
  for(let i=0;i<matches.length;i++){
    const start=matches[i].index;
    const end=i+1<matches.length?matches[i+1].index:Math.min(text.length,start+16000);
    const chunk=text.slice(start,end);
    const get=(name)=>{
      const m=chunk.match(new RegExp(`[\"']?${name}[\"']?\\s*:\\s*[\"']([^\"']+)[\"']`));
      return m?m[1]:'';
    };
    rows.push({id:matches[i][1],title:get('title'),region:get('region'),category:get('category'),file});
  }
}
rows.sort((a,b)=>Number(a.id.slice(3))-Number(b.id.slice(3)));
const byId=new Map();
for(const r of rows){
  if(!byId.has(r.id)) byId.set(r.id,[]);
  byId.get(r.id).push(r);
}
const unique=[...byId.values()].map(v=>v[0]);
const dupes=[...byId.entries()].filter(([,v])=>v.length>1);
const max=Math.max(...unique.map(r=>Number(r.id.slice(3))));
const missing=[];
for(let i=1;i<=max;i++) if(!byId.has(`jp_${String(i).padStart(3,'0')}`)) missing.push(i);
const normalize=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim();
const byTitle=new Map();
for(const r of unique){
  const k=normalize(r.title);
  if(!k) continue;
  if(!byTitle.has(k)) byTitle.set(k,[]);
  byTitle.get(k).push(r);
}
const titleDupes=[...byTitle.entries()].filter(([,v])=>v.length>1);
const regions={};
const categories={};
for(const r of unique){
  regions[r.region||'(missing)']=(regions[r.region||'(missing)']||0)+1;
  categories[r.category||'(missing)']=(categories[r.category||'(missing)']||0)+1;
}
console.log(`JAPANESE_COVERAGE_COUNT=${unique.length}`);
console.log(`JAPANESE_MAX_ID=${max}`);
console.log(`JAPANESE_MISSING_IDS=${missing.join(',')||'none'}`);
console.log(`JAPANESE_DUPLICATE_IDS=${dupes.map(([id,v])=>`${id}x${v.length}`).join(',')||'none'}`);
console.log(`JAPANESE_DUPLICATE_TITLES=${titleDupes.map(([,v])=>v.map(r=>`${r.id}:${r.title}`).join('|')).join(';')||'none'}`);
console.log('JAPANESE_REGION_COUNTS='+JSON.stringify(Object.fromEntries(Object.entries(regions).sort((a,b)=>a[0].localeCompare(b[0])))));
console.log('JAPANESE_CATEGORY_COUNTS='+JSON.stringify(Object.fromEntries(Object.entries(categories).sort((a,b)=>a[0].localeCompare(b[0])))));
console.log('JAPANESE_INVENTORY_BEGIN');
for(const r of unique) console.log(`${r.id}\t${r.region||'-'}\t${r.category||'-'}\t${r.title||'-'}\t${r.file}`);
console.log('JAPANESE_INVENTORY_END');
if(dupes.length||missing.length||titleDupes.length||unique.some(r=>!r.title||!r.region||!r.category)) process.exitCode=1;
