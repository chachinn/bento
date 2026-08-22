# Bento Production Engineering Rules

## Baseline and scope

- Fetch and inspect the newest `origin/main`, recent history, production files, and the working tree before each release. GitHub main supersedes handoff notes. Never reset, overwrite, or discard newer or user-owned work.
- Cuisine releases are additive and surgical. Preserve every existing recipe and stable ID, user-data structure, local persistence behavior, navigation surface, planner, pantry, groceries, favorites, settings, image rule, performance optimization, PWA behavior, and production file unless a verified bug requires a targeted change.
- Trace all references before deleting or renaming a production file. If uncertain, retain it. Avoid broad refactors during cuisine work.

## Cuisine and recipe quality

- Research a cuisine before authoring it and maintain a coverage matrix spanning its regions and relevant staples, breads, soups, grains/noodles, proteins, seafood, vegetables, legumes, street foods, breakfasts, snacks, desserts, confections, and traditional non-alcoholic drinks.
- Coverage determines recipe count; do not target an arbitrary round number and do not add filler. The recipe determines its method length; do not pad simple dishes or compress complex ones to a fixed step count.
- Use reliable dish-specific HTTPS sources. Prefer official national or regional tourism, government cultural, protected-origin, food-heritage, and respected culinary-institution sources. Claims, ingredients, method, and region must be supportable.
- Every standard recipe must be cookable and have a stable cuisine-prefixed ID, correct identity/region/category, sensible recommended servings, coherent prep/cook/total/inactive time, complete measured ingredients, meaningful equipment, sequential technique-specific steps, doneness and serving cues, safety guidance where warranted, notes, source URLs, and at least two title-specific real-food photo queries.
- Use the repository's exact live category taxonomy and current curated standard `recipeType`. Do not change category semantics or the persisted app-state schema merely for a release number.
- Perform culinary and semantic QA, including ingredient-to-method consistency, component quantities, suspicious repeated templates, near duplicates, regional distinctions, time math, serving defaults, equipment, stop cues, and food safety. Similarity flags require manual review rather than automatic deletion.

## Allergens and scaling

- Store correct metadata for Soy, Gluten, Egg, Milk, Fish, Shellfish, Nuts, Sesame, Coconut, and Mustard before runtime inference. Compare stored metadata with runtime inference and resolve every unexplained mismatch.
- Avoid known false positives: plant milks and nut butters are not dairy; coconut remains Coconut; chickpea, chestnut, cornmeal, and buckwheat are not inherently Gluten; culinary uses of “scallop” do not always denote shellfish.
- Preserve author-recommended initial servings and existing nonlinear salt/pepper scaling behavior.

## Architecture, performance, and isolated libraries

- Add each cuisine through `data/<cuisine>-runtime.js` and maintainable batched recipe modules of roughly 5–10 recipes. Append safely to `window.BENTO_RECIPE_LIBRARY`, reject duplicate IDs, and never add new cuisines to the legacy giant `recipes-data.js`.
- Preserve batched card rendering, lazy/on-demand images, indexes and Maps/Sets, debounced search, incremental updates, and object-URL cleanup. Do not preload image libraries or add expensive synchronous per-event full-library work.
- Genshin and Anime remain isolated behind their dedicated surfaces and retain all IDs, relationships, metadata, and source-world imagery. They must never fall through to unrelated real-world or generic cuisine photography.

## PWA, manifest, QA, and releases

- For each release, load the cuisine runtime before its recipe modules in `index.html`; verify every referenced file; add required assets to the service worker; bump cache generation without needless URL churn; and preserve update, navigation fallback, offline shell, and installation behavior.
- Append to `data/library_manifest.json` without deleting historical audit blocks. Update versions, release, exact totals, cuisine counts, cache generation, QA evidence, method ranges, allergen/source/photo/coverage policies, and regression counts. Never claim a test or deployment verification that was not performed.
- Run cuisine-specific QA and full-library regression after every cuisine: counts, unique IDs, identity duplication, categories, servings, ingredients/methods, allergens and runtime inference, time math, equipment, sources, photos, image routing, search/filter/sort, saved data surfaces, Genshin/Anime isolation, scripts, service worker, offline behavior, and performance.
- Use a dedicated branch and PR for each cuisine, always based on newly fetched main after the prior release merges. Inspect diffs, remove only confirmed temporary QA artifacts, commit, push, self-review, fix failures, rerun QA, and merge only after the release gate passes. Verify the merge SHA and attempt exact-SHA Pages verification before continuing.
- Preserve Git history and historical tracker rows. Update the canonical Bento Development Tracker after successful releases when access exists; tracker or Pages observability limits alone do not block later cuisine work when code and merge QA pass.
