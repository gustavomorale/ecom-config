/* ============================================================
   Category template — House accessories.

   A property questionnaire that sizes a kit from the shape of a home:
   entry points, floors, outbuildings, pets. Suits anything fitted to a
   house — access control, sensors, lighting, heating, water, storage.

   No brand identity, no colours and no real variant IDs. The brand block
   is deliberately empty: the widget stamps nothing of its own, and a store
   that sets none of it simply shows no attribution at all.
   ============================================================ */
window.BCFG_CONFIG_HOUSE_ACCESSORIES = {

  brand: {
    id: '',            // merchant's own slug for this configurator
    name: '',          // shown in the footer only if the merchant sets it
    footerText: '',
    theme: {}          // no colour of our own — inherited or merchant-set
  },

  copy: {
    title: 'Build your home security kit',
    titleHighlight: 'home security kit',
    subtitle: "Answer a few quick questions about your home and we'll recommend the right setup.",
    resultSubtitle: "Here's your personalised recommendation.",
    footerPrefix: '',
    stepLabel: 'Step {current} of {total}',
    nextLabel: 'Continue',
    finishLabel: 'See my bundle',
    backLabel: 'Back',
    recommendationBadge: 'Your recommendation',
    whyTitle: 'Why this bundle?',
    contentsTitle: "What's in the box",
    addonsTitle: 'Recommended add-ons for your home',
    profileTitle: 'Your answers',
    priceSuffix: 'one-off',
    orderTotalLabel: 'Order total',
    cartPanelLabel: 'Your cart will contain',
    cartHint: 'Click below to open checkout with everything pre-loaded.',
    ctaLabel: 'Add to cart',
    restartLabel: 'Start over',
    oosBadge: 'Out of stock',
    oosReason: 'Add it once back in stock',
    promoPill: 'Save {pct}% with code {code}',
    promoNote: 'Code {code} ({pct}% off) applied automatically at checkout',
    includesNote: '<strong>All bundles include:</strong> app control (iOS &amp; Android), voice-assistant compatibility, expandable accessory support and tamper protection on every sensor.'
  },

  /* Derived values usable in any `when` / `qty` expression */
  derived: {
    entryPoints: 'doors + min(windows, 6)'
  },

  scene: {
    type: 'house',
    title: 'Your home',
    showLabel: 'Show your home',
    hideLabel: 'Hide preview',
    options: {
      fields: { type: 'homeType', doors: 'doors', windows: 'windows', floors: 'floors', garage: 'hasGarage', shed: 'hasShed', garden: 'hasGarden', second: 'hasSecondUnit', pets: 'hasPets', petSize: 'petSize' },
      flatValue: 'flat',
      attachedValues: ['semi', 'terraced'],
      petScale: { small: 0.8, medium: 1.1, large: 1.4 },
      labels: { garage: 'GARAGE', shed: 'SHED', second: 'SECOND HOME', secondPill: '2nd Hub', motion: 'Motion sensor', siren: 'Outdoor siren', empty: 'Choose your home type', emptySub: 'to start building' },
      sirenWhen: { any: [{ field: 'priorities', op: 'includes', value: 'deterrent' }, { field: 'priorities', op: 'includes', value: 'breakins' }] }
    }
  },

  steps: [
    {
      id: 'home_type', type: 'choice', field: 'homeType', required: true,
      question: 'What type of home do you live in?',
      sub: 'This helps us understand your entry points and layout.',
      options: [
        { value: 'flat',     icon: '&#x1F3E2;', label: 'Flat / Apartment', desc: 'Typically 1 floor, 1 main door', defaults: { doors: 1, windows: 2, floors: 1, hasGarage: false, hasShed: false, hasGarden: false } },
        { value: 'terraced', icon: '&#x1F3D8;', label: 'Terraced house',   desc: '2–3 floors, front & back doors',  defaults: { doors: 2, windows: 3, floors: 2, hasGarage: false, hasShed: false, hasGarden: true } },
        { value: 'semi',     icon: '&#x1F3E0;', label: 'Semi-detached',    desc: '2–3 floors, side access possible', defaults: { doors: 2, windows: 4, floors: 2, hasGarage: true, hasShed: false, hasGarden: true } },
        { value: 'detached', icon: '&#x1F3E1;', label: 'Detached house',   desc: 'Full perimeter, multiple entries', defaults: { doors: 3, windows: 6, floors: 2, hasGarage: true, hasShed: true, hasGarden: true } },
        { value: 'bungalow', icon: '&#x1F6D6;', label: 'Bungalow',         desc: 'Single storey, more ground-floor glazing', defaults: { doors: 2, windows: 5, floors: 1, hasGarage: true, hasShed: true, hasGarden: true } }
      ]
    },
    {
      id: 'doors', type: 'counters',
      question: 'How many exterior doors?',
      sub: 'Count your front door, back door, side doors and patio doors.',
      counters: [{ field: 'doors', icon: '&#x1F6AA;', label: 'Exterior doors', min: 1, max: 8, defaultValue: 1 }],
      tip: "<strong>Tip:</strong> don't forget patio doors, French doors and side entrances."
    },
    {
      id: 'space', type: 'counters',
      question: 'Tell us about your space',
      sub: 'Ground-floor windows and number of floors both affect coverage.',
      counters: [
        { field: 'windows', icon: '&#x1FA9F;', label: 'Ground-floor windows', min: 0, max: 15, defaultValue: 2 },
        { field: 'floors',  icon: '&#x1F3E2;', label: 'Number of floors',     min: 1, max: 4,  defaultValue: 1 }
      ],
      tip: '<strong>Tip:</strong> ground-floor windows are the most vulnerable — watch them appear on your home.'
    },
    {
      id: 'outdoor', type: 'toggles',
      question: 'Any outdoor areas to protect?',
      sub: 'Outbuildings and gardens are common targets.',
      toggles: [
        { field: 'hasGarage',     icon: '&#x1F697;', label: 'Garage' },
        { field: 'hasShed',       icon: '&#x1F3DA;', label: 'Shed' },
        { field: 'hasGarden',     icon: '&#x1F333;', label: 'Garden' },
        { field: 'hasSecondUnit', icon: '&#x1F3D6;', label: 'Second property' }
      ]
    },
    {
      id: 'pets', type: 'boolean', field: 'hasPets', layout: 'grid',
      question: 'Any pets at home?',
      sub: "We'll make sure motion sensors aren't triggered by your animals.",
      options: [
        { value: true,  icon: '&#x1F43E;', label: 'Yes, I have pets' },
        { value: false, icon: '&#x1F6AB;', label: 'No pets' }
      ],
      followUp: {
        field: 'petSize', label: 'How big is your largest pet?',
        when: { field: 'hasPets', op: 'eq', value: true },
        options: [
          { value: 'small',  icon: '&#x1F431;', label: 'Small',  desc: 'Cat or small dog (under 10 kg)' },
          { value: 'medium', icon: '&#x1F415;', label: 'Medium', desc: 'Spaniel, beagle (10–25 kg)' },
          { value: 'large',  icon: '&#x1F415;', label: 'Large',  desc: 'Labrador, shepherd (over 25 kg)' }
        ]
      },
      tip: '<strong>Good news:</strong> pet-tolerant motion sensors ignore movement from animals up to 25 kg.'
    },
    {
      id: 'priorities', type: 'multi', field: 'priorities',
      question: 'What matters most to you?',
      sub: "Pick all that apply — we'll tailor the recommendation.",
      options: [
        { value: 'breakins',  icon: '&#x1F510;', label: 'Break-ins' },
        { value: 'parcels',   icon: '&#x1F4E6;', label: 'Package theft' },
        { value: 'outdoors',  icon: '&#x1F33F;', label: 'Garden / shed' },
        { value: 'deterrent', icon: '&#x1F514;', label: 'Loud deterrent' },
        { value: 'alerts',    icon: '&#x1F4F1;', label: 'Remote alerts' },
        { value: 'simple',    icon: '&#x26A1;',  label: 'Easy setup' }
      ]
    }
  ],

  /* First matching bundle wins; the last entry should have no `when`. */
  bundles: [
    {
      id: 'essential', title: 'Essential Kit', subtitle: '5-piece bundle',
      variantId: '00000000000001', price: 113.90, image: '',
      when: { all: [
        { expr: 'entryPoints', op: 'lte', value: 3 },
        { field: 'hasGarage', op: 'falsy' },
        { field: 'hasShed', op: 'falsy' },
        { field: 'floors', op: 'lte', value: 1 }
      ]},
      why: 'Right-sized for flats and compact homes with few entry points.',
      includes: { doorSensor: 1, motionSensor: 1 },
      contents: [
        { name: 'Smart hub',        detail: 'Wi-Fi with cellular backup', qty: 1, image: '' },
        { name: 'Motion sensor',    detail: 'Detects movement up to 12 m', qty: 1, image: '' },
        { name: 'Door/window sensor', detail: 'Magnetic contact sensor',   qty: 1, image: '' },
        { name: 'Remote control',   detail: 'Arm / disarm / panic',        qty: 2, image: '' }
      ]
    },
    {
      id: 'plus', title: 'Deterrent Plus Kit', subtitle: '7-piece bundle',
      variantId: '00000000000002', price: 152.90, image: '',
      when: { any: [
        { expr: 'entryPoints', op: 'lte', value: 6 },
        { field: 'priorities', op: 'includes', value: 'deterrent' },
        { field: 'priorities', op: 'includes', value: 'breakins' }
      ]},
      why: 'The most popular bundle — live and dummy sirens for maximum visible deterrence.',
      includes: { doorSensor: 1, motionSensor: 1 },
      contents: [
        { name: 'Smart hub',          detail: 'Wi-Fi with cellular backup', qty: 1, image: '' },
        { name: 'Motion sensor',      detail: 'Detects movement up to 12 m', qty: 1, image: '' },
        { name: 'Door/window sensor', detail: 'Magnetic contact sensor',     qty: 1, image: '' },
        { name: 'Remote control',     detail: 'Arm / disarm / panic',        qty: 2, image: '' },
        { name: 'Outdoor siren',      detail: '104 dB weatherproof sounder', qty: 1, image: '' },
        { name: 'Dummy siren',        detail: 'Visible deterrent, no sound', qty: 1, image: '' }
      ]
    },
    {
      id: 'complete', title: 'Complete Entrance Kit', subtitle: '8-piece bundle',
      variantId: '00000000000003', price: 163.90, image: '',
      why: 'Built around your entry points — three contact sensors, a pet-tolerant motion sensor and a 104 dB sounder. Suits larger homes with more ground-floor exposure.',
      includes: { doorSensor: 3, motionSensor: 1 },
      contents: [
        { name: 'Smart hub',          detail: 'Wi-Fi with cellular backup',   qty: 1, image: '' },
        { name: 'Motion sensor',      detail: 'Pet-tolerant, up to 12 m',     qty: 1, image: '' },
        { name: 'Door/window sensor', detail: 'Magnetic contact sensor',      qty: 3, image: '' },
        { name: 'Remote control',     detail: 'Arm / disarm / panic',         qty: 2, image: '' },
        { name: 'Outdoor siren',      detail: '104 dB battery sounder',       qty: 1, image: '' }
      ]
    }
  ],

  accessories: {
    doorSensor:   { title: 'Door/window sensor', variantId: '00000000000011', price: 24.99, image: '' },
    motionSensor: { title: 'Pet-tolerant motion sensor', variantId: '00000000000012', price: 39.99, image: '' },
    siren:        { title: 'Outdoor siren',      variantId: '00000000000013', price: 49.99, image: '' },
    hub:          { title: 'Additional hub',     variantId: '00000000000014', price: 69.90, image: '' }
  },

  /* `included` = how many of this accessory the chosen bundle already contains. */
  addonRules: [
    { id: 'extraDoors', accessory: 'doorSensor',
      when: { expr: 'doors - included', op: 'gt', value: 0 },
      qty: { expr: 'max(0, doors - included)' },
      text: '+{qty} extra door sensor{s}', reason: '{doors} doors in total' },

    { id: 'windowSensors', accessory: 'doorSensor',
      when: { field: 'windows', op: 'gt', value: 2 },
      qty: { expr: 'min(windows, 3)' },
      text: '+{qty} window sensor{s}', reason: '{windows} ground-floor windows' },

    { id: 'garage', accessory: 'doorSensor',
      when: { field: 'hasGarage', op: 'truthy' }, qty: 1,
      text: '+1 door sensor for the garage', reason: 'Protect garage entry' },

    { id: 'shed', accessory: 'doorSensor',
      when: { field: 'hasShed', op: 'truthy' }, qty: 1,
      text: '+1 door sensor for the shed', reason: 'Protect outbuilding' },

    { id: 'petMotion', accessory: 'motionSensor',
      when: { all: [{ field: 'hasPets', op: 'truthy' }, { field: 'petSize', op: 'in', value: ['small', 'medium'] }] }, qty: 1,
      text: 'Swap to a pet-tolerant motion sensor', reason: 'Safe with pets up to 25 kg' },

    { id: 'petLarge', advisory: true,
      when: { all: [{ field: 'hasPets', op: 'truthy' }, { field: 'petSize', op: 'eq', value: 'large' }] },
      text: 'Use contact sensors only in pet areas', reason: 'Pet over 25 kg may trigger motion sensors' },

    { id: 'extraMotion', accessory: 'motionSensor',
      when: { expr: 'floors - included', op: 'gt', value: 0 },
      qty: { expr: 'max(0, floors - included)' },
      text: '+{qty} extra motion sensor{s}', reason: 'Cover all {floors} floors' },

    { id: 'siren', accessory: 'siren',
      when: { all: [{ field: 'bundleId', op: 'eq', value: 'essential' }, { field: 'priorities', op: 'includes', value: 'deterrent' }] }, qty: 1,
      text: '+1 outdoor siren', reason: 'Loud deterrent requested' },

    { id: 'secondHub', accessory: 'hub',
      when: { field: 'hasSecondUnit', op: 'truthy' }, qty: 1,
      text: '+1 smart hub (second property)', reason: 'Second site — one app, two hubs' }
  ],

  callouts: [
    {
      when: { field: 'hasSecondUnit', op: 'truthy' },
      icon: '&#x1F4E1;', title: 'Second hub — second property', kicker: 'Multi-property from one app',
      body: 'Your second hub connects to the same account, giving you control of both properties. Each hub runs independently, so the second site stays protected while you are at home.',
      linkUrl: '', linkLabel: 'View the hub'
    }
  ],

  chips: [
    { field: 'homeType', when: { field: 'homeType', op: 'truthy' } },
    { field: 'doors',   when: { field: 'step', op: 'gt', value: 1 }, label: '{doors} door{s}',     color: '#2980b9' },
    { field: 'windows', when: { field: 'step', op: 'gt', value: 2 }, label: '{windows} window{s}', color: '#27ae60' },
    { field: 'floors',  when: { field: 'step', op: 'gt', value: 2 }, label: '{floors} floor{s}',   color: '#e67e22' },
    { field: 'hasPets', when: { all: [{ field: 'step', op: 'gt', value: 4 }, { field: 'hasPets', op: 'truthy' }] }, label: 'Pet ({petSize})' }
  ],

  profileChips: [
    { field: 'homeType', icon: '&#x1F3E0;', when: { field: 'homeType', op: 'truthy' } },
    { field: 'doors',   icon: '&#x1F6AA;', label: '{doors} door{s}' },
    { field: 'windows', icon: '&#x1FA9F;', label: '{windows} window{s}' },
    { field: 'floors',  icon: '&#x1F3E2;', label: '{floors} floor{s}' },
    { field: 'hasGarage',     icon: '&#x1F697;', label: 'Garage',           when: { field: 'hasGarage', op: 'truthy' } },
    { field: 'hasShed',       icon: '&#x1F3DA;', label: 'Shed',             when: { field: 'hasShed', op: 'truthy' } },
    { field: 'hasGarden',     icon: '&#x1F333;', label: 'Garden',           when: { field: 'hasGarden', op: 'truthy' } },
    { field: 'hasSecondUnit', icon: '&#x1F4E1;', label: 'Second property',  when: { field: 'hasSecondUnit', op: 'truthy' } },
    { field: 'hasPets',       icon: '&#x1F43E;', label: 'Pet ({petSize})',  when: { field: 'hasPets', op: 'truthy' } }
  ],

  cart: {
    mode: 'permalink',                      // 'permalink' | 'ajax'
    storeUrl: 'https://example-store.myshopify.com',
    displayDomain: 'example-store.com',
    currency: 'GBP', currencySymbol: '£', locale: 'en-GB'
  },

  /* Set `code` to '' to disable. `pct` must match the Shopify discount. */
  promo: { code: '', pct: 0, endsAt: '' },

  /* variantId -> product handle. Watched items are still recommended but kept
     out of the pre-filled cart until the storefront confirms availability. */
  stockWatch: {}
};
