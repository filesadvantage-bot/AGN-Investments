import type {
  CartItem,
  DepartmentMenuGroup,
  OrderRecord,
  Product,
  SamplePlantTemplate
} from '../types/pos.ts';

export const AQUA_NEST_LOGO = '/assets/aistudio/image_d93ceeb9.png';

export const HERO_BANNER_IMAGE =
  '/src/assets/images/hero_nature_aquascape_tank_1794991273246.jpg';

export const DEPARTMENT_MENU_GROUPS: DepartmentMenuGroup[] = [
  {
    id: 'Aquarium Plants',
    label: 'Aquarium Plants',
    description: 'Anubias, Bucephalandra, Carpeting, Stem Plants, Ferns & Moss',
    subcategories: [
      'Anubias',
      'Bucephalandra',
      'Ferns',
      'Carpeting',
      'Stem Plants',
      'Cryptocoryne & Swords',
      'Moss & Floaters'
    ]
  },
  {
    id: 'Plants by Placement',
    label: 'Plants by Placement',
    description: 'Shop live plants by Foreground, Midground, Background & Floating zones',
    subcategories: ['Foreground', 'Midground', 'Background', 'Floating']
  },
  {
    id: 'Aquascaping',
    label: 'Aquascaping',
    description: 'Active planted substrates, Iwagumi stones, liquid fertilizers & CO2',
    subcategories: ['Soil & Substrate', 'Hardscape', 'Fertilizers']
  },
  {
    id: 'Accessories',
    label: 'Accessories',
    description: 'WRGB aquarium lights, hang-on-back filters, surface skimmers & fish food',
    subcategories: ['Lights', 'Filters & Media', 'Fish Food']
  },
  {
    id: 'Water Treatment',
    label: 'Water Treatment',
    description: 'Dechlorinators, liquid bio-carbon, shrimp minerals & conditioners',
    subcategories: ['Water Conditioner']
  }
];

export const AQUATIC_BRANDS = [
  'All Brands',
  'Nature Aquatics',
  'Tropica 1-2-Grow!',
  'ADA',
  'The 2Hr Aquarist',
  'Seachem',
  'Aquatic Venturez',
  'Neo Helios',
  'SunSun'
];

export const DEFAULT_CATEGORIES = [
  'All',
  'Anubias',
  'Bucephalandra',
  'Ferns',
  'Carpeting',
  'Stem Plants',
  'Cryptocoryne & Swords',
  'Moss & Floaters',
  'Soil & Substrate',
  'Hardscape',
  'Fertilizers',
  'Lights',
  'Filters & Media',
  'Fish Food',
  'Water Conditioner',
  'Custom'
];

