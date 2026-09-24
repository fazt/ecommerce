/**
 * Seed script. Populates the local database with the canonical demo dataset:
 *  - 1 SUPER_ADMIN, 1 ADMIN, 2 USERs
 *  - 6 categories (one parent + child hierarchy)
 *  - 24 products with multiple real Unsplash images
 *  - 2 coupons (PERCENTAGE + FIXED_AMOUNT)
 *  - 2 shipping zones (US + EU) with 4 rates each
 *
 * Idempotent: re-running upserts.
 *
 * Run with: pnpm seed
 */

import { PrismaClient, Role, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

async function seedUsers() {
  const password = (plain: string) => bcrypt.hashSync(plain, 10);
  const accounts = [
    {
      email: 'admin@example.com',
      name: 'Site Administrator',
      role: Role.SUPER_ADMIN,
      plain: 'admin1234',
    },
    {
      email: 'manager@example.com',
      name: 'Store Manager',
      role: Role.ADMIN,
      plain: 'manager1234',
    },
    {
      email: 'alice@example.com',
      name: 'Alice Customer',
      role: Role.USER,
      plain: 'alice1234',
    },
    {
      email: 'bob@example.com',
      name: 'Bob Customer',
      role: Role.USER,
      plain: 'bob1234',
    },
  ];

  for (const a of accounts) {
    await prisma.user.upsert({
      where: { email: a.email },
      update: { role: a.role, name: a.name },
      create: {
        email: a.email,
        name: a.name,
        role: a.role,
        hashedPassword: password(a.plain),
        emailVerified: new Date(),
        preferredCurrency: 'USD',
        preferredLocale: 'en',
      },
    });
  }
  // eslint-disable-next-line no-console
  console.log(`✓ Users: ${accounts.length}`);
}

// ---------------------------------------------------------------------------
// Categories (one parent + child pair among the 6)
// ---------------------------------------------------------------------------

async function seedCategories() {
  const plan: { slug: string; name: string; description?: string; parent?: string }[] = [
    { slug: 'apparel', name: 'Apparel', description: 'Clothing, shoes, accessories' },
    { slug: 'mens', name: "Men's", description: "Men's apparel", parent: 'apparel' },
    { slug: 'womens', name: "Women's", description: "Women's apparel", parent: 'apparel' },
    { slug: 'electronics', name: 'Electronics', description: 'Gadgets and devices' },
    { slug: 'home', name: 'Home & Kitchen', description: 'Cookware, decor, bedding' },
    { slug: 'books', name: 'Books', description: 'Paperbacks and hardcovers' },
  ];

  const slugToId = new Map<string, string>();
  for (const c of plan) {
    const created = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description ?? null },
      create: {
        slug: c.slug,
        name: c.name,
        description: c.description ?? null,
        parentId: c.parent ? slugToId.get(c.parent) ?? null : null,
      },
    });
    slugToId.set(c.slug, created.id);
  }
  // Second pass to wire parents if order caused undefined initially.
  for (const c of plan) {
    if (c.parent) {
      await prisma.category.update({
        where: { slug: c.slug },
        data: { parentId: slugToId.get(c.parent) ?? null },
      });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`✓ Categories: ${plan.length}`);
  return slugToId;
}

// ---------------------------------------------------------------------------
// Products (24 across categories) — Real Unsplash photo IDs as images.
// All URLs verified to return HTTP 200 from images.unsplash.com.
// ---------------------------------------------------------------------------

const UN = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

