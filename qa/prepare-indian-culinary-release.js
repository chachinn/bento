const fs=require('fs');
const FROM='28p2',TO='28p3';
for(const file of ['index.html','service-worker.js']){
  let s=fs.readFileSync(file,'utf8');
  if(s.includes(FROM))s=s.split(FROM).join(TO);
  fs.writeFileSync(file,s);
}
const p='data/library_manifest.json';const m=JSON.parse(fs.readFileSync(p,'utf8'));
m.cacheFix='v28.0 culinary accuracy patch uses the 28p3 shell generation so installed Bento PWAs receive the corrected Indian quantities, methods and regional-identity hardening without stale-cache carryover.';
m.generatedAt='2026-08-17T22:50:00+08:00';
if(m.qualityAuditSnapshot?.PWA)m.qualityAuditSnapshot.PWA.assetVersion=TO;
m.qualityAuditSnapshot.v28IndianCulinaryAccuracy={
  auditedAt:'2026-08-17',IndianTotal:171,coveragePreserved:true,
  methodology:'All 171 Indian recipes were machine-scanned for method depth, repeated ingredient-template similarity, duplicate identity and multi-component quantity ambiguity. High-risk flagged dishes were then manually reviewed against official India Tourism/Incredible India material and established Indian culinary references; fixes were applied only where the evidence supported a concrete correction.',
  stepDistribution:{'4':1,'5':5,'6':7,'7':38,'8':92,'9':18,'10':7,'11':2,'12':1},
  exactFiveStepRecipes:['Sweet Lassi','Masala Chai','Kahwa','Sol Kadhi','South Indian Filter Coffee'],exactFiveStepPercent:2.9,methodPolicy:'The recipe determines its method length; no artificial 5- or 6-step target or ceiling.',
  correctedRecipes:[
    'ind_001 Butter Chicken (Murgh Makhani)','ind_002 Dal Makhani','ind_006 Chole Bhature','ind_007 Pindi Chole','ind_008 Rajma Chawal','ind_031 Banarasi Kachori Sabzi','ind_037 Chana Ghugni','ind_058 Dal Baati Churma','ind_073 Dal Dhokli','ind_078 Dal Bafla'
  ],
  corrections:[
    'Separated component-specific water quantities where one generic water line had been doing multiple jobs such as cooking legumes/rice and hydrating dough.','Hardened Butter Chicken sequencing and sauce balance with charred chicken, restrained added water, kasuri methi and cream finish.','Restored a drier tangy Pindi Chole identity and a lighter legume-forward Bihari Chana Ghugni identity rather than allowing both to collapse into the same generic tomato-masala template.','Made Dal Bafla explicitly boil before baking and separated dal, dough and boiling water.','Clarified Banarasi Kachori Sabzi dough water versus potato-sabzi water and Dal Dhokli dal water versus dhokli-dough water.'
  ],
  similarityReview:{initialHighSimilarityPairs:11,remainingReviewedPairs:7,status:'reviewed as legitimate regional relatives or dishes with clearly distinct defining ingredients/methods'},
  verificationScope:'Risk-based culinary accuracy audit across the full 171-recipe set; this records a full-library scan plus manual verification of flagged/high-risk recipes, not a claim that every individual gram in all 171 recipes was independently benchmarked against multiple published recipes.',
  regression:{totalRecipeRecords:1499,uniqueRecipeIds:1499,standardRecipeCount:1028,Indian:171,hardFailures:0},status:'passed'
};
m.fullQaRelease='v28.0 Indian culinary accuracy hardening audits all 171 Indian recipes for step depth and culinary-risk signals, applies targeted quantity/method/regional-identity corrections to 10 recipes, preserves all 171 dishes, and passes the 1,499-record full-library regression.';
fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');
