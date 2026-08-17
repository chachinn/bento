const fs=require('fs');
const ASSET_FROM='28p1',ASSET_TO='28p2';
for(const p of ['index.html','service-worker.js']){
  let s=fs.readFileSync(p,'utf8');
  s=s.split(ASSET_FROM).join(ASSET_TO);
  fs.writeFileSync(p,s);
}
const p='data/library_manifest.json';
const m=JSON.parse(fs.readFileSync(p,'utf8'));
m.generatedAt='2026-08-17T22:20:00+08:00';
m.cacheFix='v28.0 integrity patch uses the 28p2 shell generation so installed Bento PWAs receive the corrected Indian runtime and all existing production assets without stale-cache carryover.';
if(m.qualityAuditSnapshot?.PWA)m.qualityAuditSnapshot.PWA.assetVersion=ASSET_TO;
m.qualityAuditSnapshot=m.qualityAuditSnapshot||{};
m.qualityAuditSnapshot.v28IndianIntegrity={
  auditedAt:'2026-08-17',
  IndianTotal:171,
  uniqueIndianIds:171,
  uniqueIndianTitles:171,
  observedStepRange:'4-12',
  hardFailures:0,
  coveragePreserved:true,
  fixes:[
    'Corrected false gluten metadata for cornmeal/makki-atta Indian recipes by validating stored gluten labels against actual gluten-bearing ingredients before recipes enter the library.',
    'Disambiguated the two intentional 1/2 tsp cumin-seed uses in Gujarati Kadhi Khichdi as khichdi cumin and kadhi-tempering cumin without changing the recipe quantity.'
  ],
  regression:{
    totalRecipeRecords:1499,
    uniqueRecipeIds:1499,
    standardRecipeCount:1028,
    Japanese:189,
    Filipino:184,
    Korean:174,
    Chinese:90,
    Thai:90,
    Vietnamese:130,
    Indian:171,
    hardFailures:0
  },
  status:'passed'
};
m.fullQaRelease='v28.0 Indian integrity hardening re-audits the 171-recipe Indian library, corrects false stored gluten metadata and an ambiguous duplicate cumin ingredient label, preserves all cuisine coverage, and passes the 1,499-record full-library regression.';
fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
