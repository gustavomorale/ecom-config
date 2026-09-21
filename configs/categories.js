/* ============================================================
   Category registry — "what am I building a configurator for?"

   This is the merchant's first decision, before any question exists. It picks
   the starting template, which they then edit. A merchant should never face an
   empty questionnaire; every entry here produces a working configurator on
   selection.

   Three entries are full templates. The rest are generated from a terse spec by
   `starter()` below — real, working configs with three questions, three tiers
   and two add-on rules, sized so the merchant edits rather than authors.

   Adding a category is adding one object to CATEGORIES. Nothing else in the
   app knows the list.
   ============================================================ */
(function (root) {
  'use strict';

  var BASE_COPY = {
    title: 'Build your bundle',
    titleHighlight: 'your bundle',
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
        title: spec.title || BASE_COPY.title,
        titleHighlight: spec.titleHighlight || BASE_COPY.titleHighlight,
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
        title: 'Build your bike', titleHighlight: 'your bike',
        subtitle: 'Tell us how and where you ride and we will spec the build.',
        sceneTitle: 'Your build so far', emptyTitle: 'Pick a riding style',
        priceSuffix: 'complete build',
        sceneRows: [
          { icon: '&#x1F6B2;', label: 'Riding: {level_label}', when: { field: 'level', op: 'truthy' } },
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
        title: 'Set up your desk', titleHighlight: 'your desk',
        subtitle: 'Four questions about how you work and we will spec the desk.',
        sceneTitle: 'Your setup so far', emptyTitle: 'Pick how you work',
        priceSuffix: 'complete setup',
        sceneRows: [
          { icon: '&#x1F4BC;', label: 'Setup: {level_label}', when: { field: 'level', op: 'truthy' } },
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
      id: 'cosmetics',
      label: 'Cosmetics & skincare',
      icon: '&#x1F9F4;',
      blurb: 'Skin type, goals, routine depth and preferences. The base set is the routine; add-on rules layer the targeted products. Full template.',
      scene: 'Answer summary',
      build: function () { return JSON.parse(JSON.stringify(root.BCFG_CONFIG_COSMETICS)); }
    },
    /* ---- UK e-commerce niches, generated by starter() ---- */
    {
      id: 'fashion',
      label: 'Fashion & apparel',
      icon: '&#x1F455;',
      blurb: 'Capsule wardrobes, outfit sets, occasion dressing. Sizes from how often it is worn and what it has to go with.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Build your capsule wardrobe', titleHighlight: 'capsule wardrobe',
        subtitle: 'Three questions about how you dress and we will put a capsule together.',
        sceneTitle: 'Your capsule so far',
        emptyTitle: 'Pick what it is for',
        priceSuffix: 'per capsule',
        sceneRows: [
          {
            icon: '&#x1F455;',
            label: 'For: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F4C5;',
            label: '{daysPerWeek} days a week',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F9F3;',
            label: '{outfits} outfit(s) needed',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What is the capsule for?',
        q1sub: 'Fabric weight and formality follow from this.',
        levels: [
          {
            value: 'everyday',
            icon: '&#x1F457;',
            label: 'Everyday',
            desc: 'Errands, weekends, easy layers'
          },
          {
            value: 'work',
            icon: '&#x1F4BC;',
            label: 'Work',
            desc: 'Smart, mix-and-match, machine washable'
          },
          {
            value: 'occasion',
            icon: '&#x1F378;',
            label: 'Occasion',
            desc: 'Weddings, dinners, one great outfit'
          }
        ],
        q2: 'How much wear?',
        q2sub: 'This sizes the number of pieces.',
        counters: [
          {
            field: 'daysPerWeek',
            icon: '&#x1F4C5;',
            label: 'Days a week worn',
            min: 1,
            max: 7,
            defaultValue: 4
          },
          {
            field: 'outfits',
            icon: '&#x1F9F3;',
            label: 'Outfits needed',
            min: 1,
            max: 10,
            defaultValue: 4
          }
        ],
        q3: 'What matters most?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'layering',
            icon: '&#x1F9E5;',
            label: 'Layering'
          },
          {
            value: 'comfort',
            icon: '&#x1F45F;',
            label: 'Comfort'
          },
          {
            value: 'natural',
            icon: '&#x1F33F;',
            label: 'Natural fibres'
          },
          {
            value: 'travel',
            icon: '&#x2708;',
            label: 'Packs light'
          }
        ],
        tiers: [
          {
            id: 'starter',
            title: 'Starter Capsule',
            sub: 'Five pieces, one palette',
            price: 189,
            why: 'Five pieces in one palette make more outfits than a wardrobe of odd ones.',
            contents: [
              {
                name: 'Tee',
                detail: 'Two colours',
                qty: 2
              },
              {
                name: 'Trousers',
                detail: 'Tailored',
                qty: 1
              },
              {
                name: 'Knit',
                detail: 'Merino',
                qty: 1
              },
              {
                name: 'Overshirt',
                detail: 'Cotton twill',
                qty: 1
              }
            ]
          },
          {
            id: 'work',
            title: 'Work Capsule',
            sub: 'Nine pieces, two palettes',
            price: 349,
            why: 'At {daysPerWeek} days a week you need enough rotation that nothing is worn twice in a week.',
            includes: {
              belt: 1
            },
            contents: [
              {
                name: 'Shirt',
                detail: 'Three colours',
                qty: 3
              },
              {
                name: 'Trousers',
                detail: 'Two cuts',
                qty: 2
              },
              {
                name: 'Knit',
                detail: 'Merino',
                qty: 2
              },
              {
                name: 'Blazer',
                detail: 'Unstructured',
                qty: 1
              },
              {
                name: 'Belt',
                detail: 'Leather',
                qty: 1
              }
            ]
          },
          {
            id: 'occasion',
            title: 'Occasion Set',
            sub: 'One outfit, finished',
            price: 429,
            why: 'One outfit done properly, from the shoes up, rather than pieces to assemble on the day.',
            includes: {
              shoes: 1,
              bag: 1
            },
            contents: [
              {
                name: 'Dress or suit',
                detail: 'Your size',
                qty: 1
              },
              {
                name: 'Shoes',
                detail: 'Matched',
                qty: 1
              },
              {
                name: 'Bag or clutch',
                detail: 'Matched',
                qty: 1
              },
              {
                name: 'Outer layer',
                detail: 'Season-appropriate',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          belt: {
            variantId: '',
            price: 45,
            title: 'Leather belt',
            image: ''
          },
          shoes: {
            variantId: '',
            price: 120,
            title: 'Shoes',
            image: ''
          },
          bag: {
            variantId: '',
            price: 95,
            title: 'Bag',
            image: ''
          },
          layer: {
            variantId: '',
            price: 79,
            title: 'Extra layer',
            image: ''
          },
          steam: {
            variantId: '',
            price: 35,
            title: 'Travel steamer',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'layer',
            accessory: 'layer',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'layering'
            },
            text: 'Extra layer',
            reason: 'You said layering matters'
          },
          {
            id: 'shoes',
            accessory: 'shoes',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'outfits',
              op: 'gte',
              value: 3
            },
            text: 'Shoes',
            reason: '{outfits} outfits need a pair that goes with all of them'
          },
          {
            id: 'belt',
            accessory: 'belt',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'level',
              op: 'ne',
              value: 'occasion'
            },
            text: 'Leather belt',
            reason: 'Finishes the trousers'
          },
          {
            id: 'steam',
            accessory: 'steam',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'travel'
            },
            text: 'Travel steamer',
            reason: 'You said it needs to pack light'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'outfits',
            label: '{outfits} outfit{s}',
            when: {
              field: 'outfits',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F455;'
          },
          {
            field: 'daysPerWeek',
            icon: '&#x1F4C5;',
            label: '{daysPerWeek} days a week'
          }
        ]
      }); }
    },
    {
      id: 'food-drink',
      label: 'Food & drink hampers',
      icon: '&#x1F9FA;',
      blurb: 'Hampers, meal kits, pantry bundles. Sizes from how many people eat and how many meals it has to cover.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Fill your hamper', titleHighlight: 'your hamper',
        subtitle: 'Tell us who is eating and we will fill the hamper.',
        sceneTitle: 'Your hamper so far',
        emptyTitle: 'Pick the occasion',
        priceSuffix: 'per hamper',
        sceneRows: [
          {
            icon: '&#x1F9FA;',
            label: 'For: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F37D;',
            label: '{people} people',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F372;',
            label: '{meals} meal(s) covered',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What is it for?',
        q1sub: 'This decides what goes in and how it is packed.',
        levels: [
          {
            value: 'gift',
            icon: '&#x1F381;',
            label: 'A gift',
            desc: 'Presented, with a card'
          },
          {
            value: 'weekly',
            icon: '&#x1F4C5;',
            label: 'The weekly shop',
            desc: 'Staples and fresh, no frills'
          },
          {
            value: 'event',
            icon: '&#x1F389;',
            label: 'An event',
            desc: 'Feeds a table, sharing plates'
          }
        ],
        q2: 'How many mouths?',
        q2sub: 'This sizes the portions.',
        counters: [
          {
            field: 'people',
            icon: '&#x1F465;',
            label: 'People eating',
            min: 1,
            max: 12,
            defaultValue: 2
          },
          {
            field: 'meals',
            icon: '&#x1F372;',
            label: 'Meals to cover',
            min: 1,
            max: 14,
            defaultValue: 3
          }
        ],
        q3: 'Any of these?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'drinks',
            icon: '&#x1F377;',
            label: 'Include drinks'
          },
          {
            value: 'veg',
            icon: '&#x1F966;',
            label: 'Vegetarian'
          },
          {
            value: 'glutenfree',
            icon: '&#x1F33E;',
            label: 'Gluten-free'
          },
          {
            value: 'sweet',
            icon: '&#x1F36B;',
            label: 'Something sweet'
          }
        ],
        tiers: [
          {
            id: 'small',
            title: 'Small Hamper',
            sub: 'Six items',
            price: 39,
            why: 'Enough for {people} to eat well for a couple of meals.',
            contents: [
              {
                name: 'Artisan bread',
                detail: 'Sourdough',
                qty: 1
              },
              {
                name: 'Cheese',
                detail: 'Two wedges',
                qty: 2
              },
              {
                name: 'Chutney',
                detail: 'Seasonal',
                qty: 1
              },
              {
                name: 'Crackers',
                detail: 'Seeded',
                qty: 1
              },
              {
                name: 'Olives',
                detail: 'Marinated',
                qty: 1
              }
            ]
          },
          {
            id: 'large',
            title: 'Large Hamper',
            sub: 'Twelve items and a bottle',
            price: 89,
            why: 'Drinks included, and enough that nobody is rationing.',
            includes: {
              wine: 1
            },
            contents: [
              {
                name: 'Artisan bread',
                detail: 'Two loaves',
                qty: 2
              },
              {
                name: 'Cheese',
                detail: 'Four wedges',
                qty: 4
              },
              {
                name: 'Charcuterie',
                detail: 'Three kinds',
                qty: 3
              },
              {
                name: 'Chutney',
                detail: 'Two',
                qty: 2
              },
              {
                name: 'Wine',
                detail: 'Red or white',
                qty: 1
              }
            ]
          },
          {
            id: 'table',
            title: 'Table Spread',
            sub: 'Feeds a party',
            price: 169,
            why: 'Sharing plates for {people}, built so the table is full without anyone cooking.',
            includes: {
              wine: 2,
              dessert: 1
            },
            contents: [
              {
                name: 'Bread selection',
                detail: 'Four loaves',
                qty: 4
              },
              {
                name: 'Cheese board',
                detail: 'Six wedges',
                qty: 6
              },
              {
                name: 'Charcuterie',
                detail: 'Five kinds',
                qty: 5
              },
              {
                name: 'Wine',
                detail: 'Two bottles',
                qty: 2
              },
              {
                name: 'Dessert',
                detail: 'Serves 8',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          wine: {
            variantId: '',
            price: 14,
            title: 'Bottle of wine',
            image: ''
          },
          dessert: {
            variantId: '',
            price: 18,
            title: 'Dessert',
            image: ''
          },
          vegbox: {
            variantId: '',
            price: 22,
            title: 'Vegetarian swap box',
            image: ''
          },
          gfbread: {
            variantId: '',
            price: 6,
            title: 'Gluten-free loaf',
            image: ''
          },
          card: {
            variantId: '',
            price: 3,
            title: 'Gift card & ribbon',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'wine',
            accessory: 'wine',
            qty: {
              expr: 'max(0, ceil(people / 3) - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'drinks'
            },
            text: 'Wine × {qty}',
            reason: 'One bottle per three people'
          },
          {
            id: 'veg',
            accessory: 'vegbox',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'veg'
            },
            text: 'Vegetarian swap box',
            reason: 'Replaces the charcuterie'
          },
          {
            id: 'gf',
            accessory: 'gfbread',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'glutenfree'
            },
            text: 'Gluten-free loaf',
            reason: 'Replaces the bread'
          },
          {
            id: 'dessert',
            accessory: 'dessert',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'sweet'
            },
            text: 'Dessert',
            reason: 'You asked for something sweet'
          },
          {
            id: 'card',
            accessory: 'card',
            when: {
              field: 'level',
              op: 'eq',
              value: 'gift'
            },
            text: 'Gift card & ribbon',
            reason: 'It is a gift'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'people',
            label: '{people} people',
            when: {
              field: 'people',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F9FA;'
          },
          {
            field: 'people',
            icon: '&#x1F465;',
            label: '{people} people'
          }
        ]
      }); }
    },
    {
      id: 'home-garden',
      label: 'Home & garden',
      icon: '&#x1F33B;',
      blurb: 'Garden kits, planters, outdoor furniture, lighting. Sizes from the space and how much sun it gets.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Plan your garden kit', titleHighlight: 'garden kit',
        subtitle: 'Tell us about the space and we will kit it out.',
        sceneTitle: 'Your garden so far',
        emptyTitle: 'Pick the space',
        priceSuffix: 'complete kit',
        sceneRows: [
          {
            icon: '&#x1F33B;',
            label: 'Space: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F4D0;',
            label: '{sqm} m²',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x2600;',
            label: '{sunHours} hours of sun',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What kind of space?',
        q1sub: 'Planters, soil volume and lighting follow from this.',
        levels: [
          {
            value: 'balcony',
            icon: '&#x1F3E2;',
            label: 'Balcony',
            desc: 'Containers, railings, no digging'
          },
          {
            value: 'patio',
            icon: '&#x1FAB4;',
            label: 'Patio or yard',
            desc: 'Hard surface, raised beds'
          },
          {
            value: 'garden',
            icon: '&#x1F333;',
            label: 'Garden',
            desc: 'Beds, lawn, borders'
          }
        ],
        q2: 'How big and how bright?',
        q2sub: 'This sizes the beds and picks the plants.',
        counters: [
          {
            field: 'sqm',
            icon: '&#x1F4D0;',
            label: 'Square metres',
            min: 2,
            max: 200,
            defaultValue: 20
          },
          {
            field: 'sunHours',
            icon: '&#x2600;',
            label: 'Hours of sun',
            min: 1,
            max: 12,
            defaultValue: 5
          }
        ],
        q3: 'What do you want from it?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'grow',
            icon: '&#x1F345;',
            label: 'Grow food'
          },
          {
            value: 'relax',
            icon: '&#x1FA91;',
            label: 'Sit and relax'
          },
          {
            value: 'lowcare',
            icon: '&#x1F331;',
            label: 'Low maintenance'
          },
          {
            value: 'evening',
            icon: '&#x1F318;',
            label: 'Use it at night'
          }
        ],
        tiers: [
          {
            id: 'starter',
            title: 'Container Kit',
            sub: 'Planters, compost, plants',
            price: 129,
            why: 'Everything to fill a small space this weekend.',
            contents: [
              {
                name: 'Planters',
                detail: 'Three sizes',
                qty: 3
              },
              {
                name: 'Peat-free compost',
                detail: '40 L',
                qty: 2
              },
              {
                name: 'Plant selection',
                detail: 'For your light',
                qty: 6
              }
            ]
          },
          {
            id: 'grow',
            title: 'Grow Kit',
            sub: 'Raised bed and a season of veg',
            price: 289,
            why: 'At {sunHours} hours of sun you can grow properly, so this kit gives you a bed and the plants for it.',
            includes: {
              irrigation: 1
            },
            contents: [
              {
                name: 'Raised bed',
                detail: '120 × 80 cm',
                qty: 1
              },
              {
                name: 'Compost',
                detail: '40 L',
                qty: 6
              },
              {
                name: 'Veg plants',
                detail: 'Seasonal',
                qty: 12
              },
              {
                name: 'Drip irrigation',
                detail: 'Timer included',
                qty: 1
              }
            ]
          },
          {
            id: 'living',
            title: 'Outdoor Room',
            sub: 'Furniture, lighting, planting',
            price: 749,
            why: 'A garden used every evening needs somewhere to sit and light to sit in.',
            includes: {
              lights: 1,
              irrigation: 1
            },
            contents: [
              {
                name: 'Bistro set',
                detail: 'Two chairs and a table',
                qty: 1
              },
              {
                name: 'Festoon lights',
                detail: '10 m',
                qty: 1
              },
              {
                name: 'Planters',
                detail: 'Large',
                qty: 4
              },
              {
                name: 'Plant selection',
                detail: 'Structural',
                qty: 8
              },
              {
                name: 'Drip irrigation',
                detail: 'Timer included',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          irrigation: {
            variantId: '',
            price: 49,
            title: 'Drip irrigation kit',
            image: ''
          },
          lights: {
            variantId: '',
            price: 39,
            title: 'Festoon lights',
            image: ''
          },
          compost: {
            variantId: '',
            price: 9,
            title: 'Compost, 40 L',
            image: ''
          },
          tools: {
            variantId: '',
            price: 32,
            title: 'Hand tool set',
            image: ''
          },
          shade: {
            variantId: '',
            price: 59,
            title: 'Shade sail',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'irrigation',
            accessory: 'irrigation',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'lowcare'
            },
            text: 'Drip irrigation kit',
            reason: 'Low maintenance starts with not hand-watering'
          },
          {
            id: 'lights',
            accessory: 'lights',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'evening'
            },
            text: 'Festoon lights',
            reason: 'You want to use it at night'
          },
          {
            id: 'compost',
            accessory: 'compost',
            qty: {
              expr: 'max(0, ceil(sqm / 10))'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'grow'
            },
            text: 'Compost × {qty}',
            reason: 'About one bag per 10 m² of growing'
          },
          {
            id: 'tools',
            accessory: 'tools',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'grow'
            },
            text: 'Hand tool set',
            reason: 'For planting out'
          },
          {
            id: 'shade',
            accessory: 'shade',
            when: {
              all: [
                {
                  field: 'priorities',
                  op: 'includes',
                  value: 'relax'
                },
                {
                  field: 'sunHours',
                  op: 'gte',
                  value: 7
                }
              ]
            },
            text: 'Shade sail',
            reason: '{sunHours} hours of sun is too much to sit in'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'sqm',
            label: '{sqm} m²',
            when: {
              field: 'sqm',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F33B;'
          },
          {
            field: 'sunHours',
            icon: '&#x2600;',
            label: '{sunHours} hours of sun'
          }
        ]
      }); }
    },
    {
      id: 'electronics',
      label: 'Consumer electronics',
      icon: '&#x1F3A7;',
      blurb: 'Home audio, smart home, phone and laptop kits. Sizes from rooms, devices and what has to talk to what.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Spec your home setup', titleHighlight: 'home setup',
        subtitle: 'Tell us what you are setting up and we will spec the kit.',
        sceneTitle: 'Your setup so far',
        emptyTitle: 'Pick the setup',
        priceSuffix: 'complete kit',
        sceneRows: [
          {
            icon: '&#x1F3A7;',
            label: 'Setup: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F6AA;',
            label: '{rooms} room(s)',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F4F1;',
            label: '{devices} device(s)',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What are you setting up?',
        q1sub: 'Hub, speakers and cabling follow from this.',
        levels: [
          {
            value: 'audio',
            icon: '&#x1F50A;',
            label: 'Home audio',
            desc: 'Speakers in one or more rooms'
          },
          {
            value: 'smart',
            icon: '&#x1F4A1;',
            label: 'Smart home',
            desc: 'Lights, plugs, sensors, a hub'
          },
          {
            value: 'cinema',
            icon: '&#x1F3AC;',
            label: 'Home cinema',
            desc: 'Screen, soundbar or surround'
          }
        ],
        q2: 'How big is it?',
        q2sub: 'This sizes the number of speakers, bulbs and cables.',
        counters: [
          {
            field: 'rooms',
            icon: '&#x1F6AA;',
            label: 'Rooms covered',
            min: 1,
            max: 10,
            defaultValue: 2
          },
          {
            field: 'devices',
            icon: '&#x1F4F1;',
            label: 'Devices to connect',
            min: 1,
            max: 20,
            defaultValue: 4
          }
        ],
        q3: 'What matters most?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'multiroom',
            icon: '&#x1F3E0;',
            label: 'Whole-home'
          },
          {
            value: 'wireless',
            icon: '&#x1F4F6;',
            label: 'No cables'
          },
          {
            value: 'voice',
            icon: '&#x1F5E3;',
            label: 'Voice control'
          },
          {
            value: 'budget',
            icon: '&#x1F4B7;',
            label: 'Keep it cheap'
          }
        ],
        tiers: [
          {
            id: 'single',
            title: 'Single Room',
            sub: 'One room, done well',
            price: 249,
            why: 'One good speaker or hub beats several average ones.',
            contents: [
              {
                name: 'Smart speaker',
                detail: 'Stereo pair capable',
                qty: 1
              },
              {
                name: 'Smart plug',
                detail: 'Two pack',
                qty: 1
              }
            ]
          },
          {
            id: 'multi',
            title: 'Multi-Room',
            sub: 'Every room you named',
            price: 699,
            why: '{rooms} rooms need a system that groups and ungroups, not {rooms} separate speakers.',
            includes: {
              speaker: 2,
              hub: 1
            },
            contents: [
              {
                name: 'Smart speaker',
                detail: 'Per room',
                qty: 2
              },
              {
                name: 'Hub',
                detail: 'Matter / Thread',
                qty: 1
              },
              {
                name: 'Smart bulbs',
                detail: 'Four pack',
                qty: 1
              },
              {
                name: 'Smart plugs',
                detail: 'Four pack',
                qty: 1
              }
            ]
          },
          {
            id: 'cinema',
            title: 'Cinema Kit',
            sub: 'Screen, surround, hub',
            price: 1499,
            why: 'Cinema is about the sound, so the budget goes to the surround and the sub.',
            includes: {
              speaker: 2,
              hub: 1,
              hdmi: 2
            },
            contents: [
              {
                name: 'Soundbar and sub',
                detail: 'Dolby Atmos',
                qty: 1
              },
              {
                name: 'Rear speakers',
                detail: 'Pair',
                qty: 2
              },
              {
                name: 'Streaming box',
                detail: '4K',
                qty: 1
              },
              {
                name: 'HDMI 2.1 cables',
                detail: '2 m',
                qty: 2
              },
              {
                name: 'Hub',
                detail: 'Matter / Thread',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          speaker: {
            variantId: '',
            price: 179,
            title: 'Smart speaker',
            image: ''
          },
          hub: {
            variantId: '',
            price: 89,
            title: 'Smart home hub',
            image: ''
          },
          bulbs: {
            variantId: '',
            price: 45,
            title: 'Smart bulbs, four pack',
            image: ''
          },
          hdmi: {
            variantId: '',
            price: 15,
            title: 'HDMI 2.1 cable',
            image: ''
          },
          mesh: {
            variantId: '',
            price: 199,
            title: 'Mesh Wi-Fi, two pack',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'speaker',
            accessory: 'speaker',
            qty: {
              expr: 'max(0, rooms - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'multiroom'
            },
            text: 'Smart speaker × {qty}',
            reason: 'One per room beyond what the kit includes'
          },
          {
            id: 'hub',
            accessory: 'hub',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'devices',
              op: 'gte',
              value: 6
            },
            text: 'Smart home hub',
            reason: '{devices} devices need a hub, not just the app'
          },
          {
            id: 'bulbs',
            accessory: 'bulbs',
            qty: {
              expr: 'ceil(rooms / 2)'
            },
            when: {
              field: 'level',
              op: 'eq',
              value: 'smart'
            },
            text: 'Smart bulbs × {qty}',
            reason: 'Four bulbs per two rooms'
          },
          {
            id: 'mesh',
            accessory: 'mesh',
            when: {
              all: [
                {
                  field: 'priorities',
                  op: 'includes',
                  value: 'wireless'
                },
                {
                  field: 'rooms',
                  op: 'gte',
                  value: 4
                }
              ]
            },
            text: 'Mesh Wi-Fi',
            reason: 'Wireless across {rooms} rooms needs more than one router'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'rooms',
            label: '{rooms} room{s}',
            when: {
              field: 'rooms',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F3A7;'
          },
          {
            field: 'devices',
            icon: '&#x1F4F1;',
            label: '{devices} devices'
          }
        ]
      }); }
    },
    {
      id: 'pets',
      label: 'Pet supplies',
      icon: '&#x1F436;',
      blurb: 'Starter kits, food plans, grooming. Sizes from species, size and how many animals.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Pack your pet starter kit', titleHighlight: 'pet starter kit',
        subtitle: 'Tell us about your pet and we will pack the kit.',
        sceneTitle: 'Your kit so far',
        emptyTitle: 'Pick your pet',
        priceSuffix: 'starter kit',
        sceneRows: [
          {
            icon: '&#x1F43E;',
            label: 'Pet: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x2696;',
            label: '{kg} kg',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F465;',
            label: '{pets} animal(s)',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'Who is it for?',
        q1sub: 'Food, bed size and toys all follow from this.',
        levels: [
          {
            value: 'puppy',
            icon: '&#x1F436;',
            label: 'Puppy or kitten',
            desc: 'Under a year, still growing'
          },
          {
            value: 'adult',
            icon: '&#x1F415;',
            label: 'Adult',
            desc: 'Settled, known size'
          },
          {
            value: 'senior',
            icon: '&#x1F9D3;',
            label: 'Senior',
            desc: 'Joints, softer food, gentler play'
          }
        ],
        q2: 'How big and how many?',
        q2sub: 'This sizes the food and the bed.',
        counters: [
          {
            field: 'kg',
            icon: '&#x2696;',
            label: 'Weight in kg',
            min: 1,
            max: 80,
            defaultValue: 12
          },
          {
            field: 'pets',
            icon: '&#x1F465;',
            label: 'Animals',
            min: 1,
            max: 6,
            defaultValue: 1
          }
        ],
        q3: 'Anything to cover?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'training',
            icon: '&#x1F3AF;',
            label: 'Training'
          },
          {
            value: 'travel',
            icon: '&#x1F697;',
            label: 'Travel'
          },
          {
            value: 'grooming',
            icon: '&#x2702;',
            label: 'Grooming'
          },
          {
            value: 'sensitive',
            icon: '&#x1F33E;',
            label: 'Sensitive stomach'
          }
        ],
        tiers: [
          {
            id: 'basics',
            title: 'Basics Kit',
            sub: 'Bowl, bed, lead, food',
            price: 79,
            why: 'The four things every pet needs on day one.',
            contents: [
              {
                name: 'Bowls',
                detail: 'Pair',
                qty: 1
              },
              {
                name: 'Bed',
                detail: 'Sized to weight',
                qty: 1
              },
              {
                name: 'Lead and collar',
                detail: 'Adjustable',
                qty: 1
              },
              {
                name: 'Food',
                detail: 'Two weeks',
                qty: 1
              }
            ]
          },
          {
            id: 'complete',
            title: 'Complete Kit',
            sub: 'Basics plus enrichment',
            price: 149,
            why: 'Toys and training treats stop the boredom that turns into chewing.',
            includes: {
              treats: 1
            },
            contents: [
              {
                name: 'Bowls',
                detail: 'Pair',
                qty: 1
              },
              {
                name: 'Bed',
                detail: 'Sized to weight',
                qty: 1
              },
              {
                name: 'Lead and harness',
                detail: 'Padded',
                qty: 1
              },
              {
                name: 'Food',
                detail: 'Four weeks',
                qty: 1
              },
              {
                name: 'Toys',
                detail: 'Three',
                qty: 3
              },
              {
                name: 'Training treats',
                detail: '500 g',
                qty: 1
              }
            ]
          },
          {
            id: 'senior',
            title: 'Senior Kit',
            sub: 'Orthopaedic bed, joint support',
            price: 169,
            why: 'Older animals need a bed that supports joints and food that is easy to digest.',
            includes: {
              joint: 1
            },
            contents: [
              {
                name: 'Orthopaedic bed',
                detail: 'Memory foam',
                qty: 1
              },
              {
                name: 'Raised bowls',
                detail: 'Pair',
                qty: 1
              },
              {
                name: 'Senior food',
                detail: 'Four weeks',
                qty: 1
              },
              {
                name: 'Joint supplement',
                detail: '60 days',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          treats: {
            variantId: '',
            price: 12,
            title: 'Training treats',
            image: ''
          },
          crate: {
            variantId: '',
            price: 65,
            title: 'Travel crate',
            image: ''
          },
          groom: {
            variantId: '',
            price: 34,
            title: 'Grooming kit',
            image: ''
          },
          joint: {
            variantId: '',
            price: 24,
            title: 'Joint supplement',
            image: ''
          },
          food: {
            variantId: '',
            price: 38,
            title: 'Food, four weeks',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'food',
            accessory: 'food',
            qty: {
              expr: 'max(0, pets - 1)'
            },
            when: {
              field: 'pets',
              op: 'gt',
              value: 1
            },
            text: 'Food × {qty}',
            reason: 'One kit feeds one animal'
          },
          {
            id: 'treats',
            accessory: 'treats',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'training'
            },
            text: 'Training treats',
            reason: 'You said training'
          },
          {
            id: 'crate',
            accessory: 'crate',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'travel'
            },
            text: 'Travel crate',
            reason: 'Sized to {kg} kg'
          },
          {
            id: 'groom',
            accessory: 'groom',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'grooming'
            },
            text: 'Grooming kit',
            reason: 'You said grooming'
          },
          {
            id: 'joint',
            accessory: 'joint',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              all: [
                {
                  field: 'level',
                  op: 'eq',
                  value: 'senior'
                },
                {
                  field: 'kg',
                  op: 'gte',
                  value: 20
                }
              ]
            },
            text: 'Joint supplement',
            reason: 'Larger seniors benefit most'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'pets',
            label: '{pets} animal{s}',
            when: {
              field: 'pets',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F43E;'
          },
          {
            field: 'kg',
            icon: '&#x2696;',
            label: '{kg} kg'
          }
        ]
      }); }
    },
    {
      id: 'sports-outdoors',
      label: 'Sports & outdoors',
      icon: '&#x26FA;',
      blurb: 'Camping, hiking, running, gym. Sizes from trip length, conditions and how many people.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Pack for your trip', titleHighlight: 'your trip',
        subtitle: 'Tell us about the trip and we will pack for it.',
        sceneTitle: 'Your pack so far',
        emptyTitle: 'Pick the activity',
        priceSuffix: 'complete kit',
        sceneRows: [
          {
            icon: '&#x26FA;',
            label: 'Activity: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F319;',
            label: 'Nights: {nights}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F465;',
            label: '{people} people',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What are you doing?',
        q1sub: 'Shelter, footwear and pack size follow from this.',
        levels: [
          {
            value: 'dayhike',
            icon: '&#x1F97E;',
            label: 'Day hikes',
            desc: 'Out and back, no overnight'
          },
          {
            value: 'camping',
            icon: '&#x26FA;',
            label: 'Camping',
            desc: 'Car or short walk-in, a few nights'
          },
          {
            value: 'backpack',
            icon: '&#x1F392;',
            label: 'Backpacking',
            desc: 'Everything carried, multi-day'
          }
        ],
        q2: 'How long and how many?',
        q2sub: 'This sizes the tent, the food and the pack.',
        counters: [
          {
            field: 'nights',
            icon: '&#x1F319;',
            label: 'Nights out',
            min: 0,
            max: 14,
            defaultValue: 2
          },
          {
            field: 'people',
            icon: '&#x1F465;',
            label: 'People',
            min: 1,
            max: 8,
            defaultValue: 2
          }
        ],
        q3: 'Conditions?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'wet',
            icon: '&#x1F327;',
            label: 'Wet weather'
          },
          {
            value: 'cold',
            icon: '&#x2744;',
            label: 'Cold nights'
          },
          {
            value: 'light',
            icon: '&#x1FAB6;',
            label: 'Ultralight'
          },
          {
            value: 'cook',
            icon: '&#x1F373;',
            label: 'Cooking'
          }
        ],
        tiers: [
          {
            id: 'day',
            title: 'Day Kit',
            sub: 'Pack, layers, water',
            price: 149,
            why: 'A day out needs a pack that fits, water and a layer for when the weather turns.',
            contents: [
              {
                name: 'Daypack',
                detail: '25 L',
                qty: 1
              },
              {
                name: 'Waterproof shell',
                detail: 'Packable',
                qty: 1
              },
              {
                name: 'Water bottle',
                detail: '1 L',
                qty: 1
              },
              {
                name: 'Map case',
                detail: 'Waterproof',
                qty: 1
              }
            ]
          },
          {
            id: 'camp',
            title: 'Camp Kit',
            sub: 'Tent, sleep, cook',
            price: 449,
            why: 'Camping for {people} means a tent with room to spare and a sleep system that works.',
            includes: {
              shell: 0,
              stove: 1
            },
            contents: [
              {
                name: 'Tent',
                detail: 'Sized to your group',
                qty: 1
              },
              {
                name: 'Sleeping bag',
                detail: 'Three season',
                qty: 2
              },
              {
                name: 'Sleeping mat',
                detail: 'Self-inflating',
                qty: 2
              },
              {
                name: 'Stove and pot',
                detail: 'Gas',
                qty: 1
              },
              {
                name: 'Headtorch',
                detail: 'Rechargeable',
                qty: 2
              }
            ]
          },
          {
            id: 'trek',
            title: 'Trek Kit',
            sub: 'Lightweight, carried',
            price: 899,
            why: 'When everything is on your back, weight is the spec that matters.',
            includes: {
              shell: 1,
              stove: 1,
              filter: 1
            },
            contents: [
              {
                name: 'Backpack',
                detail: '55 L',
                qty: 1
              },
              {
                name: 'Lightweight tent',
                detail: 'Under 2 kg',
                qty: 1
              },
              {
                name: 'Down bag',
                detail: 'Comfort 0 °C',
                qty: 1
              },
              {
                name: 'Insulated mat',
                detail: 'R-value 4',
                qty: 1
              },
              {
                name: 'Stove, pot, filter',
                detail: 'Ultralight',
                qty: 1
              },
              {
                name: 'Waterproof shell',
                detail: '3-layer',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          shell: {
            variantId: '',
            price: 129,
            title: 'Waterproof shell',
            image: ''
          },
          liner: {
            variantId: '',
            price: 35,
            title: 'Bag liner',
            image: ''
          },
          stove: {
            variantId: '',
            price: 49,
            title: 'Stove and pot',
            image: ''
          },
          filter: {
            variantId: '',
            price: 39,
            title: 'Water filter',
            image: ''
          },
          poles: {
            variantId: '',
            price: 59,
            title: 'Trekking poles',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'shell',
            accessory: 'shell',
            qty: {
              expr: 'max(0, people - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'wet'
            },
            text: 'Waterproof shell × {qty}',
            reason: 'One per person for wet weather'
          },
          {
            id: 'liner',
            accessory: 'liner',
            qty: {
              expr: 'people'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'cold'
            },
            text: 'Bag liner × {qty}',
            reason: 'Adds a few degrees to every bag'
          },
          {
            id: 'stove',
            accessory: 'stove',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'cook'
            },
            text: 'Stove and pot',
            reason: 'You said cooking'
          },
          {
            id: 'filter',
            accessory: 'filter',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'nights',
              op: 'gte',
              value: 3
            },
            text: 'Water filter',
            reason: '{nights} nights is too long to carry water'
          },
          {
            id: 'poles',
            accessory: 'poles',
            when: {
              field: 'level',
              op: 'eq',
              value: 'backpack'
            },
            text: 'Trekking poles',
            reason: 'Knees, with a loaded pack'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'nights',
            label: '{nights} night{s}',
            when: {
              field: 'nights',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x26FA;'
          },
          {
            field: 'people',
            icon: '&#x1F465;',
            label: '{people} people'
          }
        ]
      }); }
    },
    {
      id: 'baby-nursery',
      label: 'Baby & nursery',
      icon: '&#x1F476;',
      blurb: 'Nursery, feeding, travel systems. Sizes from due date, space and how the household gets around.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Build your nursery list', titleHighlight: 'nursery list',
        subtitle: 'Tell us where you are and we will build the list.',
        sceneTitle: 'Your nursery so far',
        emptyTitle: 'Pick the stage',
        priceSuffix: 'complete set',
        sceneRows: [
          {
            icon: '&#x1F476;',
            label: 'Stage: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F4C6;',
            label: '{weeksToGo} weeks to go',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F6CF;',
            label: '{rooms} room(s) to set up',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'Where are you?',
        q1sub: 'What goes in the set depends on the stage.',
        levels: [
          {
            value: 'expecting',
            icon: '&#x1F930;',
            label: 'Expecting',
            desc: 'Setting up before the birth'
          },
          {
            value: 'newborn',
            icon: '&#x1F476;',
            label: 'Newborn',
            desc: 'First three months'
          },
          {
            value: 'toddler',
            icon: '&#x1F9D2;',
            label: 'Sitting to walking',
            desc: 'Six months onwards'
          }
        ],
        q2: 'How soon and how much space?',
        q2sub: 'This decides what ships first.',
        counters: [
          {
            field: 'weeksToGo',
            icon: '&#x1F4C6;',
            label: 'Weeks to go',
            min: 0,
            max: 40,
            defaultValue: 12
          },
          {
            field: 'rooms',
            icon: '&#x1F6CF;',
            label: 'Rooms to set up',
            min: 1,
            max: 3,
            defaultValue: 1
          }
        ],
        q3: 'How do you get around?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'car',
            icon: '&#x1F697;',
            label: 'By car'
          },
          {
            value: 'walk',
            icon: '&#x1F6B6;',
            label: 'On foot'
          },
          {
            value: 'travel',
            icon: '&#x2708;',
            label: 'Travel a lot'
          },
          {
            value: 'small',
            icon: '&#x1F3E0;',
            label: 'Small flat'
          }
        ],
        tiers: [
          {
            id: 'essentials',
            title: 'Newborn Essentials',
            sub: 'Sleep, feed, change',
            price: 349,
            why: 'The three things a newborn does, covered, with nothing you will not use.',
            contents: [
              {
                name: 'Bedside crib',
                detail: 'Height adjustable',
                qty: 1
              },
              {
                name: 'Changing mat',
                detail: 'Wipe-clean',
                qty: 1
              },
              {
                name: 'Bottles and steriliser',
                detail: 'Set',
                qty: 1
              },
              {
                name: 'Muslins',
                detail: 'Six',
                qty: 6
              }
            ]
          },
          {
            id: 'nursery',
            title: 'Full Nursery',
            sub: 'Cot, storage, monitor',
            price: 899,
            why: 'A room set up once, properly, rather than piece by piece at 3 am.',
            includes: {
              monitor: 1
            },
            contents: [
              {
                name: 'Cot bed',
                detail: 'Converts to toddler bed',
                qty: 1
              },
              {
                name: 'Mattress',
                detail: 'Breathable',
                qty: 1
              },
              {
                name: 'Chest and changer',
                detail: 'Matching',
                qty: 1
              },
              {
                name: 'Monitor',
                detail: 'Video',
                qty: 1
              },
              {
                name: 'Blackout blind',
                detail: 'Portable',
                qty: 1
              }
            ]
          },
          {
            id: 'moving',
            title: 'On the Move',
            sub: 'Travel system and carrier',
            price: 749,
            why: 'From six months the kit is about getting out of the house.',
            includes: {
              carrier: 1,
              carseat: 1
            },
            contents: [
              {
                name: 'Pushchair',
                detail: 'Reversible seat',
                qty: 1
              },
              {
                name: 'Car seat',
                detail: 'i-Size',
                qty: 1
              },
              {
                name: 'Carrier',
                detail: 'Ergonomic',
                qty: 1
              },
              {
                name: 'Changing bag',
                detail: 'Backpack',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          monitor: {
            variantId: '',
            price: 129,
            title: 'Video monitor',
            image: ''
          },
          carseat: {
            variantId: '',
            price: 199,
            title: 'Car seat',
            image: ''
          },
          carrier: {
            variantId: '',
            price: 89,
            title: 'Baby carrier',
            image: ''
          },
          travelcot: {
            variantId: '',
            price: 99,
            title: 'Travel cot',
            image: ''
          },
          blind: {
            variantId: '',
            price: 29,
            title: 'Portable blackout blind',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'monitor',
            accessory: 'monitor',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'rooms',
              op: 'gte',
              value: 1
            },
            text: 'Video monitor',
            reason: 'For when the baby is in another room'
          },
          {
            id: 'carseat',
            accessory: 'carseat',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'car'
            },
            text: 'Car seat',
            reason: 'You travel by car'
          },
          {
            id: 'carrier',
            accessory: 'carrier',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              any: [
                {
                  field: 'priorities',
                  op: 'includes',
                  value: 'walk'
                },
                {
                  field: 'priorities',
                  op: 'includes',
                  value: 'small'
                }
              ]
            },
            text: 'Baby carrier',
            reason: 'On foot, or no room for a pram'
          },
          {
            id: 'travelcot',
            accessory: 'travelcot',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'travel'
            },
            text: 'Travel cot',
            reason: 'You travel a lot'
          },
          {
            id: 'blind',
            accessory: 'blind',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'travel'
            },
            text: 'Portable blackout blind',
            reason: 'Naps away from home'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'weeksToGo',
            label: '{weeksToGo} weeks to go',
            when: {
              field: 'weeksToGo',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F476;'
          },
          {
            field: 'rooms',
            icon: '&#x1F6CF;',
            label: '{rooms} room(s)'
          }
        ]
      }); }
    },
    {
      id: 'jewellery',
      label: 'Jewellery & gifting',
      icon: '&#x1F48D;',
      blurb: 'Gift sets, stacking rings, personalised pieces. Sizes from occasion, budget and who it is for.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Put together the perfect gift', titleHighlight: 'perfect gift',
        subtitle: 'Tell us who it is for and we will put the set together.',
        sceneTitle: 'Your gift so far',
        emptyTitle: 'Pick the occasion',
        priceSuffix: 'gift set',
        sceneRows: [
          {
            icon: '&#x1F381;',
            label: 'Occasion: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F4B7;',
            label: 'Budget about £{budget}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F48E;',
            label: '{pieces} piece(s)',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What is the occasion?',
        q1sub: 'Presentation and engraving options follow from this.',
        levels: [
          {
            value: 'everyday',
            icon: '&#x2728;',
            label: 'Just because',
            desc: 'Everyday pieces, easy to wear'
          },
          {
            value: 'birthday',
            icon: '&#x1F382;',
            label: 'Birthday',
            desc: 'Birthstones, initials'
          },
          {
            value: 'milestone',
            icon: '&#x1F48D;',
            label: 'Milestone',
            desc: 'Anniversary, engagement, big birthday'
          }
        ],
        q2: 'How much and how many?',
        q2sub: 'This sizes the set and the metal.',
        counters: [
          {
            field: 'budget',
            icon: '&#x1F4B7;',
            label: 'Budget in £',
            min: 25,
            max: 2000,
            defaultValue: 150
          },
          {
            field: 'pieces',
            icon: '&#x1F48E;',
            label: 'Pieces',
            min: 1,
            max: 5,
            defaultValue: 2
          }
        ],
        q3: 'Any of these?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'personal',
            icon: '&#x270D;',
            label: 'Personalised'
          },
          {
            value: 'gold',
            icon: '&#x1F7E1;',
            label: 'Solid gold'
          },
          {
            value: 'wrapped',
            icon: '&#x1F381;',
            label: 'Gift wrapped'
          },
          {
            value: 'hypo',
            icon: '&#x1F33F;',
            label: 'Sensitive skin'
          }
        ],
        tiers: [
          {
            id: 'everyday',
            title: 'Everyday Set',
            sub: 'Two pieces, sterling silver',
            price: 95,
            why: 'Pieces that get worn daily, in a metal that takes daily wear.',
            contents: [
              {
                name: 'Chain necklace',
                detail: 'Sterling silver, 45 cm',
                qty: 1
              },
              {
                name: 'Huggie hoops',
                detail: 'Sterling silver',
                qty: 1
              }
            ]
          },
          {
            id: 'birthday',
            title: 'Birthday Set',
            sub: 'Birthstone, engraved, boxed',
            price: 185,
            why: 'A birthstone and an initial make it theirs, not just a nice piece.',
            includes: {
              engrave: 1,
              box: 1
            },
            contents: [
              {
                name: 'Birthstone pendant',
                detail: 'Gold vermeil',
                qty: 1
              },
              {
                name: 'Initial charm',
                detail: 'Engraved',
                qty: 1
              },
              {
                name: 'Gift box',
                detail: 'With card',
                qty: 1
              }
            ]
          },
          {
            id: 'milestone',
            title: 'Milestone Piece',
            sub: 'Solid gold, hallmarked',
            price: 690,
            why: 'For a milestone, one piece in solid gold outlasts a set in anything else.',
            includes: {
              engrave: 1,
              box: 1,
              gold: 1
            },
            contents: [
              {
                name: 'Solid gold piece',
                detail: '9 ct, hallmarked',
                qty: 1
              },
              {
                name: 'Engraving',
                detail: 'Inside or reverse',
                qty: 1
              },
              {
                name: 'Presentation box',
                detail: 'With certificate',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          engrave: {
            variantId: '',
            price: 15,
            title: 'Engraving',
            image: ''
          },
          box: {
            variantId: '',
            price: 8,
            title: 'Gift box and card',
            image: ''
          },
          gold: {
            variantId: '',
            price: 220,
            title: 'Upgrade to solid gold',
            image: ''
          },
          extra: {
            variantId: '',
            price: 65,
            title: 'Matching piece',
            image: ''
          },
          cloth: {
            variantId: '',
            price: 6,
            title: 'Polishing cloth',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'engrave',
            accessory: 'engrave',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'personal'
            },
            text: 'Engraving',
            reason: 'You said personalised'
          },
          {
            id: 'box',
            accessory: 'box',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'wrapped'
            },
            text: 'Gift box and card',
            reason: 'You said gift wrapped'
          },
          {
            id: 'gold',
            accessory: 'gold',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              all: [
                {
                  field: 'priorities',
                  op: 'includes',
                  value: 'gold'
                },
                {
                  field: 'budget',
                  op: 'gte',
                  value: 300
                }
              ]
            },
            text: 'Upgrade to solid gold',
            reason: 'Within your budget'
          },
          {
            id: 'extra',
            accessory: 'extra',
            qty: {
              expr: 'max(0, pieces - 2)'
            },
            when: {
              field: 'pieces',
              op: 'gt',
              value: 2
            },
            text: 'Matching piece × {qty}',
            reason: 'To reach {pieces} pieces'
          },
          {
            id: 'cloth',
            accessory: 'cloth',
            when: {
              field: 'level',
              op: 'ne',
              value: 'milestone'
            },
            text: 'Polishing cloth',
            reason: 'Keeps silver bright'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'pieces',
            label: '{pieces} piece{s}',
            when: {
              field: 'pieces',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F381;'
          },
          {
            field: 'budget',
            icon: '&#x1F4B7;',
            label: 'About £{budget}'
          }
        ]
      }); }
    },
    {
      id: 'diy-tools',
      label: 'DIY & tools',
      icon: '&#x1F527;',
      blurb: 'Tool kits, project bundles, workshop setups. Sizes from the job, the material and how often it is used.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Kit yourself out for the job', titleHighlight: 'for the job',
        subtitle: 'Tell us about the job and we will kit you out for it.',
        sceneTitle: 'Your kit so far',
        emptyTitle: 'Pick the kind of work',
        priceSuffix: 'complete kit',
        sceneRows: [
          {
            icon: '&#x1F527;',
            label: 'Work: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F4C5;',
            label: '{jobsPerMonth} job(s) a month',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F50B;',
            label: '{batteries} battery(s)',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What kind of work?',
        q1sub: 'Tool class and battery platform follow from this.',
        levels: [
          {
            value: 'fixes',
            icon: '&#x1F528;',
            label: 'Fixes around the house',
            desc: 'Shelves, flat-pack, small repairs'
          },
          {
            value: 'projects',
            icon: '&#x1FA9A;',
            label: 'Projects',
            desc: 'Decking, built-ins, a shed'
          },
          {
            value: 'trade',
            icon: '&#x1F477;',
            label: 'Trade use',
            desc: 'Daily, on site, needs to last'
          }
        ],
        q2: 'How often?',
        q2sub: 'This sizes the battery platform and the consumables.',
        counters: [
          {
            field: 'jobsPerMonth',
            icon: '&#x1F4C5;',
            label: 'Jobs a month',
            min: 1,
            max: 30,
            defaultValue: 2
          },
          {
            field: 'batteries',
            icon: '&#x1F50B;',
            label: 'Batteries wanted',
            min: 1,
            max: 6,
            defaultValue: 2
          }
        ],
        q3: 'What will you mostly cut or fix?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'wood',
            icon: '&#x1FAB5;',
            label: 'Wood'
          },
          {
            value: 'masonry',
            icon: '&#x1F9F1;',
            label: 'Brick and concrete'
          },
          {
            value: 'metal',
            icon: '&#x2699;',
            label: 'Metal'
          },
          {
            value: 'storage',
            icon: '&#x1F9F0;',
            label: 'Need storage'
          }
        ],
        tiers: [
          {
            id: 'home',
            title: 'Home Kit',
            sub: 'Drill driver, bits, hand tools',
            price: 129,
            why: 'One drill driver and a decent bit set covers most of what a house throws at you.',
            contents: [
              {
                name: 'Drill driver',
                detail: '18 V, one battery',
                qty: 1
              },
              {
                name: 'Bit set',
                detail: '60 pieces',
                qty: 1
              },
              {
                name: 'Hand tool set',
                detail: 'Hammer, screwdrivers, tape, level',
                qty: 1
              }
            ]
          },
          {
            id: 'project',
            title: 'Project Kit',
            sub: 'Drill, saw, sander, two batteries',
            price: 349,
            why: 'Projects mean cutting and finishing, not just fixing, so the saw and the sander earn their place.',
            includes: {
              battery: 2
            },
            contents: [
              {
                name: 'Combi drill',
                detail: '18 V',
                qty: 1
              },
              {
                name: 'Circular saw',
                detail: '165 mm',
                qty: 1
              },
              {
                name: 'Random orbit sander',
                detail: '125 mm',
                qty: 1
              },
              {
                name: 'Batteries',
                detail: '4 Ah',
                qty: 2
              },
              {
                name: 'Charger',
                detail: 'Fast',
                qty: 1
              }
            ]
          },
          {
            id: 'trade',
            title: 'Trade Kit',
            sub: 'Brushless, four batteries, cased',
            price: 799,
            why: 'Daily use needs brushless motors and enough batteries that one is always charged.',
            includes: {
              battery: 4,
              case: 1
            },
            contents: [
              {
                name: 'Brushless combi drill',
                detail: '18 V',
                qty: 1
              },
              {
                name: 'Impact driver',
                detail: 'Brushless',
                qty: 1
              },
              {
                name: 'Circular saw',
                detail: 'Brushless',
                qty: 1
              },
              {
                name: 'Multi-tool',
                detail: 'Brushless',
                qty: 1
              },
              {
                name: 'Batteries',
                detail: '5 Ah',
                qty: 4
              },
              {
                name: 'Stacking cases',
                detail: 'Three',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          battery: {
            variantId: '',
            price: 59,
            title: 'Battery, 4 Ah',
            image: ''
          },
          masonry: {
            variantId: '',
            price: 29,
            title: 'Masonry bit set',
            image: ''
          },
          metal: {
            variantId: '',
            price: 34,
            title: 'Metal cutting set',
            image: ''
          },
          case: {
            variantId: '',
            price: 49,
            title: 'Stacking case',
            image: ''
          },
          blades: {
            variantId: '',
            price: 22,
            title: 'Blade and disc pack',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'battery',
            accessory: 'battery',
            qty: {
              expr: 'max(0, batteries - included)'
            },
            when: {
              field: 'batteries',
              op: 'gte',
              value: 1
            },
            text: 'Battery × {qty}',
            reason: 'To reach the {batteries} you asked for'
          },
          {
            id: 'masonry',
            accessory: 'masonry',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'masonry'
            },
            text: 'Masonry bit set',
            reason: 'For brick and concrete'
          },
          {
            id: 'metal',
            accessory: 'metal',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'metal'
            },
            text: 'Metal cutting set',
            reason: 'For metal'
          },
          {
            id: 'case',
            accessory: 'case',
            qty: {
              expr: 'max(0, 1 - included)'
            },
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'storage'
            },
            text: 'Stacking case',
            reason: 'You said storage'
          },
          {
            id: 'blades',
            accessory: 'blades',
            qty: {
              expr: 'ceil(jobsPerMonth / 8)'
            },
            when: {
              field: 'jobsPerMonth',
              op: 'gte',
              value: 4
            },
            text: 'Blade and disc pack × {qty}',
            reason: 'At {jobsPerMonth} jobs a month you will go through them'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'batteries',
            label: '{batteries} batter{s}',
            when: {
              field: 'batteries',
              op: 'gt',
              value: 0
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F527;'
          },
          {
            field: 'jobsPerMonth',
            icon: '&#x1F4C5;',
            label: '{jobsPerMonth} jobs a month'
          }
        ]
      }); }
    },
    {
      id: 'health-supplements',
      label: 'Health & supplements',
      icon: '&#x1F48A;',
      blurb: 'Vitamin stacks, protein, sleep and gut support. Sizes from goal, routine and how many people.',
      scene: 'Answer summary',
      build: function () { return starter({
        title: 'Build your daily stack', titleHighlight: 'daily stack',
        subtitle: 'Tell us what you are working on and we will build the stack.',
        sceneTitle: 'Your stack so far',
        emptyTitle: 'Pick your goal',
        priceSuffix: 'per month',
        sceneRows: [
          {
            icon: '&#x1F3AF;',
            label: 'Goal: {level_label}',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F465;',
            label: '{people} taking it',
            when: {
              field: 'level',
              op: 'truthy'
            }
          },
          {
            icon: '&#x1F4AA;',
            label: '{sessions} training session(s) a week',
            when: {
              field: 'step',
              op: 'gt',
              value: 1
            }
          }
        ],
        q1: 'What is the main goal?',
        q1sub: 'The base stack follows from this.',
        levels: [
          {
            value: 'energy',
            icon: '&#x26A1;',
            label: 'Energy and focus',
            desc: 'Tired by mid-afternoon'
          },
          {
            value: 'training',
            icon: '&#x1F3CB;',
            label: 'Training and recovery',
            desc: 'Protein, creatine, electrolytes'
          },
          {
            value: 'sleep',
            icon: '&#x1F634;',
            label: 'Sleep and stress',
            desc: 'Magnesium, calming blends'
          }
        ],
        q2: 'How much of it?',
        q2sub: 'This sizes the tubs.',
        counters: [
          {
            field: 'people',
            icon: '&#x1F465;',
            label: 'People taking it',
            min: 1,
            max: 4,
            defaultValue: 1
          },
          {
            field: 'sessions',
            icon: '&#x1F4AA;',
            label: 'Training sessions a week',
            min: 0,
            max: 14,
            defaultValue: 3
          }
        ],
        q3: 'Anything to cover?',
        q3sub: 'Pick any that apply.',
        priorities: [
          {
            value: 'gut',
            icon: '&#x1F9A0;',
            label: 'Gut health'
          },
          {
            value: 'vegan',
            icon: '&#x1F331;',
            label: 'Vegan'
          },
          {
            value: 'joints',
            icon: '&#x1F9B4;',
            label: 'Joints'
          },
          {
            value: 'immune',
            icon: '&#x1F6E1;',
            label: 'Immunity'
          }
        ],
        tiers: [
          {
            id: 'daily',
            title: 'Daily Stack',
            sub: 'Multivitamin, D3, omega-3',
            price: 32,
            why: 'The three supplements with the evidence behind them, for everyone.',
            contents: [
              {
                name: 'Multivitamin',
                detail: '60 tablets',
                qty: 1
              },
              {
                name: 'Vitamin D3',
                detail: '2000 IU, 90 caps',
                qty: 1
              },
              {
                name: 'Omega-3',
                detail: '90 caps',
                qty: 1
              }
            ]
          },
          {
            id: 'train',
            title: 'Training Stack',
            sub: 'Daily plus protein and creatine',
            price: 78,
            why: '{sessions} sessions a week is enough that recovery is the limiting factor.',
            includes: {
              protein: 1
            },
            contents: [
              {
                name: 'Daily stack',
                detail: 'Multi, D3, omega-3',
                qty: 1
              },
              {
                name: 'Whey protein',
                detail: '1 kg',
                qty: 1
              },
              {
                name: 'Creatine',
                detail: '300 g',
                qty: 1
              },
              {
                name: 'Electrolytes',
                detail: '30 sachets',
                qty: 1
              }
            ]
          },
          {
            id: 'rest',
            title: 'Rest Stack',
            sub: 'Daily plus magnesium and a calming blend',
            price: 58,
            why: 'Sleep is where everything else gets fixed, so the stack leads with magnesium.',
            includes: {
              magnesium: 1
            },
            contents: [
              {
                name: 'Daily stack',
                detail: 'Multi, D3, omega-3',
                qty: 1
              },
              {
                name: 'Magnesium glycinate',
                detail: '120 caps',
                qty: 1
              },
              {
                name: 'Calming blend',
                detail: '60 caps',
                qty: 1
              }
            ]
          }
        ],
        accessories: {
          protein: {
            variantId: '',
            price: 29,
            title: 'Whey or plant protein',
            image: ''
          },
          magnesium: {
            variantId: '',
            price: 16,
            title: 'Magnesium glycinate',
            image: ''
          },
          probiotic: {
            variantId: '',
            price: 22,
            title: 'Probiotic',
            image: ''
          },
          collagen: {
            variantId: '',
            price: 24,
            title: 'Collagen',
            image: ''
          },
          zinc: {
            variantId: '',
            price: 9,
            title: 'Zinc and vitamin C',
            image: ''
          }
        },
        addonRules: [
          {
            id: 'protein',
            accessory: 'protein',
            qty: {
              expr: 'max(0, ceil(sessions / 4) - included)'
            },
            when: {
              field: 'sessions',
              op: 'gte',
              value: 2
            },
            text: 'Protein × {qty}',
            reason: 'Roughly one tub per four sessions a week'
          },
          {
            id: 'probiotic',
            accessory: 'probiotic',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'gut'
            },
            text: 'Probiotic',
            reason: 'You said gut health'
          },
          {
            id: 'collagen',
            accessory: 'collagen',
            when: {
              all: [
                {
                  field: 'priorities',
                  op: 'includes',
                  value: 'joints'
                },
                {
                  not: {
                    field: 'priorities',
                    op: 'includes',
                    value: 'vegan'
                  }
                }
              ]
            },
            text: 'Collagen',
            reason: 'For joints. Left out for vegan stacks.'
          },
          {
            id: 'zinc',
            accessory: 'zinc',
            when: {
              field: 'priorities',
              op: 'includes',
              value: 'immune'
            },
            text: 'Zinc and vitamin C',
            reason: 'You said immunity'
          },
          {
            id: 'people',
            accessory: 'magnesium',
            qty: {
              expr: 'max(0, people - 1)'
            },
            when: {
              all: [
                {
                  field: 'level',
                  op: 'eq',
                  value: 'sleep'
                },
                {
                  field: 'people',
                  op: 'gt',
                  value: 1
                }
              ]
            },
            text: 'Magnesium × {qty}',
            reason: '{people} people sharing the stack'
          }
        ],
        chips: [
          {
            field: 'level'
          },
          {
            field: 'people',
            label: '{people} taking it',
            when: {
              field: 'people',
              op: 'gt',
              value: 1
            }
          }
        ],
        profileChips: [
          {
            field: 'level',
            icon: '&#x1F3AF;'
          },
          {
            field: 'sessions',
            icon: '&#x1F4AA;',
            label: '{sessions} sessions a week'
          }
        ]
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
            rows: [{ icon: '&#x25C8;', label: 'Choice: {choice_label}', when: { field: 'choice', op: 'truthy' } },
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
