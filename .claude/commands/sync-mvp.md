---
description: Rebuild the single-file MVP from the split demo files
---
`demo/bundle-configurator.mvp.html` must match `demo/index.html` plus the files it loads
(`src/`, `configs/`, `demo/harness.*`).

1. Read `demo/index.html` and every local CSS/JS file it references, in load order.
2. Regenerate `demo/bundle-configurator.mvp.html` with each file inlined in the same order,
   keeping a `/* === path === */` marker before each section.
3. Run `npm run check`, then show a short `git diff --stat`.
Do not change runtime behaviour while doing this.