export const ICON_OPTIONS = ['🌿', '🌱', '🍀', '🪴', '🌾', '🪷', '🪵', '🪨', '💧', '💡', '🫧', '🦐'];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'aq-1',
    name: "Anubias Nana 'Petite'",
    scientificName: 'Anubias barteri var. nana',
    price: 1650,
    department: 'Aquarium Plants',
    category: 'Anubias',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    isBestSeller: true,
    stock: 28,
    icon: '🌿',
    image: '/src/assets/images/anubias_nana_petite_1794985085092.jpg',
    sku: 'NA-EPI-101',
    careNote: 'Low Light · Epiphyte · CO2 Optional',
    portionOptions: [
      { label: 'Potted Rhizome', priceDelta: 0 },
      { label: '1-2-Grow! Tissue Cup', priceDelta: 250 },
      { label: 'Lava Rock Mounted', priceDelta: 850 }
    ]
  },
  {
    id: 'aq-2',
    name: "Bucephalandra 'Kedagang'",
    scientificName: 'Bucephalandra sp. Red/Purple',
    price: 1850,
    originalPrice: 2150,
    department: 'Aquarium Plants',
    category: 'Bucephalandra',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    isBestSeller: true,
    isNewArrival: true,
    stock: 16,
    icon: '🪴',
    image: '/src/assets/images/bucephalandra_kedagang_1794985086059.jpg',
    sku: 'NA-BUC-102',
    careNote: 'Low–Med Light · Iridescent Dark Leaf',
    portionOptions: [
      { label: 'Submerged Clump', priceDelta: 0 },
      { label: '1-2-Grow! Tissue Cup', priceDelta: 350 },
      { label: 'Mini Driftwood Mount', priceDelta: 950 }
    ]
  },
  {
    id: 'aq-3',
    name: "Java Fern 'Trident'",
    scientificName: 'Microsorum pteropus',
    price: 1550,
    department: 'Aquarium Plants',
    category: 'Ferns',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    stock: 22,
    icon: '🌿',
    image: '/src/assets/images/java_fern_trident_1794985086381.jpg',
    sku: 'NA-FRN-103',
    careNote: 'Low Light · Hardy Driftwood Fern',
    portionOptions: [
      { label: 'Potted', priceDelta: 0 },
      { label: 'Coco Mat Portion', priceDelta: 550 }
    ]
  },
  {
    id: 'aq-4',
    name: 'Monte Carlo Carpet',
    scientificName: 'Micranthemum tweediei',
    price: 1400,
    department: 'Aquarium Plants',
    category: 'Carpeting',
    placement: 'Foreground',
    brand: 'Tropica 1-2-Grow!',
    isBestSeller: true,
    stock: 34,
    icon: '🍀',
    image: '/src/assets/images/monte_carlo_carpet_1794985086304.jpg',
    sku: 'TC-CRP-201',
    careNote: 'Med Light · Lush Cascading Carpet',
    portionOptions: [
      { label: '1-2-Grow! Tissue Cup', priceDelta: 0 },
      { label: 'Submerged 3x3" Mat', priceDelta: 450 },
      { label: 'Potted', priceDelta: -150 }
    ]
  },
  {
    id: 'aq-5',
    name: "Dwarf Hairgrass 'Mini'",
    scientificName: 'Eleocharis acicularis',
    price: 1150,
    originalPrice: 1350,
    department: 'Aquarium Plants',
    category: 'Carpeting',
    placement: 'Foreground',
    brand: 'Tropica 1-2-Grow!',
    stock: 25,
    icon: '🌱',
    image: '/src/assets/images/dwarf_hairgrass_mini_1794985090202.jpg',
    sku: 'TC-CRP-202',
    careNote: 'Med Light · Iwagumi Lawn Runner',
    portionOptions: [
      { label: '1-2-Grow! Tissue Cup', priceDelta: 0 },
      { label: 'Potted Plugs', priceDelta: -100 }
    ]
  },
  {
    id: 'aq-6',
    name: "Dwarf Baby Tears 'Cuba'",
    scientificName: 'Hemianthus callitrichoides',
    price: 1550,
    department: 'Aquarium Plants',
    category: 'Carpeting',
    placement: 'Foreground',
    brand: 'Tropica 1-2-Grow!',
    isNewArrival: true,
    stock: 14,
    icon: '🍀',
    image: '/src/assets/images/dwarf_baby_tears_cuba_1794985092226.jpg',
    sku: 'TC-CRP-203',
    careNote: 'High Light · CO2 Required · Pearling Carpet',
    portionOptions: [
      { label: '1-2-Grow! Tissue Cup', priceDelta: 0 },
      { label: 'Potted', priceDelta: 50 }
    ]
  },
  {
    id: 'aq-7',
    name: "Rotala 'H'ra' Viet",
    scientificName: 'Rotala rotundifolia',
    price: 850,
    originalPrice: 1150,
    department: 'Aquarium Plants',
    category: 'Stem Plants',
    placement: 'Background',
    brand: 'Nature Aquatics',
    isBestSeller: true,
    stock: 40,
    icon: '🌾',
    image: '/src/assets/images/rotala_hra_viet_1794985094642.jpg',
    sku: 'NA-STM-301',
    careNote: 'High Light · Vibrant Orange-Red Canopy',
    portionOptions: [
      { label: 'Lead Bunch (8 Stems)', priceDelta: 0 },
      { label: '1-2-Grow! Tissue Cup', priceDelta: 350 }
    ]
  },
  {
    id: 'aq-8',
    name: "Ludwigia 'Super Red'",
    scientificName: 'Ludwigia palustris',
    price: 950,
    department: 'Aquarium Plants',
    category: 'Stem Plants',
    placement: 'Background',
    brand: 'Nature Aquatics',
    isNewArrival: true,
    stock: 30,
    icon: '🌾',
    image: '/src/assets/images/ludwigia_super_red_1794985094991.jpg',
    sku: 'NA-STM-302',
    careNote: 'Med–High Light · Deep Crimson Stems',
    portionOptions: [
      { label: 'Lead Bunch (6 Stems)', priceDelta: 0 },
      { label: 'Potted', priceDelta: 200 }
    ]
  },
  {
    id: 'aq-9',
    name: 'Cryptocoryne Wendtii Green',
    scientificName: 'Cryptocoryne wendtii',
    price: 1280,
    department: 'Aquarium Plants',
    category: 'Cryptocoryne & Swords',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    stock: 26,
    icon: '🪴',
    image: '/src/assets/images/cryptocoryne_wendtii_green_1794985095241.jpg',
    sku: 'NA-CRY-401',
    careNote: 'Low Light · Heavy Root Feeder',
    portionOptions: [
      { label: 'Potted', priceDelta: 0 },
      { label: '1-2-Grow! Tissue Cup', priceDelta: 200 }
    ]
  },
  {
    id: 'aq-10',
    name: 'Amazon Sword',
    scientificName: 'Echinodorus grisebachii',
    price: 1200,
    department: 'Aquarium Plants',
    category: 'Cryptocoryne & Swords',
    placement: 'Background',
    brand: 'Nature Aquatics',
    stock: 19,
    icon: '🌿',
    image: '/src/assets/images/amazon_sword_plant_1794985097630.jpg',
    sku: 'NA-ROS-402',
    careNote: 'Low–Med Light · Bold Background Rosette',
    portionOptions: [
      { label: 'Potted Crown', priceDelta: 0 },
      { label: 'XL Mother Plant', priceDelta: 1050 }
    ]
  },
  {
    id: 'aq-11',
    name: 'Christmas Moss',
    scientificName: 'Vesicularia montagnei',
    price: 1300,
    department: 'Aquarium Plants',
    category: 'Moss & Floaters',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    stock: 32,
    icon: '🌱',
    image: '/src/assets/images/christmas_moss_aquatic_1794985098755.jpg',
    sku: 'NA-MOS-501',
    careNote: 'Low Light · Pine-Frond Driftwood Moss',
    portionOptions: [
      { label: '2oz Portion Cup', priceDelta: 0 },
      { label: '3x3" Stainless Mesh', priceDelta: 450 }
    ]
  },
  {
    id: 'aq-12',
    name: 'Red Root Floater',
    scientificName: 'Phyllanthus fluitans',
    price: 880,
    originalPrice: 1080,
    department: 'Aquarium Plants',
    category: 'Moss & Floaters',
    placement: 'Floating',
    brand: 'Nature Aquatics',
    isNewArrival: true,
    stock: 24,
    icon: '🪷',
    image: '/src/assets/images/red_root_floater_1794985099442.jpg',
    sku: 'NA-FLT-502',
    careNote: 'Med–High Light · Surface Nitrate Sponge',
    portionOptions: [
      { label: '4oz Surface Cup', priceDelta: 0 },
      { label: 'Breeder Clump (2x)', priceDelta: 720 }
    ]
  },
  {
    id: 'aq-13',
    name: 'ADA Aqua Soil Amazonia Ver. 2 (9L)',
    scientificName: 'Active Buffering Soil + Supplement Pellets',
    price: 5950,
    department: 'Aquascaping',
    category: 'Soil & Substrate',
    brand: 'ADA',
    isBestSeller: true,
    stock: 15,
    icon: '🪨',
    image: '/src/assets/images/aquasoil_amazonia_substrate_1794985101429.jpg',
    sku: 'ADA-SOL-601',
    careNote: 'Lowers pH & KH · Rich Organic Humic Acids'
  },
  {
    id: 'aq-14',
    name: 'Seiryu Ryuoh Stone (Per kg)',
    scientificName: 'Acid-Washed Iwagumi Aquascape Limestone',
    price: 980,
    department: 'Aquascaping',
    category: 'Hardscape',
    brand: 'ADA',
    stock: 85,
    icon: '🪨',
    image: '/src/assets/images/seiryu_ryuoh_stone_1794985103632.jpg',
    sku: 'ADA-HRD-602',
    careNote: 'Crisp Calcite Veining · Hand-Picked Pieces'
  },
  {
    id: 'aq-15',
    name: 'APT 3 Complete Planted Fertilizer (500ml)',
    scientificName: 'All-in-One NPK + Chelated Iron & Micros',
    price: 2950,
    department: 'Aquascaping',
    category: 'Fertilizers',
    brand: 'The 2Hr Aquarist',
    isBestSeller: true,
    stock: 21,
    icon: '💧',
    image: '/src/assets/images/planted_tank_fertilizer_1794985109033.jpg',
    sku: 'APT-NUT-701',
    careNote: 'Shrimp Safe · Calibrated 1ml Pump Dispenser'
  },
  {
    id: 'aq-16',
    name: 'Neo Helios Flat WRGB Planted LED (45–60cm)',
    scientificName: 'Full-Spectrum Slim Aluminum Aquarium Light',
    price: 3450,
    originalPrice: 3950,
    department: 'Accessories',
    category: 'Lights',
    brand: 'Neo Helios',
    isNewArrival: true,
    isBestSeller: true,
    stock: 12,
    icon: '💡',
    image: '/src/assets/images/wrgb_aquarium_led_light_1794991273691.jpg',
    sku: 'NH-LGT-801',
    careNote: '24W High PAR · Boosts Red & Green Pigments'
  },
  {
    id: 'aq-17',
    name: 'SunSun Hang-On-Back Filter & Skimmer',
    scientificName: 'Dual Surface Oil-Film Skimmer + Bio Media',
    price: 1650,
    department: 'Accessories',
    category: 'Filters & Media',
    brand: 'SunSun',
    isNewArrival: true,
    stock: 18,
    icon: '🫧',
    image: '/src/assets/images/aquarium_hob_surface_skimmer_1794991275139.jpg',
    sku: 'SS-FLT-802',
    careNote: 'Whisper Quiet · Adjustable Flow Dial'
  },
  {
    id: 'aq-18',
    name: 'Seachem Flourish Excel & Conditioner Duo',
    scientificName: 'Bio-Available Organic Carbon + Dechlorinator',
    price: 2850,
    originalPrice: 3200,
    department: 'Water Treatment',
    category: 'Water Conditioner',
    brand: 'Seachem',
    isBestSeller: true,
    stock: 20,
    icon: '💧',
    image: '/src/assets/images/water_conditioner_aquatic_bottles_1794991276152.jpg',
    sku: 'SEA-WTR-901',
    careNote: 'Detoxifies Chlorine/Ammonia · Suppresses BBA'
  },
  {
    id: 'aq-19',
    name: 'Aquatic Venturez Shrimp Grazers & Micro Pellets',
    scientificName: 'Spirulina Wafer + High-Protein Nano Diet',
    price: 480,
    department: 'Accessories',
    category: 'Fish Food',
    brand: 'Aquatic Venturez',
    isNewArrival: true,
    stock: 36,
    icon: '🦐',
    image: '/src/assets/images/shrimp_grazers_micro_pellets_1794991276955.jpg',
    sku: 'AV-FOD-803',
    careNote: 'Non-Clouding Formula · Neocaridina & Rasboras'
  }
];

