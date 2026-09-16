/* ============================================================
   Category template — Cosmetics & skincare.
   Full template (not a starter): skin type, goals, routine depth with a
   follow-up on actives, sharing and restock cadence, preferences. The
   bundle is the base routine; add-on rules layer the targeted products.
   Every product name and price here is placeholder copy for the merchant
   to replace; the engine never sees any of it.
   ============================================================ */
window.BCFG_CONFIG_COSMETICS = {
  brand: { id: '', name: '', footerText: '', theme: {} },
  copy: {
    title: 'Build custom widget for configured check out',
    titleHighlight: 'configured check out',
    subtitle: 'Five quick questions about your skin and your routine, and we will put the right set in your basket.',
    resultSubtitle: 'Your routine, ready to go.',
    stepLabel: 'Step {current} of {total}',
    nextLabel: 'Continue', finishLabel: 'See my routine', backLabel: 'Back',
    recommendationBadge: 'Your routine',
    whyTitle: 'Why this set?', contentsTitle: "What's in the set",
    addonsTitle: 'Targeted extras', profileTitle: 'Your answers',
    priceSuffix: 'per set', orderTotalLabel: 'Order total',
    cartPanelLabel: 'Your cart will contain',
    cartHint: 'Opens checkout with the set and extras pre-loaded.',
    ctaLabel: 'Add routine to cart', restartLabel: 'Start over',
    promoPill: 'Save {pct}% with code {code}',
    promoNote: 'Code {code} ({pct}% off) applied automatically at checkout',
    oosBadge: 'Out of stock', oosReason: 'Add it once back in stock',
    requiredHint: 'Choose an option to continue'
  },
  derived: { restocksPerYear: 'ceil(52 / weeks)' },
  scene: {
    type: 'summary', title: 'Your routine so far',
    options: {
      emptyTitle: 'Tell us about your skin', emptySub: 'to start building your routine',
      rows: [
        { icon: '&#x1F9F4;', label: 'Skin: {skin}', when: { field: 'skin', op: 'truthy' } },
        { icon: '&#x1F3AF;', label: 'Goals: {goals}', when: { field: 'step', op: 'gt', value: 1 } },
        { icon: '&#x1F305;', label: 'Routine: {routine}', when: { field: 'routine', op: 'truthy' } },
        { icon: '&#x1F465;', label: 'Sharing: {people}', when: { field: 'step', op: 'gt', value: 3 } },
        { icon: '&#x1F4C5;', label: 'Restock every {weeks} weeks', when: { field: 'step', op: 'gt', value: 3 } }
      ]
    }
  },
  steps: [
    { id: 'skin', type: 'choice', field: 'skin', required: true,
      question: 'How would you describe your skin?', sub: 'Everything else is built around this.',
      options: [
        { value: 'dry',       icon: '&#x1F4A7;', label: 'Dry',         desc: 'Feels tight after washing, flakes in winter' },
        { value: 'oily',      icon: '&#x2728;',  label: 'Oily',        desc: 'Shine by midday, visible pores' },
        { value: 'combo',     icon: '&#x2696;',  label: 'Combination', desc: 'Oily T-zone, drier cheeks' },
        { value: 'sensitive', icon: '&#x1F338;', label: 'Sensitive',   desc: 'Redness, stings with new products' },
        { value: 'normal',    icon: '&#x1F60A;', label: 'Balanced',    desc: 'Rarely reacts, no strong concerns' }
      ]},
    { id: 'goals', type: 'multi', field: 'goals', required: true, columns: 2,
      question: 'What do you want the routine to do?', sub: 'Pick everything that applies. The extras follow from this.',
      options: [
        { value: 'hydration',  icon: '&#x1F4A6;', label: 'Hydration' },
        { value: 'ageing',     icon: '&#x23F3;',  label: 'Fine lines' },
        { value: 'brightening',icon: '&#x1F31F;', label: 'Dullness & glow' },
        { value: 'blemish',    icon: '&#x1F534;', label: 'Breakouts' },
        { value: 'tone',       icon: '&#x1F3A8;', label: 'Uneven tone' },
        { value: 'barrier',    icon: '&#x1F6E1;', label: 'Calm & repair' }
      ]},
    { id: 'routine', type: 'choice', field: 'routine', required: true, layout: 'grid',
      question: 'How much of a routine do you want?', sub: 'We will not send more steps than you asked for.',
      options: [
        { value: 'minimal',  icon: '&#x1F331;', label: 'Minimal',  desc: '3 steps, morning and night' },
        { value: 'balanced', icon: '&#x1F33F;', label: 'Balanced', desc: '5 steps, one active' },
        { value: 'full',     icon: '&#x1F333;', label: 'Full',     desc: '7+ steps, AM and PM actives' }
      ],
      followUp: {
        field: 'actives', label: 'Have you used actives before (retinol, acids, vitamin C)?',
        when: { field: 'routine', op: 'ne', value: 'minimal' },
        options: [
          { value: 'new',  icon: '&#x1F195;', label: 'New to them',  desc: 'We will start you gently' },
          { value: 'used', icon: '&#x1F44D;', label: 'Yes, regularly', desc: 'Full strength is fine' }
        ]
      }},
    { id: 'size', type: 'counters', question: 'Who is it for, and how often?', sub: 'This sizes the set and the restock reminder.',
      counters: [
        { field: 'people', icon: '&#x1F465;', label: 'People sharing it', min: 1, max: 4, defaultValue: 1 },
        { field: 'weeks',  icon: '&#x1F4C5;', label: 'Weeks between restocks', min: 4, max: 16, defaultValue: 8 }
      ]},
    { id: 'prefs', type: 'toggles', question: 'Any preferences?', sub: 'Optional. These filter what goes in the set.',
      toggles: [
        { field: 'fragranceFree', icon: '&#x1F6AB;', label: 'Fragrance-free' },
        { field: 'vegan',         icon: '&#x1F331;', label: 'Vegan formulas' },
        { field: 'hasSpf',        icon: '&#x2600;',  label: 'I already wear SPF daily' },
        { field: 'travel',        icon: '&#x1F9F3;', label: 'I need travel sizes' }
      ],
      tip: '<strong>Tip:</strong> SPF is the one step that does more than every active combined. If you do not wear it yet, we add one.' }
  ],
  bundles: [
    { id: 'calm', title: 'Calm & Repair Set', subtitle: 'Fragrance-free, no strong actives', price: 118, variantId: '',
      why: 'Sensitive skin does better with fewer actives and a stronger barrier, so this set leads with repair and keeps everything fragrance-free.',
      includes: { spf: 1, balm: 1 },
      contents: [
        { name: 'Cream cleanser', detail: '150 ml, fragrance-free', qty: 1 },
        { name: 'Barrier serum', detail: '30 ml, ceramides', qty: 1 },
        { name: 'Repair balm', detail: '50 ml', qty: 1 },
        { name: 'Mineral SPF 30', detail: '50 ml', qty: 1 }
      ],
      when: { field: 'skin', op: 'eq', value: 'sensitive' } },
    { id: 'full', title: 'Complete Routine', subtitle: 'AM and PM, actives included', price: 164, variantId: '',
      why: 'A full routine needs the actives spaced across morning and evening. This set has both slots covered so the extras only fill gaps.',
      includes: { spf: 1, vitc: 1, retinol: 1, eye: 1 },
      contents: [
        { name: 'Gel cleanser', detail: '150 ml', qty: 1 },
        { name: 'Hydrating toner', detail: '200 ml', qty: 1 },
        { name: 'Vitamin C serum', detail: '30 ml, morning', qty: 1 },
        { name: 'Retinol serum', detail: '30 ml, evening', qty: 1 },
        { name: 'Eye cream', detail: '15 ml', qty: 1 },
        { name: 'Moisturiser', detail: '50 ml', qty: 1 },
        { name: 'SPF 50', detail: '50 ml', qty: 1 }
      ],
      when: { field: 'routine', op: 'eq', value: 'full' } },
    { id: 'balanced', title: 'Balanced Routine', subtitle: 'Five steps, one active', price: 96, variantId: '',
      why: 'Five steps is the sweet spot for results without the routine becoming a chore. One active, chosen for your first goal, sits in the middle.',
      includes: { spf: 1 },
      contents: [
        { name: 'Gel cleanser', detail: '150 ml', qty: 1 },
        { name: 'Hydrating toner', detail: '200 ml', qty: 1 },
        { name: 'Treatment serum', detail: '30 ml, matched to your goal', qty: 1 },
        { name: 'Moisturiser', detail: '50 ml', qty: 1 },
        { name: 'SPF 50', detail: '50 ml', qty: 1 }
      ],
      when: { field: 'routine', op: 'eq', value: 'balanced' } },
    { id: 'core', title: 'Daily Essentials', subtitle: 'Cleanse, moisturise, protect', price: 54, variantId: '',
      why: 'Three products used every day do most of the work. Start here and add one thing at a time.',
      includes: { spf: 1 },
      contents: [
        { name: 'Gel cleanser', detail: '150 ml', qty: 1 },
        { name: 'Moisturiser', detail: '50 ml', qty: 1 },
        { name: 'SPF 50', detail: '50 ml', qty: 1 }
      ] }
  ],
  accessories: {
    spf:      { variantId: '', price: 24, title: 'SPF 50', image: '' },
    vitc:     { variantId: '', price: 38, title: 'Vitamin C serum', image: '' },
    retinol:  { variantId: '', price: 42, title: 'Retinol serum', image: '' },
    gentle:   { variantId: '', price: 34, title: 'Bakuchiol serum', image: '' },
    hyal:     { variantId: '', price: 28, title: 'Hyaluronic serum', image: '' },
    spot:     { variantId: '', price: 18, title: 'Spot treatment', image: '' },
    exfol:    { variantId: '', price: 26, title: 'Exfoliating toner', image: '' },
    balm:     { variantId: '', price: 29, title: 'Repair balm', image: '' },
    eye:      { variantId: '', price: 32, title: 'Eye cream', image: '' },
    mask:     { variantId: '', price: 22, title: 'Overnight mask', image: '' },
    refill:   { variantId: '', price: 46, title: 'Cleanser & moisturiser refill', image: '' },
    travel:   { variantId: '', price: 19, title: 'Travel bottle set', image: '' }
  },
  addonRules: [
    { id: 'spf', accessory: 'spf', qty: { expr: 'max(0, 1 - included)' },
      when: { field: 'hasSpf', op: 'falsy' },
      text: 'SPF 50', reason: 'You said you do not wear SPF yet. It is the step that matters most.' },
    { id: 'hyal', accessory: 'hyal', when: { all: [
        { field: 'goals', op: 'includes', value: 'hydration' },
        { field: 'skin', op: 'ne', value: 'oily' } ] },
      text: 'Hyaluronic serum', reason: 'For hydration, layered under the moisturiser' },
    { id: 'mask', accessory: 'mask', when: { all: [
        { field: 'goals', op: 'includes', value: 'hydration' },
        { field: 'skin', op: 'eq', value: 'dry' } ] },
      text: 'Overnight mask', reason: 'Dry skin plus hydration as a goal: twice a week' },
    { id: 'vitc', accessory: 'vitc', qty: { expr: 'max(0, 1 - included)' },
      when: { all: [
        { any: [ { field: 'goals', op: 'includes', value: 'brightening' }, { field: 'goals', op: 'includes', value: 'tone' } ] },
        { field: 'skin', op: 'ne', value: 'sensitive' } ] },
      text: 'Vitamin C serum', reason: 'For glow and even tone, mornings under SPF' },
    { id: 'retinol', accessory: 'retinol', qty: { expr: 'max(0, 1 - included)' },
      when: { all: [
        { field: 'goals', op: 'includes', value: 'ageing' },
        { field: 'actives', op: 'eq', value: 'used' },
        { field: 'skin', op: 'ne', value: 'sensitive' } ] },
      text: 'Retinol serum', reason: 'For fine lines. You have used actives before, so full strength.' },
    { id: 'gentle', accessory: 'gentle', when: { all: [
        { field: 'goals', op: 'includes', value: 'ageing' },
        { any: [ { field: 'actives', op: 'ne', value: 'used' }, { field: 'skin', op: 'eq', value: 'sensitive' } ] } ] },
      text: 'Bakuchiol serum', reason: 'A gentle alternative to retinol for fine lines' },
    { id: 'eye', accessory: 'eye', qty: { expr: 'max(0, 1 - included)' },
      when: { field: 'goals', op: 'includes', value: 'ageing' },
      text: 'Eye cream', reason: 'Fine lines show first around the eyes' },
    { id: 'spot', accessory: 'spot', when: { field: 'goals', op: 'includes', value: 'blemish' },
      text: 'Spot treatment', reason: 'For breakouts, applied only where needed' },
    { id: 'exfol', accessory: 'exfol', when: { all: [
        { any: [ { field: 'goals', op: 'includes', value: 'blemish' }, { field: 'goals', op: 'includes', value: 'tone' } ] },
        { field: 'skin', op: 'ne', value: 'sensitive' },
        { field: 'routine', op: 'ne', value: 'minimal' } ] },
      text: 'Exfoliating toner', reason: 'Two evenings a week. Left out of minimal routines and for sensitive skin.' },
    { id: 'balm', accessory: 'balm', qty: { expr: 'max(0, 1 - included)' },
      when: { field: 'goals', op: 'includes', value: 'barrier' },
      text: 'Repair balm', reason: 'You said calm and repair' },
    { id: 'refill', accessory: 'refill', qty: { expr: 'max(0, people - 1)' },
      when: { field: 'people', op: 'gt', value: 1 },
      text: 'Cleanser & moisturiser refill × {qty}', reason: '{people} people sharing the routine' },
    { id: 'travel', accessory: 'travel', when: { field: 'travel', op: 'truthy' },
      text: 'Travel bottle set', reason: 'You asked for travel sizes' }
  ],
  callouts: [
    { when: { field: 'fragranceFree', op: 'truthy' },
      icon: '&#x1F6AB;', title: 'Fragrance-free throughout', kicker: 'Your preference, applied to every item',
      body: 'Every product in this set is the fragrance-free version. If an extra is only made with fragrance, it has been left out rather than swapped.',
      linkUrl: '', linkLabel: 'See the ingredient list' },
    { when: { field: 'weeks', op: 'lte', value: 6 },
      icon: '&#x1F4C5;', title: 'Restock every {weeks} weeks', kicker: 'That is about {restocksPerYear} orders a year',
      body: 'A subscription would save you the reordering. Ask at checkout, or set it up from your account later.',
      linkUrl: '', linkLabel: 'How subscriptions work' }
  ],
  chips: [
    { field: 'skin' },
    { field: 'routine', when: { field: 'routine', op: 'truthy' } },
    { field: 'people', label: '{people} people sharing', when: { field: 'people', op: 'gt', value: 1 } }
  ],
  profileChips: [
    { field: 'skin', icon: '&#x1F9F4;' },
    { field: 'routine', icon: '&#x1F305;' },
    { field: 'weeks', icon: '&#x1F4C5;', label: 'Restock every {weeks} weeks' }
  ],
  cart: { mode: 'permalink', storeUrl: '', displayDomain: '', currencySymbol: '£', currency: 'GBP', redirectTo: '/cart' },
  promo: { code: '', pct: 0, endsAt: '' },
  stockWatch: {}
};
