/* ============================================================
   Category template — Subscription boxes (coffee).
   Same engine, different category, no illustration scene.
   Proves the core is category-agnostic.
   ============================================================ */
window.BCFG_CONFIG_COFFEE = {
  brand: { id: '', name: '', footerText: '', theme: {} },
  copy: {
    title: 'Build your coffee box',
    titleHighlight: 'coffee box',
    subtitle: 'Four questions and we will put together a box that matches how you actually drink coffee.',
    resultSubtitle: 'Your box, ready to go.',
    finishLabel: 'See my box', ctaLabel: 'Add box to cart',
    whyTitle: 'Why this box?', contentsTitle: "What's in the box",
    addonsTitle: 'Worth adding', profileTitle: 'Your answers',
    priceSuffix: 'per month', orderTotalLabel: 'Order total',
    cartPanelLabel: 'Your cart will contain',
    cartHint: 'Opens checkout with the box and add-ons pre-loaded.'
  },
  derived: { cupsPerWeek: 'cupsPerDay * 7 * drinkers' },
  scene: {
    type: 'summary', title: 'Your box so far',
    options: {
      emptyTitle: 'Tell us how you brew', emptySub: 'to start building your box',
      rows: [
        { icon: '&#x2615;', label: '{cupsPerDay} cup(s) a day, {drinkers} drinker(s)', when: { field: 'brewMethod', op: 'truthy' } },
        { icon: '&#x1F3FA;', label: 'Brewing: {brewMethod}', when: { field: 'brewMethod', op: 'truthy' } },
        { icon: '&#x1F525;', label: 'Roast: {roast}', when: { field: 'roast', op: 'truthy' } },
        { icon: '&#x1F4E6;', label: '~{cupsPerWeek} cups a week', when: { field: 'step', op: 'gt', value: 1 } }
      ]
    }
  },
  steps: [
    { id: 'method', type: 'choice', field: 'brewMethod', required: true,
      question: 'How do you brew at home?', sub: 'Grind size and freshness follow from this.',
      options: [
        { value: 'espresso', icon: '&#x2615;', label: 'Espresso machine', desc: 'Fine grind, whole bean preferred' },
        { value: 'filter',   icon: '&#x1F375;', label: 'Filter / pour-over', desc: 'Medium grind' },
        { value: 'cafetiere',icon: '&#x1FAD6;', label: 'Cafetière',         desc: 'Coarse grind' },
        { value: 'pods',     icon: '&#x1F7E4;', label: 'Pods',              desc: 'Compatible capsules' }
      ]},
    { id: 'volume', type: 'counters', question: 'How much coffee?', sub: 'We size the box from this.',
      counters: [
        { field: 'cupsPerDay', icon: '&#x2615;', label: 'Cups a day', min: 1, max: 8, defaultValue: 2 },
        { field: 'drinkers',   icon: '&#x1F465;', label: 'Coffee drinkers', min: 1, max: 6, defaultValue: 1 }
      ]},
    { id: 'roast', type: 'choice', field: 'roast', required: true, layout: 'grid',
      question: 'Which roast?', sub: 'You can change this any month.',
      options: [
        { value: 'light',  icon: '&#x1F33F;', label: 'Light' },
        { value: 'medium', icon: '&#x1F7E4;', label: 'Medium' },
        { value: 'dark',   icon: '&#x1F311;', label: 'Dark' },
        { value: 'mixed',  icon: '&#x1F500;', label: 'Surprise me' }
      ]},
    { id: 'extras', type: 'toggles', question: 'Anything to go with it?', sub: 'Optional, added to the same order.',
      toggles: [
        { field: 'needsGrinder', icon: '&#x2699;', label: 'I need a grinder' },
        { field: 'needsFilters', icon: '&#x1F9FB;', label: 'Filter papers' },
        { field: 'needsMilk',    icon: '&#x1F95B;', label: 'Milk frother' },
        { field: 'wantsDecaf',   icon: '&#x1F319;', label: 'Add a decaf bag' }
      ]}
  ],
  bundles: [
    { id: 'solo', title: 'Solo Box', subtitle: '1 × 250 g bag', variantId: '00000000000101', price: 12.00,
      when: { expr: 'cupsPerWeek', op: 'lte', value: 21 },
      why: 'One bag a month covers your pace without anything going stale.',
      includes: { bag: 1 },
      contents: [{ name: '250 g single-origin', detail: 'Ground to your brew method', qty: 1 }] },
    { id: 'duo', title: 'Duo Box', subtitle: '2 × 250 g bags', variantId: '00000000000102', price: 21.00,
      when: { expr: 'cupsPerWeek', op: 'lte', value: 49 },
      why: 'Two bags a month — the sweet spot for a household of regular drinkers.',
      includes: { bag: 2 },
      contents: [{ name: '250 g single-origin', detail: 'Ground to your brew method', qty: 2 }] },
    { id: 'house', title: 'Household Box', subtitle: '4 × 250 g bags', variantId: '00000000000103', price: 38.00,
      why: 'Four bags keeps a busy household in fresh coffee all month.',
      includes: { bag: 4 },
      contents: [{ name: '250 g single-origin', detail: 'Ground to your brew method', qty: 4 }] }
  ],
  accessories: {
    bag:     { title: 'Extra 250 g bag', variantId: '00000000000111', price: 9.50 },
    grinder: { title: 'Hand grinder',    variantId: '00000000000112', price: 44.00 },
    filters: { title: 'Filter papers ×100', variantId: '00000000000113', price: 6.00 },
    frother: { title: 'Milk frother',    variantId: '00000000000114', price: 19.00 },
    decaf:   { title: 'Decaf 250 g',     variantId: '00000000000115', price: 10.50 }
  },
  addonRules: [
    { id: 'grinder', accessory: 'grinder', when: { all: [{ field: 'needsGrinder', op: 'truthy' }] }, qty: 1,
      text: 'Hand grinder', reason: 'Whole bean stays fresher' },
    { id: 'filters', accessory: 'filters', when: { field: 'needsFilters', op: 'truthy' }, qty: 1,
      text: 'Filter papers ×100', reason: 'Matches your brew method' },
    { id: 'frother', accessory: 'frother', when: { field: 'needsMilk', op: 'truthy' }, qty: 1,
      text: 'Milk frother', reason: 'For flat whites at home' },
    { id: 'decaf', accessory: 'decaf', when: { field: 'wantsDecaf', op: 'truthy' }, qty: 1,
      text: 'Decaf 250 g', reason: 'For the evening cup' },
    { id: 'espressoNote', advisory: true, when: { field: 'brewMethod', op: 'eq', value: 'espresso' },
      text: 'Bags ship whole bean', reason: 'Best results from an espresso grinder' }
  ],
  profileChips: [
    { field: 'brewMethod', icon: '&#x2615;' },
    { field: 'roast', icon: '&#x1F525;' },
    { field: 'cupsPerDay', icon: '&#x1F4C8;', label: '{cupsPerDay} cup{s}/day' },
    { field: 'drinkers', icon: '&#x1F465;', label: '{drinkers} drinker(s)' }
  ],
  cart: { mode: 'permalink', storeUrl: 'https://example-roastery.myshopify.com', displayDomain: 'example-roastery.com', currencySymbol: '£' },
  promo: { code: '', pct: 0 },
  stockWatch: {}
};
