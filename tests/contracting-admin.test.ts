import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  serverDb: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ serverDb: mocks.serverDb }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { saveContractingCopy, saveContractingHeroImage } from '@/app/admin/contracting/actions';

const userId = '11111111-1111-4111-8111-111111111111';
const mediaId = '22222222-2222-4222-8222-222222222222';

function makeForm(entries: Record<string, string>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(entries)) form.set(key, value);
  return form;
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
        data: { user: { id: userId } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(membershipQuery),
    rpc: vi.fn().mockResolvedValue({ error: rpcError }),
  };
}

describe('contracting admin actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves the hero image through one atomic RPC and refreshes public views', async () => {
    const db = createDb();
    mocks.serverDb.mockResolvedValue(db);

    await saveContractingHeroImage(makeForm({ media_id: mediaId }));

    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith('save_contracting_hero_media', { p_media_id: mediaId });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/ar/sectors/contracting');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/en/sectors');
  });

  it('merges one locale copy through the database RPC', async () => {
    const db = createDb();
    mocks.serverDb.mockResolvedValue(db);
    const form = makeForm({
      locale: 'ar',
      section: 'hero',
      label: '  تعريف  ',
      title: 'عنوان',
      lead: 'مقدمة',
      intro: 'تفصيل',
      seeProjects: 'المشاريع',
      contact: 'اتصل بنا',
    });

    await saveContractingCopy(form);

    expect(db.rpc).toHaveBeenCalledWith('save_contracting_copy', {
      p_locale: 'ar',
      p_values: {
        label: 'تعريف',
        title: 'عنوان',
        lead: 'مقدمة',
        intro: 'تفصيل',
        seeProjects: 'المشاريع',
        contact: 'اتصل بنا',
      },
    });
  });

  it('does not revalidate after the atomic image save fails', async () => {
    const db = createDb('owner', { message: 'Database update failed' });
    mocks.serverDb.mockResolvedValue(db);

    await expect(saveContractingHeroImage(makeForm({ media_id: mediaId })))
      .rejects.toThrow('Database update failed');

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('blocks non-owners before calling the database RPC', async () => {
    const db = createDb('editor');
    mocks.serverDb.mockResolvedValue(db);

    await expect(saveContractingHeroImage(makeForm({ media_id: mediaId })))
      .rejects.toThrow('Owner permission required');

    expect(db.rpc).not.toHaveBeenCalled();
  });
});