async function seedProducts(catIds: Map<string, string>) {
  type P = {
    slug: string;
    name: string;
    short: string;
    description: string;
    priceCents: number;
    compareAtCents?: number;
    category: string;
    stock: number;
    tags: string[];
    isFeatured?: boolean;
    images: string[]; // 2 Unsplash URLs
  };

  const products: P[] = [
    // ── Mens ───────────────────────────────────────────────────────────────
    {
      slug: 'classic-tee-navy',
      name: 'Classic Tee — Navy',
      short: '100% combed cotton',
      description:
        'A heritage-fit navy tee knit from heavyweight 220 gsm combed cotton. Pre-shrunk for true sizing, with reinforced shoulder taping and a clean ribbed crew neckline that holds its shape wash after wash. A staple for daily rotations.',
      priceCents: 2900,
      category: 'mens',
      stock: 120,
      tags: ['shirt', 'cotton'],
      isFeatured: true,
      images: [
        UN('1621951767587-b24334f11c65'),
        UN('1666358057084-5f63d94d6958'),
      ],
    },
    {
      slug: 'oxford-shirt-white',
      name: 'Oxford Shirt — White',
      short: 'Button-down oxford',
      description:
        'Crisp wrinkle-free oxford weave in clean white. A button-down collar, single chest pocket, and barrel cuffs give it a tailored feel that moves easily from desk to dinner.',
      priceCents: 6900,
      category: 'mens',
      stock: 80,
      tags: ['shirt'],
      images: [
        UN('1603252109612-24fa03d145c8'),
        UN('1612541122840-bf7071c968a2'),
      ],
    },
    {
      slug: 'selvedge-jeans-indigo',
      name: 'Selvedge Jeans — Indigo',
      short: 'Japanese selvedge denim',
      description:
        '14 oz Japanese selvedge denim woven on vintage shuttle looms, in a clean indigo rinse. Straight cut with a mid-rise waistband and signature red-line selvedge ID. Built to wear in for years, not seasons.',
      priceCents: 14900,
      compareAtCents: 17900,
      category: 'mens',
      stock: 40,
      tags: ['denim'],
      images: [
        UN('1637069585336-827b298fe84a'),
        UN('1631112230741-446762ee05ac'),
      ],
    },
    {
      slug: 'crewneck-sweater-grey',
      name: 'Crewneck Sweater — Grey',
      short: 'Merino wool',
      description:
        'Fine-gauge merino in a versatile heather grey. Naturally temperature-regulating, odor-resistant, and soft against the skin. Ribbed trim at the collar, cuffs, and hem keeps the silhouette clean.',
      priceCents: 11900,
      category: 'mens',
      stock: 60,
      tags: ['sweater'],
      images: [
        UN('1604573824419-289a9a10672c'),
        UN('1578681994827-a9776963799c'),
      ],
    },

    // ── Womens ──────────────────────────────────────────────────────────────
    {
      slug: 'silk-blouse-ivory',
      name: 'Silk Blouse — Ivory',
      short: 'Mulberry silk',
      description:
        'Cut from 100% mulberry silk with a soft matte finish. The relaxed fit drapes cleanly, with a covered placket and French seams inside. An ivory wardrobe staple that pairs with denim, trousers, or tailoring.',
      priceCents: 12900,
      category: 'womens',
      stock: 50,
      tags: ['blouse'],
      isFeatured: true,
      images: [
        UN('1761117228880-df2425bd70da'),
        UN('1761121317492-57feee4fc674'),
      ],
    },
    {
      slug: 'a-line-midi-skirt',
      name: 'A-Line Midi Skirt',
      short: 'Pleated midi',
      description:
        'A pleated A-line midi that moves with you. Cut from a mid-weight crepe with hidden side pockets and a clean waistband. Versatile from office hours to evening.',
      priceCents: 8900,
      category: 'womens',
      stock: 70,
      tags: ['skirt'],
      images: [
        UN('1509087859087-a384654eca4d'),
        UN('1783785685049-d7e4adbaa9f8'),
      ],
    },
    {
      slug: 'cashmere-cardigan',
      name: 'Cashmere Cardigan',
      short: 'Grade-A cashmere',
      description:
        'A featherweight Grade-A Mongolian cashmere cardigan with ribbed cuffs and a button placket. Layered over a tee or under a coat — the kind of piece that earns its hanger.',
      priceCents: 24900,
      compareAtCents: 29900,
      category: 'womens',
      stock: 30,
      tags: ['sweater'],
      images: [
        UN('1603906650843-b58e94d9df4d'),
        UN('1596433904747-e8b061219a71'),
      ],
    },
    {
      slug: 'leather-tote-tan',
      name: 'Leather Tote — Tan',
      short: 'Full-grain leather',
      description:
        'A vegetable-tanned full-grain leather tote that develops a rich patina with use. Roomy enough for a 14" laptop, with reinforced handles and an interior pocket. Hand-finished edges.',
      priceCents: 19900,
      category: 'womens',
      stock: 25,
      tags: ['bag'],
      images: [
        UN('1624687943971-e86af76d57de'),
        UN('1637759292654-a12cb2be085e'),
      ],
    },

    // ── Electronics ─────────────────────────────────────────────────────────
    {
      slug: 'wireless-earbuds-pro',
      name: 'Wireless Earbuds Pro',
      short: 'Active noise cancellation',
      description:
        'Premium wireless earbuds with hybrid active noise cancellation, transparency mode, and 30-hour total battery life via the wireless charging case. USB-C fast charge delivers 2 hours of playback in 10 minutes.',
      priceCents: 17900,
      compareAtCents: 19900,
      category: 'electronics',
      stock: 100,
      tags: ['audio'],
      isFeatured: true,
      images: [
        UN('1572569511254-d8f925fe2cbb'),
        UN('1590658268037-6bf12165a8df'),
      ],
    },
    {
      slug: 'mech-keyboard-tkl',
      name: 'Mech Keyboard — TKL',
      short: 'Hot-swap mechanical',
      description:
        'A tenkeyless mechanical keyboard with a gasket-mount chassis, hot-swap PCB, and per-key RGB. Ships with linear switches; supports 3-pin and 5-pin MX-style switches for easy customization.',
      priceCents: 14900,
      category: 'electronics',
      stock: 45,
      tags: ['keyboard'],
      images: [
        UN('1618384887929-16ec33fab9ef'),
        UN('1547394765-185e1e68f34e'),
      ],
    },
    {
      slug: 'usb-c-hub-7-in-1',
      name: 'USB-C Hub 7-in-1',
      short: '100W PD passthrough',
      description:
        'Compact aluminum hub that adds HDMI 4K@60Hz, 100W USB-C PD passthrough, SD and microSD card readers, and three USB-A 3.0 ports to any USB-C laptop or tablet.',
      priceCents: 4900,
      category: 'electronics',
      stock: 200,
      tags: ['accessory'],
      images: [
        UN('1616578273461-3a99ce422de6'),
        UN('1616578273577-5d54546f4dec'),
      ],
    },
    {
      slug: 'smart-desk-lamp',
      name: 'Smart Desk Lamp',
      short: 'Tunable white',
      description:
        'A 5W LED desk lamp with tunable white from 2700K to 6500K, app and voice control, and a built-in USB-C charging port. Aluminum body with a touch-sensitive dimmer.',
      priceCents: 8900,
      category: 'electronics',
      stock: 60,
      tags: ['lighting'],
      images: [
        UN('1519219788971-8d9797e0928e'),
        UN('1585597647877-6eaa01bf9a05'),
      ],
    },

    // ── Home & Kitchen ──────────────────────────────────────────────────────
    {
      slug: 'pour-over-kettle',
      name: 'Pour-Over Kettle',
      short: 'Gooseneck spout',
      description:
        'A 1L stainless steel gooseneck kettle with an induction-compatible base and a precision pour spout engineered for pour-over coffee. Ergonomic handle stays cool.',
      priceCents: 7900,
      category: 'home',
      stock: 90,
      tags: ['kitchen'],
      images: [
        UN('1650940925927-f4a30c930a4d'),
        UN('1559761340-1e6a341f0b51'),
      ],
    },
    {
      slug: 'cast-iron-skillet-10',
      name: 'Cast Iron Skillet 10"',
      short: 'Pre-seasoned',
      description:
        'A 10-inch pre-seasoned cast iron skillet with an assist handle and pour spouts. Naturally non-stick when properly seasoned, and oven-safe to 260°C. Built to outlast you.',
      priceCents: 4500,
      category: 'home',
      stock: 150,
      tags: ['kitchen'],
      images: [
        UN('1579805625996-db7b60587362'),
        UN('1637739699971-7d4d5194e75c'),
      ],
    },
    {
      slug: 'linen-bedsheet-queen',
      name: 'Linen Bedsheet — Queen',
      short: '100% European flax',
      description:
        'Stonewashed linen woven from 100% European flax, in a soft heathered oat. Naturally breathable, temperature-regulating, and softer with every wash. Queen fitted sheet with envelope closure.',
      priceCents: 18900,
      category: 'home',
      stock: 35,
      tags: ['bedding'],
      images: [
        UN('1606855637183-ea2a00b6f15f'),
        UN('1596433904747-e8b061219a71'),
      ],
    },
    {
      slug: 'ceramic-planter-set',
      name: 'Ceramic Planter Set',
      short: 'Set of 3',
      description:
        'A set of three hand-glazed ceramic planters in complementary earth tones. Includes drainage holes and matching saucers. Sizes 4", 6", and 8".',
      priceCents: 5900,
      category: 'home',
      stock: 110,
      tags: ['decor'],
      images: [
        UN('1611527664689-d430dd2a6774'),
        UN('1572186192734-e82b57dc4435'),
      ],
    },

    // ── Books ──────────────────────────────────────────────────────────────
    {
      slug: 'field-guide-to-coffee',
      name: 'A Field Guide to Coffee',
      short: 'Paperback',
      description:
        'A pocketable primer for the curious drinker. Covers bean origins, roast profiles, brewing fundamentals, and tasting notes. With profiles of 25 of the world\'s most celebrated growing regions.',
      priceCents: 1900,
      category: 'books',
      stock: 300,
      tags: ['coffee'],
      images: [
        UN('1535905557558-afc4877a26fc'),
        UN('1584563708449-7b663e0357b6'),
      ],
    },
    {
      slug: 'patterns-of-application-architecture',
      name: 'Patterns of Application Architecture',
      short: 'Hardcover',
      description:
        'A comprehensive reference on architectural patterns used in modern software systems. Layered, microkernel, event-driven, micro-services and more — with tradeoffs and decision frameworks.',
      priceCents: 4900,
      category: 'books',
      stock: 50,
      tags: ['tech'],
      images: [
        UN('1543002588-bfa74002ed7e'),
        UN('1588440691140-09155c1be58a'),
      ],
    },
    {
      slug: 'novel-the-cartographers',
      name: 'The Cartographers',
      short: 'Fiction',
      description:
        'A literary mystery about maps, memory, and the things people will do to keep a secret buried. A debut novel that bends genres between campus intrigue and historical suspense.',
      priceCents: 2400,
      category: 'books',
      stock: 80,
      tags: ['fiction'],
      images: [
        UN('1481627834876-b7833e8f5570'),
        UN('1546553836-33b20490e87e'),
      ],
    },
    {
      slug: 'cookbook-simple-suppers',
      name: 'Simple Suppers',
      short: 'Hardcover cookbook',
      description:
        '75 weeknight recipes designed for busy cooks. Most dishes come together in under 40 minutes with everyday ingredients. Beautifully photographed with make-ahead notes.',
      priceCents: 3400,
      category: 'books',
      stock: 60,
      tags: ['cooking'],
      images: [
        UN('1556909114-f6e7ad7d3136'),
        UN('1612031736184-77bc60f94c06'),
      ],
    },

    // ── Featured extras (apparel) ───────────────────────────────────────────
    {
      slug: 'enamel-pin-set',
      name: 'Enamel Pin Set',
      short: 'Set of 6',
      description:
        'A limited-run set of six hard-enamel pins with rubber clutches. Designs inspired by our favorite everyday objects. Backed on a printed collector card.',
      priceCents: 1900,
      category: 'apparel',
      stock: 500,
      tags: ['accessory'],
      images: [
        UN('1608147152875-b0eb0c53d491'),
        UN('1741916541139-244d7c3a44d8'),
      ],
    },
    {
      slug: 'wool-beanie-charcoal',
      name: 'Wool Beanie — Charcoal',
      short: 'Italian merino',
      description:
        'A ribbed merino beanie knit in Italy from soft, itch-free yarn. Tight enough to wear under a hood, loose enough to scrunch. Charcoal heather goes with everything.',
      priceCents: 3900,
      category: 'apparel',
      stock: 100,
      tags: ['accessory'],
      images: [
        UN('1612887726773-e64e20cf08fe'),
        UN('1606453914790-b9be7cdb321f'),
      ],
    },
    {
      slug: 'canvas-tote-natural',
      name: 'Canvas Tote — Natural',
      short: '12oz canvas',
      description:
        'A heavyweight 12oz natural canvas tote with double-stitched straps and a flat bottom that stands on its own. Reinforced stress points and a generous 14L capacity.',
      priceCents: 2400,
      category: 'apparel',
      stock: 250,
      tags: ['bag'],
      images: [
        UN('1574365569389-a10d488ca3fb'),
        UN('1630381260512-e3fe55c11973'),
      ],
    },
    {
      slug: 'leather-belt-brown',
      name: 'Leather Belt — Brown',
      short: 'Bridle leather',
      description:
        'Cut from a single piece of English bridle leather with a solid brass roller buckle. Edges are hand-burnished. Made to be the last belt you buy.',
      priceCents: 6900,
      category: 'apparel',
      stock: 75,
      tags: ['accessory'],
      images: [
        UN('1664286074176-5206ee5dc878'),
        UN('1705493655920-20c572928501'),
      ],
    },
  ];

  for (const p of products) {
    const categoryId = catIds.get(p.category);
    // Upsert the product first.
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        shortDescription: p.short,
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents ?? null,
        stock: p.stock,
        tags: p.tags,
        isFeatured: !!p.isFeatured,
        categoryId,
        sku: `SKU-${p.slug.toUpperCase().slice(0, 16)}`,
        currency: 'USD',
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        shortDescription: p.short,
        priceCents: p.priceCents,
        compareAtCents: p.compareAtCents ?? null,
        stock: p.stock,
        tags: p.tags,
        isFeatured: !!p.isFeatured,
        categoryId,
        sku: `SKU-${p.slug.toUpperCase().slice(0, 16)}`,
        currency: 'USD',
        taxCode: 'txcd_10000000',
      },
    });
    // Replace images: delete old rows, create new ones.
    // (Nested writes in upsert only run on the create branch, so we handle
    //  images separately to keep them in sync with the dataset on every run.)
    await prisma.productImage.deleteMany({ where: { product: { slug: p.slug } } });
    const product = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (product) {
      await prisma.productImage.createMany({
        data: p.images.map((url, idx) => ({
          productId: product.id,
          url,
          alt: idx === 0 ? p.name : `${p.name} (alternate ${idx})`,
          position: idx,
        })),
      });
    }
  }
  // eslint-disable-next-line no-console
  console.log(`✓ Products: ${products.length} (with ${products.reduce((s, p) => s + p.images.length, 0)} real Unsplash images)`);
}