export const SAMPLE_AQUATIC_PLANT_TEMPLATES: SamplePlantTemplate[] = [
  {
    id: 'tpl-ar-mini',
    name: "Alternanthera Reineckii 'Mini'",
    scientificName: 'Alternanthera reineckii',
    price: 1550,
    department: 'Aquarium Plants',
    category: 'Carpeting',
    placement: 'Foreground',
    brand: 'Tropica 1-2-Grow!',
    stock: 20,
    icon: '🌺',
    image: '/src/assets/images/alternanthera_reineckii_mini_1794985105326.jpg',
    careNote: 'Med–High Light · Magenta Mid/Foreground',
    portionOptions: [
      { label: '1-2-Grow! Tissue Cup', priceDelta: 0 },
      { label: 'Potted', priceDelta: -150 }
    ]
  },
  {
    id: 'tpl-pinna',
    name: 'Hygrophila Pinnatifida',
    scientificName: 'Hygrophila pinnatifida',
    price: 1380,
    department: 'Aquarium Plants',
    category: 'Stem Plants',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    stock: 18,
    icon: '🌿',
    image: '/src/assets/images/java_fern_trident_1794985086381.jpg',
    careNote: 'Med Light · Attaches to Wood/Rock',
    portionOptions: [
      { label: 'Potted', priceDelta: 0 },
      { label: '1-2-Grow! Tissue Cup', priceDelta: 270 }
    ]
  },
  {
    id: 'tpl-downoi',
    name: "Pogostemon Helferi 'Downoi'",
    scientificName: 'Pogostemon helferi',
    price: 1620,
    department: 'Aquarium Plants',
    category: 'Carpeting',
    placement: 'Foreground',
    brand: 'Tropica 1-2-Grow!',
    stock: 15,
    icon: '🍀',
    image: '/src/assets/images/dwarf_baby_tears_cuba_1794985092226.jpg',
    careNote: 'Med Light · Star-Shaped Rosette',
    portionOptions: [
      { label: '1-2-Grow! Tissue Cup', priceDelta: 0 },
      { label: 'Potted', priceDelta: 0 }
    ]
  },
  {
    id: 'tpl-tiger-lotus',
    name: 'Red Tiger Lotus Bulb',
    scientificName: 'Nymphaea zenkeri',
    price: 1800,
    department: 'Aquarium Plants',
    category: 'Cryptocoryne & Swords',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    stock: 12,
    icon: '🪷',
    image: '/src/assets/images/red_tiger_lotus_aquatic_1794985108011.jpg',
    careNote: 'Med Light · Sprouted Aquarium Bulb',
    portionOptions: [
      { label: 'Sprouted Bulb', priceDelta: 0 },
      { label: 'Potted Young Plant', priceDelta: 600 }
    ]
  },
  {
    id: 'tpl-bolbitis',
    name: 'African Water Fern (Bolbitis)',
    scientificName: 'Bolbitis heudelotii',
    price: 1980,
    department: 'Aquarium Plants',
    category: 'Ferns',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    stock: 14,
    icon: '🌿',
    image: '/src/assets/images/java_fern_trident_1794985086381.jpg',
    careNote: 'Low–Med Light · Translucent Fronds',
    portionOptions: [
      { label: 'Potted Rhizome', priceDelta: 0 },
      { label: 'Driftwood Mounted', priceDelta: 950 }
    ]
  },
  {
    id: 'tpl-s-repens',
    name: 'Staurogyne Repens',
    scientificName: 'Staurogyne repens',
    price: 1320,
    department: 'Aquarium Plants',
    category: 'Carpeting',
    placement: 'Foreground',
    brand: 'Tropica 1-2-Grow!',
    stock: 28,
    icon: '🌱',
    image: '/src/assets/images/monte_carlo_carpet_1794985086304.jpg',
    careNote: 'Med Light · Compact Bushy Carpet',
    portionOptions: [
      { label: '1-2-Grow! Tissue Cup', priceDelta: 0 },
      { label: 'Potted', priceDelta: -100 }
    ]
  },
  {
    id: 'tpl-val-nana',
    name: 'Vallisneria Nana',
    scientificName: 'Vallisneria nana',
    price: 1100,
    department: 'Aquarium Plants',
    category: 'Stem Plants',
    placement: 'Background',
    brand: 'Nature Aquatics',
    stock: 30,
    icon: '🌾',
    image: '/src/assets/images/dwarf_hairgrass_mini_1794985090202.jpg',
    careNote: 'Low–Med Light · Fine Background Grass',
    portionOptions: [
      { label: 'Bunch (5 Runners)', priceDelta: 0 },
      { label: 'Potted', priceDelta: 180 }
    ]
  },
  {
    id: 'tpl-weeping-moss',
    name: 'Weeping Moss',
    scientificName: 'Vesicularia ferriei',
    price: 1400,
    department: 'Aquarium Plants',
    category: 'Moss & Floaters',
    placement: 'Midground',
    brand: 'Nature Aquatics',
    stock: 22,
    icon: '🌱',
    image: '/src/assets/images/christmas_moss_aquatic_1794985098755.jpg',
    careNote: 'Low Light · Cascading Bonsai Canopy',
    portionOptions: [
      { label: '1-2-Grow! Tissue Cup', priceDelta: 0 },
      { label: '2oz Submerged Cup', priceDelta: -150 }
    ]
  }
];

