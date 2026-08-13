const fs=require('fs'),vm=require('vm'),path=require('path');
global.window=global;
function dist(rows,getSteps){const d={};for(const r of rows){const n=getSteps(r);d[n]=(d[n]||0)+1;}return d;}
function loadChinese(){global.BENTO_CN=[];for(const f of fs.readdirSync('data').filter(f=>/^chinese-recipes-\d+\.js$/.test(f)).sort())vm.runInThisContext(fs.readFileSync(path.join('data',f),'utf8'));return BENTO_CN;}
function loadThai(){global.BENTO_THAI_ROWS=[];for(const f of fs.readdirSync('data').filter(f=>/^(thai-recipes-|thai-extra-).*\.js$/.test(f)).sort())vm.runInThisContext(fs.readFileSync(path.join('data',f),'utf8'));const m=new Map();for(const r of BENTO_THAI_ROWS)m.set(r[0],r);return [...m.values()];}
for(const [name,rows] of [['Chinese',loadChinese()],['Thai',loadThai()]]){console.log('\n'+name+' count='+rows.length+' distribution='+JSON.stringify(dist(rows,r=>(r[13]||[]).length)));for(const r of rows)console.log(`${name}\t${r[0]}\t${(r[13]||[]).length}\t${r[1]}`);}
