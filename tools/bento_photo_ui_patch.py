from pathlib import Path
from html.parser import HTMLParser
import json
import re

app_path = Path('app.js')
style_path = Path('style.css')
sw_path = Path('service-worker.js')
index_path = Path('index.html')

app = app_path.read_text(encoding='utf-8')
style = style_path.read_text(encoding='utf-8')
sw = sw_path.read_text(encoding='utf-8')
html = index_path.read_text(encoding='utf-8')

# --- Cuisine dropdown: one continuous control, no split icon segment. ---
old_cuisine = '''        panel.innerHTML=cuisines.length?`<label class="compact-browse-select"><span class="browse-select-icon" aria-hidden="true">${selected==='All'?'🌏':cuisineFlag(selected)}</span><span class="sr-only">Choose cuisine</span><select class="cuisine-browse-select" aria-label="Choose cuisine"><option value="All">All cuisines</option>${cuisines.map(c=>`<option value="${esc(c)}" ${selected===c?'selected':''}>${cuisineFlag(c)} ${esc(c)}</option>`).join('')}</select><span class="browse-select-chevron" aria-hidden="true">⌄</span></label>`:emptyCard('No cuisines yet.');'''
new_cuisine = '''        panel.innerHTML=cuisines.length?`<label class="compact-cuisine-select"><span class="sr-only">Choose cuisine</span><select class="cuisine-browse-select" aria-label="Choose cuisine"><option value="All" ${selected==='All'?'selected':''}>🌏 All cuisines</option>${cuisines.map(c=>`<option value="${esc(c)}" ${selected===c?'selected':''}>${cuisineFlag(c)} ${esc(c)}</option>`).join('')}</select><span class="browse-select-chevron" aria-hidden="true">⌄</span></label>`:emptyCard('No cuisines yet.');'''
if app.count(old_cuisine) != 1:
    raise SystemExit(f'Cuisine render source mismatch: {app.count(old_cuisine)} matches')
app = app.replace(old_cuisine, new_cuisine, 1)

# --- Photo loader: direct online display; cached blob only as offline fallback. ---
photo_start = app.find('  async function resolveAndApplyPhoto(img){')
photo_end = app.find('\n  function addPhotoCredit', photo_start)
if photo_start < 0 or photo_end < 0:
    raise SystemExit('Could not locate resolveAndApplyPhoto function')
new_photo = '''  async function resolveAndApplyPhoto(img){
    const plan=planForPhotoElement(img);if(!plan)return markPhotoUnavailable(img);const variant=Number(img.dataset.photoVariant||photoVariantByRecipe.get(String(plan.id||img.dataset.photoKey||''))||0),meta=await resolvePhotoMeta(plan,variant);if(!meta||meta.missing||!meta.url)return markPhotoUnavailable(img);
    const releaseObjectUrl=()=>{const u=img.dataset.objectUrl;if(u){try{URL.revokeObjectURL(u)}catch{}delete img.dataset.objectUrl}};
    const onLoad=()=>{photoQueued.delete(img);const shell=img.closest('.photo-shell,.ingredient-photo-shell');shell?.classList.add('has-photo');shell?.classList.remove('photo-unavailable');shell?.querySelector('.photo-skeleton')?.remove();if(shell?.classList.contains('detail-photo-shell'))addPhotoCredit(shell,img);releaseObjectUrl()};
    const onError=()=>{photoQueued.delete(img);releaseObjectUrl();markPhotoUnavailable(img)};
    img.addEventListener('load',onLoad,{once:true});img.addEventListener('error',onError,{once:true});
    if(navigator.onLine){
      img.src=meta.url;
    }else{
      const blob=await cachedPhotoBlob(meta.url);if(!blob){img.removeEventListener('load',onLoad);img.removeEventListener('error',onError);return markPhotoUnavailable(img)}const objectUrl=URL.createObjectURL(blob);img.dataset.objectUrl=objectUrl;img.src=objectUrl;
    }
    img.dataset.photoLoaded='1';img.dataset.photoPage=meta.page||'';img.dataset.photoLicense=meta.license||'';img.dataset.photoArtist=meta.artist||'';img.dataset.photoTitle=meta.title||'';
  }'''
app = app[:photo_start] + new_photo + app[photo_end:]

# --- Every renderRecipes rerender gets brand-new card <img> nodes. Observe them. ---
lines = app.splitlines()
render_lines = [i for i, line in enumerate(lines) if line.startswith("    if(grid)grid.innerHTML=list.length?visible.map(recipeCard).join('')")]
if len(render_lines) != 1:
    raise SystemExit(f'Recipe grid render source mismatch: {len(render_lines)} matches')
