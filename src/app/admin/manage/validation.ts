const entityTypes = {
  sectors: 'sector',
  services: 'service',
  projects: 'project',
  news: 'news',
  pages: 'page',
  catalog_categories: 'category',
  catalog_products: 'product',
} as const;

const statuses = ['draft', 'review', 'published', 'archived'] as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const protectedSlugs = new Set(['home', 'homepage', 'index', 'landing', 'main']);

type EntityTable = keyof typeof entityTypes;

export type ManagedEntryUpdate = {
  p_table: EntityTable;
  p_id: string;
  p_slug: string;
  p_status: (typeof statuses)[number];
  p_sector_id: string | null;
  p_sort_order: number | null;
  p_category_id: string | null;
  p_title_ar: string;
  p_summary_ar: string;
  p_title_en: string;
  p_summary_en: string;
};

function requiredString(form: FormData, key: string, maxLength: number): string {
  const value = form.get(key);
  if (typeof value !== 'string') throw new Error(`Missing ${key}`);
  if (value.length > maxLength) throw new Error(`Field too long: ${key}`);
  return value.trim();
}

function optionalString(form: FormData, key: string, maxLength: number): string {
  const value = form.get(key);
  if (value === null) return '';
  if (typeof value !== 'string') throw new Error(`Invalid ${key}`);
  if (value.length > maxLength) throw new Error(`Field too long: ${key}`);
  return value.trim();
}

export function parseManagedEntryUpdate(form: FormData): ManagedEntryUpdate {
  const tableValue = requiredString(form, 'table', 40);
  if (!Object.prototype.hasOwnProperty.call(entityTypes, tableValue)) {
    throw new Error('Invalid entity');
  }
  const table = tableValue as EntityTable;
  const id = requiredString(form, 'id', 40);
  if (!uuid.test(id)) throw new Error('Invalid id');

  const slug = requiredString(form, 'slug', 80);
  if (!/^[a-z0-9-]{2,80}$/.test(slug)) throw new Error('Invalid slug');
  if (table === 'pages' && protectedSlugs.has(slug)) {
    throw new Error('The group home page is protected');
  }

  const status = requiredString(form, 'status', 20);
  if (!(statuses as readonly string[]).includes(status)) throw new Error('Invalid status');

  const sectorId = optionalString(form, 'sector_id', 40);
  const requiresSector = ['services', 'projects', 'catalog_categories', 'catalog_products'].includes(table);
  if (requiresSector && !uuid.test(sectorId)) throw new Error('Sector required');
  if (sectorId && !uuid.test(sectorId)) throw new Error('Invalid sector');

  const sortOrderField = form.get('sort_order');
  let sortOrder: number | null = null;
  if (table === 'sectors' || table === 'services') {
    if (typeof sortOrderField !== 'string') throw new Error('Missing sort_order');
    sortOrder = Number(sortOrderField);
    if (!Number.isSafeInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
      throw new Error('Invalid order');
    }
  }

  const categoryId = table === 'catalog_products'
    ? optionalString(form, 'category_id', 40)
    : '';
  if (categoryId && !uuid.test(categoryId)) throw new Error('Invalid category');

  const titleAr = requiredString(form, 'title_ar', 250);
  const titleEn = requiredString(form, 'title_en', 250);
  if (!titleAr || !titleEn) throw new Error('Both titles are required');

  return {
    p_table: table,
    p_id: id,
    p_slug: slug,
    p_status: status as ManagedEntryUpdate['p_status'],
    p_sector_id: sectorId || null,
    p_sort_order: sortOrder,
    p_category_id: categoryId || null,
    p_title_ar: titleAr,
    p_summary_ar: requiredString(form, 'summary_ar', 3000),
    p_title_en: titleEn,
    p_summary_en: requiredString(form, 'summary_en', 3000),
  };
}
