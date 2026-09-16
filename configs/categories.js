/* ============================================================
   Category registry — "what am I building a configurator for?"

   This is the merchant's first decision, before any question exists. It picks
   the starting template, which they then edit. A merchant should never face an
   empty questionnaire; every entry here produces a working configurator on
   selection.

   Two entries are full templates. The rest are generated from a terse spec by
   `starter()` below — real, working configs with three questions, three tiers
   and two add-on rules, sized so the merchant edits rather than authors.

   Adding a category is adding one object to CATEGORIES. Nothing else in the
   app knows the list.
   ============================================================ */
(function (root) {
  'use strict';

  var BASE_COPY = {
    title: 'Build custom widget for configured check out',
    titleHighlight: 'configured check out',
    stepLabel: 'Step {current} of {total}',
    nextLabel: 'Continue',
    finishLabel: 'See my bundle',
    backLabel: 'Back',
    recommendationBadge: 'Your recommendation',
    whyTitle: 'Why this bundle?',
    contentsTitle: "What's included",
    addonsTitle: 'Worth adding',
    profileTitle: 'Your answers',
    orderTotalLabel: 'Order total',
    cartPanelLabel: 'Your cart will contain',
    cartHint: 'Opens checkout with everything pre-loaded.',
    ctaLabel: 'Add to cart',
    restartLabel: 'Start over',
    oosBadge: 'Out of stock',
    oosReason: 'Add it once back in stock'
  };

  /* Expand a terse spec into a full, valid config. */
  function starter(spec) {
    var tiers = spec.tiers;
    return {
      brand: { id: '', name: '', footerText: '', theme: {} },
      copy: Object.assign({}, BASE_COPY, {
        subtitle: spec.subtitle,
        resultSubtitle: 'Here is what we would put together.',
        priceSuffix: spec.priceSuffix || ''
      }, spec.copy || {}),
      derived: spec.derived || {},
      scene: {
        type: 'summary',
        title: spec.sceneTitle || 'Your build so far',
        options: {
          emptyTitle: spec.emptyTitle || 'Answer the first question',
          emptySub: 'to start building',
          rows: spec.sceneRows
        }
      },
      steps: [
        { id: 'level', type: 'choice', field: 'level', required: true,
          question: spec.q1, sub: spec.q1sub, options: spec.levels },
        { id: 'size', type: 'counters', question: spec.q2, sub: spec.q2sub, counters: spec.counters },
        { id: 'extras', type: 'multi', field: 'priorities', columns: 2,
          question: spec.q3, sub: spec.q3sub, options: spec.priorities }
      ],
      bundles: [
        { id: tiers[2].id, title: tiers[2].title, subtitle: tiers[2].sub, price: tiers[2].price,
          variantId: '', why: tiers[2].why, includes: tiers[2].includes || {}, contents: tiers[2].contents,
          when: { all: [{ field: 'level', op: 'eq', value: spec.levels[2].value }] } },
        { id: tiers[1].id, title: tiers[1].title, subtitle: tiers[1].sub, price: tiers[1].price,
          variantId: '', why: tiers[1].why, includes: tiers[1].includes || {}, contents: tiers[1].contents,
          when: { any: [
            { field: 'level', op: 'eq', value: spec.levels[1].value },
            { field: 'priorities', op: 'includes', value: spec.priorities[0].value }
          ] } },
        { id: tiers[0].id, title: tiers[0].title, subtitle: tiers[0].sub, price: tiers[0].price,
          variantId: '', why: tiers[0].why, includes: tiers[0].includes || {}, contents: tiers[0].contents }
      ],
      accessories: spec.accessories,
      addonRules: spec.addonRules,
      chips: spec.chips || [],
      profileChips: spec.profileChips || [],
      cart: { mode: 'permalink', storeUrl: '', displayDomain: '', currencySymbol: '£', currency: 'GBP' }
    };
  }

  /* ---------- the list ---------- */
  var CATEGORIES = [
    {
      id: 'house-accessories',
      label: 'House accessories',
      icon: '&#x1F3E1;',
      blurb: 'Kit fitted to a property — access, sensors, lighting, heating, storage. Sizes the bundle from doors, windows, floors and outbuildings.',
      scene: 'Property illustration',
      build: function () { return JSON.parse(JSON.stringify(root.BCFG_CONFIG_HOUSE_ACCESSORIES)); }
    },
    {
      id: 'subscription-box',
      label: 'Subscription boxes',
      icon: '&#x2615;',
      blurb: 'Recurring consumables — coffee, tea, pet food, refills. Sizes the box from consumption rate and household size.',
      scene: 'Answer summary',
      build: function () { return JSON.parse(JSON.stringify(root.BCFG_CONFIG_COFFEE)); }
    },
    {
      id: 'bike-build',
      label: 'Bike & e-mobility',
      icon: '&#x1F6B2;',
      blurb: 'A frame plus the parts that have to match it. Rules keep incompatible components out of the cart.',
      scene: 'Answer summary',
      build: function () { return starter({
        subtitle: 'Tell us how and where you ride and we will spec the build.',
        sceneTitle: 'Your build so far', emptyTitle: 'Pick a riding style',
        priceSuffix: 'complete build',
        sceneRows: [
          { icon: '&#x1F6B2;', label: 'Riding: {level}', when: { field: 'level', op: 'truthy' } },
          { icon: '&#x1F5FA;', label: '{weeklyKm} km a week', when: { field: 'level', op: 'truthy' } },
          { icon: '&#x1F9F0;', label: '{bikes} bike(s) in the household', when: { field: 'step', op: 'gt', value: 1 } }
        ],
        q1: 'What kind of riding is this for?', q1sub: 'Frame, gearing and tyres all follow from this.',
        levels: [
          { value: 'commute', icon: '&#x1F3D9;', label: 'Commuting', desc: 'Roads, all weather, racks and lights' },
          { value: 'road',    icon: '&#x1F6E3;', label: 'Road & distance', desc: 'Light frame, narrow tyres' },
          { value: 'trail',   icon: '&#x1F3D4;', label: 'Trail & gravel', desc: 'Suspension, wide tyres, disc brakes' }
        ],
        q2: 'How much riding?', q2sub: 'This sizes the drivetrain and the spares pack.',
        counters: [
          { field: 'weeklyKm', icon: '&#x1F4CF;', label: 'Kilometres a week', min: 5, max: 400, defaultValue: 60 },
          { field: 'bikes',    icon: '&#x1F46A;', label: 'Bikes in the household', min: 1, max: 6, defaultValue: 1 }
        ],
        q3: 'What matters most?', q3sub: 'Pick any that apply.',
        priorities: [
          { value: 'allweather', icon: '&#x2614;', label: 'All-weather' },
          { value: 'security',   icon: '&#x1F510;', label: 'Secure parking' },
          { value: 'cargo',      icon: '&#x1F4E6;', label: 'Carrying loads' },
          { value: 'speed',      icon: '&#x26A1;', label: 'Speed' }
        ],
        tiers: [
          { id: 'core', title: 'Core Build', sub: 'Frame, drivetrain, wheels', price: 749,
            why: 'A complete, reliable build for the distance you ride.',
            contents: [{ name: 'Frameset', detail: 'Alloy, your size', qty: 1 }, { name: 'Drivetrain', detail: '1×11 groupset', qty: 1 }, { name: 'Wheelset', detail: 'Tubeless-ready', qty: 1 }] },
          { id: 'plus', title: 'Plus Build', sub: 'Core plus finishing kit', price: 1149,
            why: 'Adds the parts that make a bike usable every day rather than just rideable.',
            includes: { lights: 1 },
            contents: [{ name: 'Frameset', detail: 'Alloy, your size', qty: 1 }, { name: 'Drivetrain', detail: '1×11 groupset', qty: 1 }, { name: 'Wheelset', detail: 'Tubeless-ready', qty: 1 }, { name: 'Light set', detail: 'Front and rear', qty: 1 }, { name: 'Mudguards', detail: 'Full length', qty: 1 }] },
          { id: 'pro', title: 'Pro Build', sub: 'Carbon, full finishing kit', price: 1899,
            why: 'For the distances you are covering, the weight and the wheels are where the money goes.',
            includes: { lights: 1, spares: 1 },
            contents: [{ name: 'Carbon frameset', detail: 'Your size', qty: 1 }, { name: 'Drivetrain', detail: '1×12 groupset', qty: 1 }, { name: 'Carbon wheelset', detail: 'Tubeless', qty: 1 }, { name: 'Light set', detail: 'Front and rear', qty: 1 }, { name: 'Spares pack', detail: 'Tubes, links, pads', qty: 1 }] }
        ],
        accessories: {
          lock:   { variantId: '', price: 79,  title: 'D-lock', image: '' },
          guards: { variantId: '', price: 42,  title: 'Full-length mudguards', image: '' },
          lights: { variantId: '', price: 55,  title: 'Light set', image: '' },
          rack:   { variantId: '', price: 65,  title: 'Rear rack & panniers', image: '' },
          spares: { variantId: '', price: 34,  title: 'Spares pack', image: '' }
        },
        addonRules: [
          { id: 'lock', accessory: 'lock', when: { field: 'priorities', op: 'includes', value: 'security' },
            text: 'D-lock', reason: 'You said secure parking matters' },
          { id: 'guards', accessory: 'guards', when: { all: [
              { field: 'priorities', op: 'includes', value: 'allweather' },
              { field: 'level', op: 'ne', value: 'road' } ] },
            text: 'Full-length mudguards', reason: 'You ride in all weather' },
          { id: 'lights', accessory: 'lights', qty: { expr: 'max(0, bikes - included)' },
            when: { field: 'bikes', op: 'gte', value: 1 },
            text: 'Light set × {qty}', reason: 'One per bike beyond what the build includes' },
          { id: 'rack', accessory: 'rack', when: { field: 'priorities', op: 'includes', value: 'cargo' },
            text: 'Rear rack & panniers', reason: 'For carrying loads' },
          { id: 'spares', accessory: 'spares', qty: { expr: 'max(0, ceil(weeklyKm / 120) - included)' },
            when: { field: 'weeklyKm', op: 'gte', value: 120 },
            text: 'Spares pack × {qty}', reason: 'At {weeklyKm} km a week you will get through them' }
        ],
        chips: [
          { field: 'level' },
          { field: 'weeklyKm', label: '{weeklyKm} km/week', when: { field: 'weeklyKm', op: 'gt', value: 0 } }
        ],
        profileChips: [{ field: 'level', icon: '&#x1F6B2;' }, { field: 'weeklyKm', icon: '&#x1F4CF;', label: '{weeklyKm} km a week' }]
      }); }
    },
    {
      id: 'desk-setup',
      label: 'Desk & studio setup',
      icon: '&#x1F5A5;',
      blurb: 'Desk, chair, monitor arms, audio, cable management. Sizes from how many screens and how many hours.',
      scene: 'Answer summary',
      build: function () { return starter({
        subtitle: 'Four questions about how you work and we will spec the desk.',
        sceneTitle: 'Your setup so far', emptyTitle: 'Pick how you work',
        priceSuffix: 'complete setup',
        sceneRows: [
          { icon: '&#x1F4BC;', label: 'Setup: {level}', when: { field: 'level', op: 'truthy' } },
          { icon: '&#x1F5A5;', label: '{screens} screen(s)', when: { field: 'level', op: 'truthy' } },
          { icon: '&#x23F1;', label: '{hours} hours a day', when: { field: 'step', op: 'gt', value: 1 } }
        ],
        q1: 'What is the desk for?', q1sub: 'Depth, surface and arm capacity follow from this.',
        levels: [
          { value: 'laptop', icon: '&#x1F4BB;', label: 'Laptop and notes', desc: 'One screen, light use' },
          { value: 'office', icon: '&#x1F5A5;', label: 'Full-time desk work', desc: 'Two screens, all day' },
          { value: 'studio', icon: '&#x1F3A7;', label: 'Studio / production', desc: 'Multiple screens, audio gear' }
        ],
        q2: 'How much of it?', q2sub: 'This sizes the desk, the arms and the power.',
        counters: [
          { field: 'screens', icon: '&#x1F5A5;', label: 'Screens', min: 1, max: 6, defaultValue: 2 },
          { field: 'hours',   icon: '&#x23F1;', label: 'Hours a day', min: 1, max: 14, defaultValue: 8 }
        ],
        q3: 'What matters most?', q3sub: 'Pick any that apply.',
        priorities: [
          { value: 'posture', icon: '&#x1FA91;', label: 'Posture' },
          { value: 'cables',  icon: '&#x1F50C;', label: 'Cable tidiness' },
          { value: 'audio',   icon: '&#x1F3A4;', label: 'Audio quality' },
          { value: 'space',   icon: '&#x1F4D0;', label: 'Small room' }
        ],
        tiers: [
          { id: 'desk', title: 'Desk Essentials', sub: 'Desk and chair', price: 429,
            why: 'The two things that matter for the hours you are putting in.',
            contents: [{ name: 'Desk', detail: '140 × 70 cm', qty: 1 }, { name: 'Task chair', detail: 'Adjustable lumbar', qty: 1 }] },
          { id: 'sitstand', title: 'Sit-Stand Setup', sub: 'Height-adjustable, arms included', price: 879,
            why: 'At {hours} hours a day the desk needs to move, not just the chair.',
            includes: { arm: 1 },
            contents: [{ name: 'Sit-stand desk', detail: '160 × 80 cm, electric', qty: 1 }, { name: 'Ergonomic chair', detail: 'Full adjustment', qty: 1 }, { name: 'Monitor arm', detail: 'Single', qty: 1 }] },
          { id: 'studio', title: 'Studio Setup', sub: 'Everything, wired and tidied', price: 1590,
            why: 'Multiple screens and audio gear need the desk depth and the power planned in from the start.',
            includes: { arm: 2, tray: 1 },
            contents: [{ name: 'Sit-stand desk', detail: '180 × 80 cm, electric', qty: 1 }, { name: 'Ergonomic chair', detail: 'Full adjustment', qty: 1 }, { name: 'Monitor arm', detail: 'Dual', qty: 2 }, { name: 'Cable tray & spine', detail: 'Under-desk', qty: 1 }, { name: 'Acoustic panel set', detail: 'Four panels', qty: 1 }] }
        ],
        accessories: {
          arm:      { variantId: '', price: 89, title: 'Monitor arm', image: '' },
          tray:     { variantId: '', price: 45, title: 'Cable tray', image: '' },
          mic:      { variantId: '', price: 129, title: 'Microphone & boom', image: '' },
          footrest: { variantId: '', price: 39, title: 'Footrest', image: '' }
        },
        addonRules: [
          { id: 'arm', accessory: 'arm', qty: { expr: 'max(0, screens - included)' },
            when: { field: 'screens', op: 'gte', value: 1 },
            text: 'Monitor arm × {qty}', reason: 'One per screen beyond what the desk includes' },
          { id: 'tray', accessory: 'tray', when: { field: 'priorities', op: 'includes', value: 'cables' },
            text: 'Cable tray', reason: 'You said cable tidiness matters' },
          { id: 'mic', accessory: 'mic', when: { field: 'priorities', op: 'includes', value: 'audio' },
            text: 'Microphone & boom', reason: 'For audio quality' },
          { id: 'footrest', accessory: 'footrest', when: { all: [
              { field: 'priorities', op: 'includes', value: 'posture' },
              { field: 'hours', op: 'gte', value: 6 } ] },
            text: 'Footrest', reason: '{hours} hours a day seated' }
        ],
        chips: [{ field: 'level' }, { field: 'screens', label: '{screens} screen{s}', when: { field: 'screens', op: 'gt', value: 0 } }],
        profileChips: [{ field: 'level', icon: '&#x1F4BC;' }, { field: 'hours', icon: '&#x23F1;', label: '{hours} hours a day' }]
      }); }
    },
    {
      id: 'skincare',
      label: 'Regimen & routine',
      icon: '&#x1F9F4;',
      blurb: 'Skincare, supplements, haircare — anything sold as a sequence rather than a single item. Sizes from concerns and routine length.',
      scene: 'Answer summary',
      build: function () { return starter({
        subtitle: 'Tell us about your skin and we will build the routine around it.',
        sceneTitle: 'Your routine so far', emptyTitle: 'Pick your skin type',
        priceSuffix: 'per routine',
        sceneRows: [
          { icon: '&#x1F9F4;', label: 'Skin: {level}', when: { field: 'level', op: 'truthy' } },
          { icon: '&#x1F31E;', label: '{steps} step routine', when: { field: 'level', op: 'truthy' } },
          { icon: '&#x1F4C5;', label: 'Restocks every {weeks} weeks', when: { field: 'step', op: 'gt', value: 1 } }
        ],
        q1: 'How would you describe your skin?', q1sub: 'Everything else is built around this.',
        levels: [
          { value: 'dry',       icon: '&#x1F4A7;', label: 'Dry or tight', desc: 'Flaking, feels tight after washing' },
          { value: 'combo',     icon: '&#x2696;', label: 'Combination', desc: 'Oily T-zone, dry elsewhere' },
          { value: 'sensitive', icon: '&#x1F338;', label: 'Sensitive or reactive', desc: 'Redness, stings easily' }
        ],
        q2: 'How much of a routine do you want?', q2sub: 'We will not recommend more steps than you asked for.',
        counters: [
          { field: 'steps', icon: '&#x1F522;', label: 'Steps morning & night', min: 2, max: 8, defaultValue: 4 },
          { field: 'weeks', icon: '&#x1F4C5;', label: 'Weeks between restocks', min: 4, max: 16, defaultValue: 8 }
        ],
        q3: 'What are you treating?', q3sub: 'Pick any that apply.',
        priorities: [
          { value: 'barrier',  icon: '&#x1F6E1;', label: 'Barrier repair' },
          { value: 'texture',  icon: '&#x1F52C;', label: 'Texture' },
          { value: 'pigment',  icon: '&#x2600;', label: 'Pigmentation' },
          { value: 'breakout', icon: '&#x1F534;', label: 'Breakouts' }
        ],
        tiers: [
          { id: 'core', title: 'Core Routine', sub: 'Cleanse, treat, protect', price: 62,
            why: 'Three products, used consistently, do most of the work.',
            contents: [{ name: 'Gentle cleanser', detail: '150 ml', qty: 1 }, { name: 'Moisturiser', detail: '50 ml', qty: 1 }, { name: 'SPF 50', detail: '50 ml', qty: 1 }] },
          { id: 'full', title: 'Full Routine', sub: 'Core plus actives', price: 118,
            why: 'A {steps}-step routine needs the actives spaced properly, which is what this set does.',
            includes: { serum: 1 },
            contents: [{ name: 'Gentle cleanser', detail: '150 ml', qty: 1 }, { name: 'Treatment serum', detail: '30 ml', qty: 1 }, { name: 'Moisturiser', detail: '50 ml', qty: 1 }, { name: 'SPF 50', detail: '50 ml', qty: 1 }] },
          { id: 'barrier', title: 'Barrier Routine', sub: 'Fragrance-free throughout', price: 134,
            why: 'Reactive skin does better with fewer actives and a heavier occlusive, so that is what this leads with.',
            includes: { serum: 1, balm: 1 },
            contents: [{ name: 'Cream cleanser', detail: '150 ml, fragrance-free', qty: 1 }, { name: 'Barrier serum', detail: '30 ml', qty: 1 }, { name: 'Repair balm', detail: '50 ml', qty: 1 }, { name: 'Mineral SPF 30', detail: '50 ml', qty: 1 }] }
        ],
        accessories: {
          serum:   { variantId: '', price: 38, title: 'Treatment serum', image: '' },
          balm:    { variantId: '', price: 29, title: 'Repair balm', image: '' },
          exfoli:  { variantId: '', price: 26, title: 'Exfoliating toner', image: '' },
          spot:    { variantId: '', price: 18, title: 'Spot treatment', image: '' }
        },
        addonRules: [
          { id: 'serum', accessory: 'serum', qty: { expr: 'max(0, ceil(steps / 4) - included)' },
            when: { field: 'steps', op: 'gte', value: 4 },
            text: 'Treatment serum × {qty}', reason: 'Your {steps}-step routine has room for it' },
          { id: 'balm', accessory: 'balm', when: { field: 'priorities', op: 'includes', value: 'barrier' },
            text: 'Repair balm', reason: 'You said barrier repair' },
          { id: 'exfoli', accessory: 'exfoli', when: { all: [
              { field: 'priorities', op: 'includes', value: 'texture' },
              { field: 'level', op: 'ne', value: 'sensitive' } ] },
            text: 'Exfoliating toner', reason: 'For texture — left out for reactive skin' },
          { id: 'spot', accessory: 'spot', when: { field: 'priorities', op: 'includes', value: 'breakout' },
            text: 'Spot treatment', reason: 'For breakouts' }
        ],
        chips: [{ field: 'level' }, { field: 'steps', label: '{steps} steps', when: { field: 'steps', op: 'gt', value: 0 } }],
        profileChips: [{ field: 'level', icon: '&#x1F9F4;' }, { field: 'steps', icon: '&#x1F522;', label: '{steps} steps' }]
      }); }
    },
    {
      id: 'blank',
      label: 'Start from blank',
      icon: '&#x2795;',
      blurb: 'Two placeholder questions and two tiers. Use this when none of the templates is close enough to be worth editing.',
      scene: 'Answer summary',
      build: function () {
        return {
          brand: { id: '', name: '', footerText: '', theme: {} },
          copy: Object.assign({}, BASE_COPY, {
            subtitle: 'Replace these questions with your own.',
            resultSubtitle: 'Here is the recommendation.',
            priceSuffix: ''
          }),
          scene: { type: 'summary', title: 'Your answers', options: {
            emptyTitle: 'Answer the first question', emptySub: 'to start building',
            rows: [{ icon: '&#x25C8;', label: 'Choice: {choice}', when: { field: 'choice', op: 'truthy' } },
                   { icon: '&#x1F522;', label: 'Quantity: {quantity}', when: { field: 'choice', op: 'truthy' } }] } },
          steps: [
            { id: 'q1', type: 'choice', field: 'choice', required: true,
              question: 'First question', sub: 'Replace this with the first thing you need to know.',
              options: [
                { value: 'a', icon: '&#x25CF;', label: 'First option', desc: 'Describe it here' },
                { value: 'b', icon: '&#x25B2;', label: 'Second option', desc: 'Describe it here' }
              ] },
            { id: 'q2', type: 'counters', question: 'How many?', sub: 'Use this to size the bundle.',
              counters: [{ field: 'quantity', icon: '&#x1F522;', label: 'Quantity', min: 1, max: 20, defaultValue: 1 }] }
          ],
          bundles: [
            { id: 'b', title: 'Second Bundle', subtitle: 'Shown for the second option', price: 199, variantId: '',
              why: 'Explain here why this is the right pick.',
              contents: [{ name: 'Placeholder item', detail: 'Swap for a real product', qty: 1 }],
              when: { field: 'choice', op: 'eq', value: 'b' } },
            { id: 'a', title: 'First Bundle', subtitle: 'The fallback', price: 99, variantId: '',
              why: 'Explain here why this is the right pick.',
              contents: [{ name: 'Placeholder item', detail: 'Swap for a real product', qty: 1 }] }
          ],
          accessories: { extra: { variantId: '', price: 25, title: 'Placeholder add-on', image: '' } },
          addonRules: [
            { id: 'extra', accessory: 'extra', qty: { expr: 'quantity' },
              when: { field: 'quantity', op: 'gte', value: 1 },
              text: 'Placeholder add-on × {qty}', reason: 'Quantity drives how many' }
          ],
          chips: [{ field: 'choice' }],
          profileChips: [{ field: 'choice', icon: '&#x25C8;' }],
          cart: { mode: 'permalink', storeUrl: '', displayDomain: '', currencySymbol: '£', currency: 'GBP' }
        };
      }
    }
  ];

  root.BCFG_CATEGORIES = CATEGORIES;
  root.BCFG_STARTER = starter;
})(typeof window !== 'undefined' ? window : this);