i = render_lines[0]
lines[i] = lines[i].replace('    if(grid)grid.innerHTML=', '    if(grid){grid.innerHTML=', 1) + "if(state.settings.recipeCardPhotos===true)requestAnimationFrame(()=>observePhotos(grid));}"
app = '\n'.join(lines) + '\n'
app_path.write_text(app, encoding='utf-8')

# --- Remove dead cuisine-only CSS that predates compact-browse-select. ---
exact_removals = [
    '.cuisine-picker-card{display:grid;gap:12px;padding:14px;border:1px solid var(--line);border-radius:18px;background:var(--surface)}',
    '.cuisine-picker-head{display:flex;align-items:center;gap:11px;min-width:0}',
    '.cuisine-picker-head>span:last-child{display:grid;gap:2px;min-width:0}',
    '.cuisine-picker-head b{font-size:1rem}',
    '.cuisine-picker-head small,.cuisine-picker-note{color:var(--muted);font-size:.78rem;line-height:1.4}',
    '.cuisine-picker-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:14px;background:var(--surface-2);font-size:1.35rem;flex:0 0 auto}',
    '.cuisine-select-wrap{position:relative;display:block}',
    '.cuisine-browse-select{width:100%;min-height:46px;padding:0 42px 0 13px;border:1px solid var(--line);border-radius:14px;background:var(--bg);color:var(--text);font:inherit;font-weight:700;appearance:none;-webkit-appearance:none}',
    '.cuisine-select-wrap>span[aria-hidden=true]{position:absolute;right:14px;top:50%;transform:translateY(-52%);pointer-events:none;color:var(--muted);font-size:1.1rem}',
    '.cuisine-picker-note{margin:0}',
    '.cuisine-picker-card{gap:9px;padding:11px 12px}',
    '.cuisine-picker-head{gap:9px}',
    '.cuisine-picker-icon{width:36px;height:36px;border-radius:12px;font-size:1.15rem}',
    '.cuisine-picker-head b{font-size:.92rem}',
    '.cuisine-picker-head small,.cuisine-picker-note{font-size:.7rem;line-height:1.3}',
    '.cuisine-browse-select{min-height:42px;border-radius:13px;padding-left:11px;font-size:.88rem}',
    '.recipe-library-view .cuisine-picker-card{display:block!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important}',
    '.recipe-library-view .cuisine-picker-head,.recipe-library-view .cuisine-picker-note{display:none!important}',
    '.recipe-library-view .cuisine-select-wrap{display:block!important}',
    '.recipe-library-view .cuisine-browse-select{min-height:38px!important;height:38px!important;border-radius:12px!important;padding:0 36px 0 11px!important;background:var(--surface)!important;font-size:12px!important;font-weight:700!important}',
    '.recipe-library-view .cuisine-select-wrap>span[aria-hidden=true]{right:12px!important;font-size:14px!important}',
]
style = style.replace('.cuisine-picker-card,.anime-library-intro,.anime-source-card{border-radius:16px}', '.anime-library-intro,.anime-source-card{border-radius:16px}')
style = style.replace('.cuisine-picker-card~.browse-card-grid,.browse-card-grid[hidden]{display:none!important}', '.browse-card-grid[hidden]{display:none!important}')
style = style.replace('.compact-browse-select select,.recipe-library-view .compact-browse-select .cuisine-browse-select{', '.compact-browse-select select{')
for chunk in exact_removals:
    style = style.replace(chunk, '')

if '/* Unified one-piece cuisine dropdown */' not in style:
    style += '''

/* Unified one-piece cuisine dropdown */
.compact-cuisine-select{position:relative;display:block;width:100%;height:42px;border:1px solid var(--line);border-radius:13px;background:var(--surface);overflow:hidden;box-shadow:0 2px 8px rgba(112,74,72,.025)}
.compact-cuisine-select .cuisine-browse-select{display:block;width:100%!important;height:100%!important;min-height:0!important;margin:0!important;padding:0 36px 0 12px!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;appearance:none!important;-webkit-appearance:none!important;color:var(--text)!important;font:inherit!important;font-size:12.5px!important;font-weight:750!important;outline:none!important}
.compact-cuisine-select .browse-select-chevron{position:absolute;right:11px;top:50%;transform:translateY(-54%);pointer-events:none;color:var(--muted);font-size:14px;line-height:1}
@media(max-width:520px){.recipe-library-view .compact-cuisine-select{height:36px!important;min-height:36px!important;border-radius:11px!important}.recipe-library-view .compact-cuisine-select .cuisine-browse-select{height:34px!important;padding:0 32px 0 11px!important;font-size:11.5px!important}.recipe-library-view .compact-cuisine-select .browse-select-chevron{right:10px!important;font-size:13px!important}}
'''
style = '\n'.join(line.rstrip() for line in style.splitlines()).rstrip() + '\n'
style_path.write_text(style, encoding='utf-8')

