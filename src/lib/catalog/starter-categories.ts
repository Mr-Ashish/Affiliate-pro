export type StarterCategory = {
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
};

/** Global SEO taxonomy. Seed inserts missing slugs and leaves edited rows alone. */
export const STARTER_CATEGORIES: StarterCategory[] = [
  {
    slug: "apparel",
    name: "Apparel & Accessories",
    description: "Clothing, shoes, and accessories coupons.",
    sortOrder: 10,
  },
  {
    slug: "automotive",
    name: "Automotive",
    description: "Car parts, tires, and auto care deals.",
    sortOrder: 20,
  },
  {
    slug: "baby-kids",
    name: "Baby & Kids",
    description: "Baby gear, toys, and kids clothing deals.",
    sortOrder: 30,
  },
  {
    slug: "beauty",
    name: "Beauty",
    description: "Makeup, skincare, and fragrance coupons.",
    sortOrder: 40,
  },
  {
    slug: "electronics",
    name: "Electronics",
    description: "Phones, computers, and gadget deals.",
    sortOrder: 50,
  },
  {
    slug: "food",
    name: "Food & Grocery",
    description: "Grocery, delivery, and restaurant deals.",
    sortOrder: 60,
  },
  {
    slug: "health",
    name: "Health",
    description: "Pharmacy, wellness, and fitness coupons.",
    sortOrder: 70,
  },
  {
    slug: "home-garden",
    name: "Home & Garden",
    description: "Furniture, housewares, and garden deals.",
    sortOrder: 80,
  },
  {
    slug: "pets",
    name: "Pets",
    description: "Pet food, supplies, and care coupons.",
    sortOrder: 90,
  },
  {
    slug: "software",
    name: "Software & Apps",
    description: "Software, apps, and digital subscription deals.",
    sortOrder: 100,
  },
  {
    slug: "sports",
    name: "Sports & Outdoors",
    description: "Sporting goods and outdoor gear deals.",
    sortOrder: 110,
  },
  {
    slug: "travel",
    name: "Travel",
    description: "Hotels, flights, and travel booking deals.",
    sortOrder: 120,
  },
];