// ---------------------------------------------------------------------------
// Coupons
// ---------------------------------------------------------------------------

async function seedCoupons() {
  const coupons: Prisma.CouponCreateInput[] = [
    {
      code: 'WELCOME10',
      description: '10% off your first order',
      type: 'PERCENTAGE',
      value: 10,
      minOrderCents: 5000,
      isActive: true,
    },
    {
      code: 'FLAT5',
      description: '$5 off any order',
      type: 'FIXED_AMOUNT',
      value: 500,
      minOrderCents: 3000,
      isActive: true,
    },
  ];
  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: c,
      create: c,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`✓ Coupons: ${coupons.length}`);
}

// ---------------------------------------------------------------------------
// Shipping zones and rates
// ---------------------------------------------------------------------------

async function seedShipping() {
  const zones = [
    { name: 'United States', countries: ['US'] },
    { name: 'European Union', countries: ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'IE', 'AT', 'PT'] },
  ];

  for (const z of zones) {
    const zone = await prisma.shippingZone.upsert({
      where: { id: `seed-zone-${z.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: { name: z.name, countries: z.countries, isActive: true },
      create: {
        id: `seed-zone-${z.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: z.name,
        countries: z.countries,
        isActive: true,
      },
    });

    const rates: Prisma.ShippingRateCreateWithoutZoneInput[] = [
      {
        name: 'Standard',
        description: 'Standard delivery',
        basePriceCents: 599,
        perKgCents: 100,
        deliveryDaysMin: 5,
        deliveryDaysMax: 8,
        isActive: true,
      },
      {
        name: 'Express',
        description: 'Express delivery',
        basePriceCents: 1499,
        perKgCents: 200,
        deliveryDaysMin: 2,
        deliveryDaysMax: 3,
        isActive: true,
      },
      {
        name: 'Free over $75',
        description: 'Standard shipping free on orders over $75',
        basePriceCents: 0,
        perKgCents: 0,
        minSubtotalCents: 7500,
        deliveryDaysMin: 5,
        deliveryDaysMax: 8,
        isActive: true,
      },
      {
        name: 'Overnight',
        description: 'Next-day delivery',
        basePriceCents: 2999,
        perKgCents: 500,
        deliveryDaysMin: 1,
        deliveryDaysMax: 1,
        isActive: true,
      },
    ];

    for (const r of rates) {
      // Use a deterministic slug-style key for upsert matching, but never as the
      // primary key — let Prisma generate a real CUID so the API validator
      // (z.string().cuid()) accepts it.
      const slugKey = `${zone.id}-${r.name.toLowerCase().replace(/\s+/g, '-')}`;
      const existing = await prisma.shippingRate.findFirst({
        where: { zoneId: zone.id, name: r.name },
      });
      if (existing) {
        await prisma.shippingRate.update({ where: { id: existing.id }, data: { ...r, zoneId: zone.id } });
      } else {
        await prisma.shippingRate.create({ data: { ...r, zoneId: zone.id } });
      }
      // suppress unused warning
      void slugKey;
    }
  }
  // eslint-disable-next-line no-console
  console.log(`✓ Shipping zones: ${zones.length} with 4 rates each`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding…');
  await seedUsers();
  const catIds = await seedCategories();
  await seedProducts(catIds);
  await seedCoupons();
  await seedShipping();
  // eslint-disable-next-line no-console
  console.log('✅ Seed complete');
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());