# --- Fresh PWA shell; install fetches versioned assets with cache:no-store. ---
sw, count = re.subn(r"const CACHE='bento-shell-v0\.7\.3-v21';", "const CACHE='bento-shell-v0.7.4-v21';", sw, count=1)
if count != 1:
    raise SystemExit(f'Service worker cache version mismatch: {count} matches')
sw_path.write_text(sw, encoding='utf-8')

# --- Structural regression QA before Git sees any commit. ---
app = app_path.read_text(encoding='utf-8')
css = style_path.read_text(encoding='utf-8')
sw = sw_path.read_text(encoding='utf-8')

class Audit(HTMLParser):
    def __init__(self):
        super().__init__(); self.ids=[]; self.views=set(); self.nav=[]; self.controls=[]; self.scripts=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if a.get('id'): self.ids.append(a['id'])
        if a.get('data-view'): self.views.add(a['data-view'])
        if a.get('data-nav'): self.nav.append(a['data-nav'])
        if a.get('data-view-link'): self.nav.append(a['data-view-link'])
        if a.get('aria-controls'): self.controls.append(a['aria-controls'])
        if tag=='script' and a.get('src'): self.scripts.append(a['src'])

p=Audit(); p.feed(html)
ids=set(p.ids)
expected={'home','plan','recipes','pantry','grocery','smart','cookwith','bentobox','leftovers','ideas','templates','collections','favorites','history','activity','waste','insights','settings','about'}
assert expected <= p.views, f'missing views: {sorted(expected-p.views)}'
assert len(p.ids)==len(ids), 'duplicate HTML ids found'
assert set(p.nav) <= p.views, f'broken navigation targets: {sorted(set(p.nav)-p.views)}'
assert set(p.controls) <= ids, f'broken aria-controls: {sorted(set(p.controls)-ids)}'
for src in p.scripts:
    assert Path(src.split('?',1)[0]).exists(), f'missing script: {src}'

core=re.search(r'const CORE=\[(.*?)\];', sw, re.S)
assert core, 'service worker CORE missing'
for asset in re.findall(r"['\"]([^'\"]+)['\"]", core.group(1)):
    path=asset.removeprefix('./').split('?',1)[0]
    assert Path(path).exists(), f'missing PWA asset: {path}'
json.loads(Path('manifest.json').read_text(encoding='utf-8'))
json.loads(Path('data/library_manifest.json').read_text(encoding='utf-8'))

for mode in ['cuisines','meals','desserts','drinks','games','anime']:
    assert f'data-recipe-browse="{mode}"' in html, f'missing browse tab {mode}'
    assert f"recipeBrowseMode==='{mode}'" in app, f'missing browse renderer {mode}'
for cls in ['cuisine-browse-select','meal-browse-select','dessert-browse-select','drink-browse-select','anime-browse-select']:
    assert cls in app, f'missing selector {cls}'

assert 'class="compact-cuisine-select"' in app
assert '🌏 All cuisines' in app
assert 'if(navigator.onLine){\n      img.src=meta.url;' in app
assert 'requestAnimationFrame(()=>observePhotos(grid))' in app
assert '.compact-cuisine-select{' in css
assert '.cuisine-picker-card{' not in css
assert '.cuisine-select-wrap{' not in css
assert '.recipe-library-view .cuisine-browse-select{' not in css
assert 'bento-shell-v0.7.4-v21' in sw
assert 'That section could not refresh' not in app
assert 'upgradeApp' not in sw and 'upgradeHtml' not in sw
assert css.count('{') == css.count('}'), 'CSS brace mismatch'
for legacy in ['v19-ui.js','v19-cuisine.css','v20-ui.js','v20-ui.css','v20-perf.js','v20-perf.css']:
    assert not Path(legacy).exists(), f'legacy sidecar returned: {legacy}'

print(f'Bento QA PASS: {len(p.views)} views, {len(ids)} unique IDs, all browse modes, photo path, CSS, JSON and PWA assets validated.')
