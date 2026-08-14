'use strict';
const fs=require('fs');
const files=['data/recipe-content-fixes-final.js','data/recipe-semantic-alias-fixes.js','data/recipe-content-fixes-genshin-identity.js','data/recipe-content-fixes-genshin-unindexed.js'];
let html=fs.readFileSync('index.html','utf8');
for(const file of files)if(!html.includes(file))html=html.replace('<script src="data/recipe-quality-runtime.js?v=24p2" defer></script>',`<script src="${file}?v=24p2" defer></script>\n  <script src="data/recipe-quality-runtime.js?v=24p2" defer></script>`);
fs.writeFileSync('index.html',html);
let sw=fs.readFileSync('service-worker.js','utf8');
for(const file of files){const asset=`'./${file}?v=24p2'`;if(!sw.includes(asset))sw=sw.replace("  './app.js?v=24p2'",`  ${asset},\n  './app.js?v=24p2'`);}
fs.writeFileSync('service-worker.js',sw);
console.log('final content-fix modules wired');
