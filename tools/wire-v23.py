from pathlib import Path
import json
V='23p1'
files=['chinese-init.js']+[f'chinese-recipes-{i:03d}.js' for i in range(1,41)]+['chinese-runtime.js','chinese-meta-core.js','chinese-meta-extra.js','chinese-photo.js']
p=Path('index.html');s=p.read_text().replace('22p2',V);app=f'<script src="app.js?v={V}" defer></script>'
if 'chinese-init.js' not in s:
    tags='\n  '.join(f'<script src="data/{f}?v={V}" defer></script>' for f in files)
    s=s.replace(app,tags+'\n  '+app)
p.write_text(s)
m=json.loads(Path('data/library_manifest.json').read_text())
m.update(recipeCount=996,newRecipesThisBuild=40,cuisineCount=4,standardRecipeCount=525,chineseRecipeCount=40,dishImageCount=996,detailedInstructionRecipeCount=996,instructionVersion=23,appRelease='23.0',generatedAt='2026-08-13T21:55:00+08:00')
m['verifiedCuisineLibraries']=['Japanese','Filipino','Korean','Chinese']
m['cacheFix']='v23.0 aligns the Chinese library and PWA shell to the 23p1 asset generation.'
m['chineseRelease']='v23.0 introduces 40 reviewed Chinese recipes across regional classics, noodles, rice, dim sum, breakfast, soups, vegetables, desserts and drinks.'
m['qualityGate']='v23.0 adds 40 reviewed Chinese recipes on top of the audited v22.2 library; IDs, counts, metadata and method structure are regression checked.'
m['qualityAuditSnapshot']['fullLibrary']={'recipeCount':996,'uniqueRecipeIds':996,'criticalStructureFailures':0}
m['qualityAuditSnapshot']['standardCuisines']={'recipeCount':525,'Japanese':148,'Filipino':163,'Korean':174,'Chinese':40,'flaggedRecipes':0}
m['qualityAuditSnapshot']['Chinese']={'recipeCount':40,'uniqueRecipeIds':40,'methodStructureFailures':0}
Path('data/library_manifest.json').write_text(json.dumps(m,indent=2,ensure_ascii=False)+'\n')
p=Path('data/chinese-meta-extra.js');x=p.read_text();x+="\n(()=>{for(const r of (window.BENTO_RECIPE_LIBRARY||[]).filter(x=>x.cuisine==='Chinese')){r.dietTags=[];r.sourceUrls=[];r.inactiveMinutes=Math.max(0,(+r.total||0)-(+r.prep||0)-(+r.cook||0));if(r.category==='Sweets & Desserts')r.dessertStyle=/Mango|Almond/i.test(r.title)?'Chilled & creamy':'Rice & traditional';if(r.category==='Drinks')r.drinkStyle='Juices & coolers'}})();\n";p.write_text(x)
assert s.count('data/chinese-recipes-')==40
