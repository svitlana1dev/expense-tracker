const KNOWN_MERCHANTS = {
  starbucks:   'Starbucks',
  chipotle:    'Chipotle',
  mcdonalds:   "McDonald's",
  netflix:     'Netflix',
  spotify:     'Spotify',
  amazon:      'Amazon',
  uber:        'Uber',
  lyft:        'Lyft',
  walmart:     'Walmart',
  target:      'Target',
  hulu:        'Hulu',
  disney:      'Disney+',
  shell:       'Shell',
  costco:      'Costco',
  ikea:        'IKEA',
  youtube:     'YouTube',
  apple:       'Apple',
  google:      'Google',
};

const CATEGORIES = [
  {
    name: 'Food',
    keywords: [
      'coffee', 'lunch', 'dinner', 'breakfast', 'pizza', 'restaurant',
      'grocery', 'groceries', 'meal', 'burger', 'sushi', 'taco', 'snack',
      'cafe', 'food', 'brunch', 'smoothie', 'sandwich', 'salad', 'bakery',
      'donut', 'bagel', 'starbucks', 'chipotle', 'mcdonalds',
    ],
  },
  {
    name: 'Transport',
    keywords: [
      'gas', 'uber', 'lyft', 'taxi', 'bus', 'train', 'metro', 'fuel',
      'parking', 'toll', 'transit', 'commute', 'flight', 'airline',
      'shell', 'exxon', 'chevron', 'rideshare',
    ],
  },
  {
    name: 'Shopping',
    keywords: [
      'amazon', 'clothes', 'clothing', 'shirt', 'shoes', 'mall', 'target',
      'walmart', 'store', 'shop', 'ebay', 'ikea', 'costco', 'order', 'purchase',
    ],
  },
  {
    name: 'Entertainment',
    keywords: [
      'netflix', 'movie', 'cinema', 'spotify', 'game', 'concert', 'ticket',
      'streaming', 'hulu', 'disney', 'youtube', 'theatre', 'theater', 'show',
      'music', 'subscription', 'hbo',
    ],
  },
  {
    name: 'Bills',
    keywords: [
      'rent', 'mortgage', 'landlord', 'electric', 'electricity', 'water',
      'internet', 'phone', 'utility', 'utilities', 'cable', 'power', 'bill',
      'insurance', 'verizon', 'comcast', 'wifi',
    ],
  },
];

function extractAmount(text) {
  const dollarSign = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  if (dollarSign) return parseFloat(dollarSign[1]);

  const wordForm = text.match(/(\d+(?:\.\d{1,2})?)\s*(?:dollars?|bucks?)/i);
  if (wordForm) return parseFloat(wordForm[1]);

  return null;
}

function extractDate(text) {
  const today = new Date();
  const lower = text.toLowerCase();

  if (lower.includes('yesterday')) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  const daysAgo = lower.match(/(\d+)\s*days?\s*ago/);
  if (daysAgo) {
    const d = new Date(today);
    d.setDate(d.getDate() - parseInt(daysAgo[1], 10));
    return d.toISOString().split('T')[0];
  }

  return today.toISOString().split('T')[0];
}

function extractCategoryAndKeyword(text) {
  const lower = text.toLowerCase();
  for (const { name, keywords } of CATEGORIES) {
    const hit = keywords.find((kw) => lower.includes(kw));
    if (hit) return { category: name, keyword: hit };
  }
  return { category: 'Other', keyword: null };
}

function extractMerchant(text, keyword) {
  const lower = text.toLowerCase();

  for (const [key, name] of Object.entries(KNOWN_MERCHANTS)) {
    if (lower.includes(key)) return name;
  }

  const atFrom = text.match(/\b(?:at|from|to|@)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)/);
  if (atFrom) return atFrom[1];

  if (keyword) return keyword.charAt(0).toUpperCase() + keyword.slice(1);

  return 'Unknown';
}

/**
 * Parse a natural language expense string into structured data.
 * Returns null if no amount can be found.
 *
 * @param {string} text
 * @returns {{ amount: number, category: string, merchant: string, date: string } | null}
 */
export function parseExpense(text) {
  const input = text.trim();
  if (!input) return null;

  const amount = extractAmount(input);
  if (amount === null) return null;

  const { category, keyword } = extractCategoryAndKeyword(input);
  const merchant = extractMerchant(input, keyword);
  const date = extractDate(input);

  return { amount, category, merchant, date };
}