export const INITIAL_CART: CartItem[] = [
  {
    cartKey: 'aq-1::Potted Rhizome',
    productId: 'aq-1',
    name: "Anubias Nana 'Petite'",
    portionLabel: 'Potted Rhizome',
    price: 1650,
    quantity: 1,
    icon: '🌿',
    image: '/src/assets/images/anubias_nana_petite_1794985085092.jpg'
  },
  {
    cartKey: 'aq-4::1-2-Grow! Tissue Cup',
    productId: 'aq-4',
    name: 'Monte Carlo Carpet',
    portionLabel: '1-2-Grow! Tissue Cup',
    price: 1400,
    quantity: 2,
    icon: '🍀',
    image: '/src/assets/images/monte_carlo_carpet_1794985086304.jpg'
  }
];

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ORD-1001',
    timestamp: 'Today, 09:45 AM',
    customerName: 'Aarav Shrestha',
    customerPhone: '9841-550192',
    orderNote: '60P Iwagumi rescape — pack tissue cups with damp towel',
    items: [
      {
        cartKey: 'aq-4::1-2-Grow! Tissue Cup',
        productId: 'aq-4',
        name: 'Monte Carlo Carpet',
        portionLabel: '1-2-Grow! Tissue Cup',
        price: 1400,
        quantity: 3,
        icon: '🍀',
        image: '/src/assets/images/monte_carlo_carpet_1794985086304.jpg'
      },
      {
        cartKey: 'aq-13',
        productId: 'aq-13',
        name: 'ADA Aqua Soil Amazonia Ver. 2 (9L)',
        price: 5950,
        quantity: 1,
        icon: '🪨',
        image: '/src/assets/images/aquasoil_amazonia_substrate_1794985101429.jpg'
      }
    ],
    subtotal: 10150,
    total: 10150,
    paymentMethod: 'eSewa Payment Gateway',
    paymentDetails: 'eSewa ePay Verified · Ref ESW-948210 · Wallet 9841****92',
    status: 'Paid'
  },
  {
    id: 'ORD-1002',
    timestamp: 'Today, 11:15 AM',
    customerName: 'Sita Gurung',
    customerPhone: '9803-550344',
    orderNote: 'Low-tech betta cube plants',
    items: [
      {
        cartKey: 'aq-1::Lava Rock Mounted',
        productId: 'aq-1',
        name: "Anubias Nana 'Petite'",
        portionLabel: 'Lava Rock Mounted',
        price: 2500,
        quantity: 1,
        icon: '🌿',
        image: '/src/assets/images/anubias_nana_petite_1794985085092.jpg'
      },
      {
        cartKey: 'aq-12::4oz Surface Cup',
        productId: 'aq-12',
        name: 'Red Root Floater',
        portionLabel: '4oz Surface Cup',
        price: 1080,
        quantity: 2,
        icon: '🪷',
        image: '/src/assets/images/red_root_floater_1794985099442.jpg'
      }
    ],
    subtotal: 4660,
    total: 4660,
    paymentMethod: 'Khalti Payment Gateway',
    paymentDetails: 'Khalti KPG-2 Verified · Ref KHL-772049 · Wallet 9803****44',
    status: 'Paid'
  }
];
