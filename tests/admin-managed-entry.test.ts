import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  serverDb: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ serverDb: mocks.serverDb }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { updateManagedEntry } from '@/app/admin/manage/actions';
import { parseManagedEntryUpdate } from '@/app/admin/manage/validation';

const id = '11111111-1111-4111-8111-111111111111';
const sectorId = '22222222-2222-4222-8222-222222222222';
const categoryId = '33333333-3333-4333-8333-333333333333';

function makeForm(entries: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
}

function baseEntry(table = 'projects') {
  return {
    table,
    id,
    slug: 'updated-item',
    status: 'draft',
    title_ar: 'عنوان عربي',
    summary_ar: '',
    title_en: 'English title',
    summary_en: '',
  };
}

function createDb(role: string | null = 'owner', rpcError: { message: string } | null = null) {
  const membershipQuery = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: role ? { role } : null,
      error: null,
    }),
  };
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(membershipQuery),
    rpc: vi.fn().mockResolvedValue({ error: rpcError }),
  };
}

describe('parseManagedEntryUpdate', () => {
  it('accepts a sector edit without a sector_id field', () => {
    const form = makeForm({ ...baseEntry('sectors'), sort_order: '4' });

    expect(parseManagedEntryUpdate(form)).toMatchObject({
      p_table: 'sectors',
      p_sector_id: null,
      p_sort_order: 4,
    });
  });

  it('requires a valid sector for project edits', () => {
    expect(() => parseManagedEntryUpdate(makeForm(baseEntry()))).toThrow('Sector required');
  });

  it('rejects attempts to edit a protected homepage slug', () => {
    expect(() => parseManagedEntryUpdate(makeForm({
      ...baseEntry('pages'),
      slug: 'home',
    }))).toThrow('The group home page is protected');
  });

  it('parses a product category as an optional UUID', () => {
    const form = makeForm({
      ...baseEntry('catalog_products'),
      sector_id: sectorId,
      category_id: categoryId,
    });

    expect(parseManagedEntryUpdate(form).p_category_id).toBe(categoryId);
  });
});

describe('updateManagedEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists an owner edit through one atomic RPC', async () => {
    const db = createDb();
    mocks.serverDb.mockResolvedValue(db);
    const form = makeForm({ ...baseEntry(), sector_id: sectorId });

    await updateManagedEntry(form);

    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith('update_managed_entry', expect.objectContaining({
      p_table: 'projects',
      p_id: id,
      p_sector_id: sectorId,
      p_title_ar: 'عنوان عربي',
      p_title_en: 'English title',
    }));
    expect(db.from).toHaveBeenCalledTimes(1);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/ar', 'layout');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/en', 'layout');
  });

  it('blocks non-owners before calling the update RPC', async () => {
    const db = createDb('editor');
    mocks.serverDb.mockResolvedValue(db);

    await expect(updateManagedEntry(makeForm({
      ...baseEntry(),
      sector_id: sectorId,
    }))).rejects.toThrow('Owner permission required');

    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('does not revalidate or report success when the database RPC fails', async () => {
    const db = createDb('owner', { message: 'Database update failed' });
    mocks.serverDb.mockResolvedValue(db);

    await expect(updateManagedEntry(makeForm({
      ...baseEntry(),
      sector_id: sectorId,
    }))).rejects.toThrow('Database update failed');

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
