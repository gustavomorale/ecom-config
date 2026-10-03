/* ============================================================
   Category template — Gift finder.
   Full template (not a starter), for any store in the gifting season:
   who it is for, budget, what they are into, and finishing touches. The
   budget picks the gift set; interests and toggles add the extras.
   Sets can be one bundle product (variantId) or several products listed
   as `components`, which all go in the cart. Every name and price here is
   placeholder copy for the merchant to replace.
   ============================================================ */
window.BCFG_CONFIG_GIFT_FINDER = {
  brand: { id: '', name: '', footerText: '', theme: {} },
  copy: {
    title: 'Find the perfect gift',
    titleHighlight: 'perfect gift',
    subtitle: 'Four quick questions and we will put a gift together, ready to give.',
    resultSubtitle: 'Here is what we would give them.',
    stepLabel: 'Step {current} of {total}',
    nextLabel: 'Continue', finishLabel: 'See my gift', backLabel: 'Back',
    recommendationBadge: 'Our pick',
    whyTitle: 'Why this gift?', contentsTitle: "What's in the gift",
    addonsTitle: 'Nice to add', profileTitle: 'Your answers',
    priceSuffix: 'gift set', orderTotalLabel: 'Order total',
    cartPanelLabel: 'Your cart will contain',
    cartHint: 'Opens checkout with the gift and extras pre-loaded.',
    ctaLabel: 'Add gift to cart', restartLabel: 'Start over',
    promoPill: 'Save {pct}% with code {code}',
    promoNote: 'Code {code} ({pct}% off) applied automatically at checkout',
    oosBadge: 'Out of stock', oosReason: 'Add it once back in stock',
    requiredHint: 'Choose an option to continue'
  },
  scene: {
    type: 'summary', title: 'Your gift so far',
    options: {
      emptyTitle: 'Who is it for?', emptySub: 'to start choosing',
      rows: [
        { icon: '&#x1F381;', label: 'For: {recipient_label}', when: { field: 'recipient', op: 'truthy' } },
        { icon: '&#x1F4B7;', label: 'Budget: {budget_label}', when: { field: 'budget', op: 'truthy' } },
        { icon: '&#x2B50;', label: 'Into: {interests_label}', when: { field: 'step', op: 'gt', value: 2 } }
      ]
    }
  },
  steps: [
    { id: 'recipient', type: 'choice', field: 'recipient', required: true,
      question: 'Who is the gift for?', sub: 'It shapes the tone of the set.',
      options: [
        { value: 'partner',   icon: '&#x2764;',  label: 'Partner',          desc: 'Something personal' },
        { value: 'parent',    icon: '&#x1F3E1;', label: 'Parent',           desc: 'A proper treat' },
        { value: 'friend',    icon: '&#x1F91D;', label: 'Friend',           desc: 'Fun and thoughtful' },
        { value: 'child',     icon: '&#x1F388;', label: 'Child or teen',    desc: 'Something to open and use' },
        { value: 'colleague', icon: '&#x1F4BC;', label: 'Colleague or Secret Santa', desc: 'Safe to give anyone' }
      ] },
    { id: 'budget', type: 'choice', field: 'budget', required: true,
      question: 'What would you like to spend?', sub: 'We keep the whole gift inside it.',
      options: [
        { value: 'under25', icon: '&#x1F4B7;', label: 'Under £25' },
        { value: 'to50',    icon: '&#x1F4B7;', label: '£25 to £50' },
        { value: 'to100',   icon: '&#x1F4B7;', label: '£50 to £100' },
        { value: 'over100', icon: '&#x1F4B7;', label: 'Over £100' }
      ] },
    { id: 'interests', type: 'multi', field: 'interests', columns: 2,
      question: 'What are they into?', sub: 'Pick any that apply. We add a little something to match.',
      options: [
        { value: 'home',    icon: '&#x1F56F;', label: 'Cosy nights in' },
        { value: 'food',    icon: '&#x1F36B;', label: 'Food and drink' },
        { value: 'pamper',  icon: '&#x1F6C1;', label: 'Pampering' },
        { value: 'outdoor', icon: '&#x1F332;', label: 'The outdoors' },
        { value: 'tech',    icon: '&#x1F50C;', label: 'Gadgets' },
        { value: 'style',   icon: '&#x1F45C;', label: 'Style' }
      ] },
    { id: 'finish', type: 'toggles', question: 'Any finishing touches?', sub: 'Optional, added to the same order.',
      toggles: [
        { field: 'wrap', icon: '&#x1F380;', label: 'Gift wrap it' },
        { field: 'card', icon: '&#x1F48C;', label: 'Add a card' }
      ] }
  ],
  // First match wins. Budget decides the set; the last one is the fallback.
  bundles: [
    { id: 'showstopper', title: 'The Showstopper', subtitle: 'Our best, presented in a keepsake box', price: 145, variantId: '',
      why: 'For a budget like this, one standout piece and a proper presentation box beat a pile of smaller things.',
      contents: [
        { name: 'Signature piece', detail: 'Our best-selling premium item', qty: 1 },
        { name: 'Matching accessory', detail: 'Chosen to go with it', qty: 1 },
        { name: 'Keepsake box', detail: 'Ready to give', qty: 1 }
      ],
      when: { field: 'budget', op: 'eq', value: 'over100' } },
    { id: 'treat', title: 'The Treat Set', subtitle: 'Three favourites in a gift box', price: 79, variantId: '',
      why: 'Three things they will actually use, boxed together so it feels like one gift.',
      contents: [
        { name: 'Hero product', detail: 'Full size', qty: 1 },
        { name: 'Companion product', detail: 'Full size', qty: 1 },
        { name: 'Small indulgence', detail: 'A little extra', qty: 1 },
        { name: 'Gift box', detail: 'With tissue', qty: 1 }
      ],
      when: { field: 'budget', op: 'eq', value: 'to100' } },
    { id: 'thoughtful', title: 'The Thoughtful Pair', subtitle: 'Two pieces that go together', price: 42, variantId: '',
      why: 'Two pieces that belong together look considered, not last-minute.',
      contents: [
        { name: 'Main gift', detail: 'Full size', qty: 1 },
        { name: 'Something to go with it', detail: 'Chosen to match', qty: 1 }
      ],
      when: { field: 'budget', op: 'eq', value: 'to50' } },
    { id: 'filler', title: 'The Little Something', subtitle: 'A small gift that does not look small', price: 19, variantId: '',
      why: 'Under £25 is about one well-chosen thing, nicely presented.',
      contents: [
        { name: 'Mini favourite', detail: 'Travel or mini size', qty: 1 },
        { name: 'Gift pouch', detail: 'Ready to give', qty: 1 }
      ] }
  ],
  accessories: {
    wrap:    { variantId: '', price: 4,  title: 'Gift wrapping', image: '' },
    card:    { variantId: '', price: 3,  title: 'Greetings card', image: '' },
    candle:  { variantId: '', price: 12, title: 'Scented candle', image: '' },
    treats:  { variantId: '', price: 9,  title: 'Chocolate truffles', image: '' },
    bath:    { variantId: '', price: 10, title: 'Bath soak', image: '' },
    bottle:  { variantId: '', price: 15, title: 'Insulated bottle', image: '' },
    charger: { variantId: '', price: 18, title: 'Pocket power bank', image: '' },
    socks:   { variantId: '', price: 8,  title: 'Cosy socks', image: '' }
  },
  addonRules: [
    { id: 'wrap', accessory: 'wrap', when: { field: 'wrap', op: 'truthy' },
      text: 'Gift wrapping', reason: 'You asked for it wrapped' },
    { id: 'card', accessory: 'card', when: { field: 'card', op: 'truthy' },
      text: 'Greetings card', reason: 'For your own message' },
    { id: 'candle', accessory: 'candle', when: { field: 'interests', op: 'includes', value: 'home' },
      text: 'Scented candle', reason: 'For cosy nights in' },
    { id: 'treats', accessory: 'treats', when: { field: 'interests', op: 'includes', value: 'food' },
      text: 'Chocolate truffles', reason: 'They like food and drink' },
    { id: 'bath', accessory: 'bath', when: { field: 'interests', op: 'includes', value: 'pamper' },
      text: 'Bath soak', reason: 'A little pampering' },
    { id: 'bottle', accessory: 'bottle', when: { field: 'interests', op: 'includes', value: 'outdoor' },
      text: 'Insulated bottle', reason: 'For days outdoors' },
    { id: 'charger', accessory: 'charger', when: { field: 'interests', op: 'includes', value: 'tech' },
      text: 'Pocket power bank', reason: 'They like gadgets' },
    { id: 'socks', accessory: 'socks', when: { all: [
        { field: 'recipient', op: 'eq', value: 'colleague' },
        { field: 'budget', op: 'eq', value: 'under25' } ] },
      text: 'Cosy socks', reason: 'A safe extra for anyone' }
  ],
  chips: [
    { field: 'recipient' },
    { field: 'budget', when: { field: 'budget', op: 'truthy' } }
  ],
  profileChips: [
    { field: 'recipient', icon: '&#x1F381;' },
    { field: 'budget', icon: '&#x1F4B7;' }
  ],
  cart: { mode: 'permalink', storeUrl: '', displayDomain: '', currencySymbol: '£', currency: 'GBP', redirectTo: '/cart' },
  promo: { code: '', pct: 0, endsAt: '' },
  stockWatch: {}
};
