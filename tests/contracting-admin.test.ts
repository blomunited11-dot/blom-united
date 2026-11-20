import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  serverDb: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ serverDb: mocks.serverDb }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { contractingDefaultContent } from '@/config/contracting.content';
import { publishContractingDraft, saveContractingDraft } from '@/app/admin/contracting/actions';

const userId = '11111111-1111-4111-8111-111111111111';
const mediaId = '22222222-2222-4222-8222-222222222222';
const projectId = '33333333-3333-4333-8333-333333333333';
const secondProjectId = '44444444-4444-4444-8444-444444444444';

function validDraftForm(locale: 'ar'|'en'='ar') {
  const form = new FormData();
  const content = contractingDefaultContent[locale] as Record<string, unknown>;
  form.set('locale', locale);
  form.set('hero_media_id', mediaId);
  for (const [key, value] of Object.entries(content)) {
    if (typeof value === 'string') {
      form.set(`text:${key}`, value);
    } else if (Array.isArray(value) && value.every(item => typeof item === 'string')) {
      form.set(`list:${key}`, value.join('\n'));
    } else if (Array.isArray(value)) {
      form.set(`json:${key}`, JSON.stringify(value));
    } else if (key === 'pages') {
      for (const [slug, page] of Object.entries(value as Record<string, {title:string;description:string}>)) {
        form.set(`page:${slug}:title`, page.title);
        form.set(`page:${slug}:description`, page.description);
      }
    }
  }
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

describe('contracting draft workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves validated content and staged project media without revalidating public pages', async () => {
    const db = createDb();
    mocks.serverDb.mockResolvedValue(db);
    const form=validDraftForm();
    const projects=contractingDefaultContent.ar.projects.map((project,index)=>({
      ...project,
      mediaId:index===0?mediaId:null,
    }));
    form.set('json:projects',JSON.stringify(projects));
    form.set(`project_media:${projectId}`,mediaId);

    await saveContractingDraft(form);

    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith('save_contracting_editor_draft', expect.objectContaining({
      p_locale: 'ar',
      p_media_id: mediaId,
      p_project_media: [
        {project_id:projectId,action:'set',media_id:mediaId},
      ],
      p_content: expect.objectContaining({
        title: contractingDefaultContent.ar.title,
        projects: expect.arrayContaining([
          expect.objectContaining({
            key: contractingDefaultContent.ar.projects[0].key,
            mediaId,
          }),
        ]),
        pages: expect.objectContaining({
          'general-contracting': expect.objectContaining({
            title: contractingDefaultContent.ar.pages['general-contracting'].title,
          }),
        }),
      }),
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/admin/edit/contracting');
    expect(mocks.revalidatePath).not.toHaveBeenCalledWith('/ar/sectors/contracting');
  });

  it('refuses incomplete content before calling the database', async () => {
    const db = createDb();
    mocks.serverDb.mockResolvedValue(db);
    const form = validDraftForm();
    form.delete('text:title');

    await expect(saveContractingDraft(form)).rejects.toThrow('Missing field: text:title');

    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('publishes only a saved locale draft and refreshes all contracting pages', async () => {
    const db = createDb();
    mocks.serverDb.mockResolvedValue(db);
    const form = new FormData();
    form.set('locale', 'en');

    await publishContractingDraft(form);

    expect(db.rpc).toHaveBeenCalledWith('publish_contracting_editor_draft', { p_locale: 'en' });
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/ar/sectors/contracting');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/en/sectors/contracting/quality-safety');
  });

  it('blocks non-owners from saving or publishing drafts', async () => {
    const db = createDb('editor');
    mocks.serverDb.mockResolvedValue(db);

    await expect(saveContractingDraft(validDraftForm())).rejects.toThrow('Owner permission required');
    const form = new FormData();
    form.set('locale', 'ar');
    await expect(publishContractingDraft(form)).rejects.toThrow('Owner permission required');

    expect(db.rpc).not.toHaveBeenCalled();
  });

  it('does not revalidate after a database operation fails', async () => {
    const db = createDb('owner', { message: 'Database update failed' });
    mocks.serverDb.mockResolvedValue(db);

    await expect(saveContractingDraft(validDraftForm())).rejects.toThrow('Database update failed');

    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('rejects malformed project media selections before contacting the database', async () => {
    const db = createDb();
    mocks.serverDb.mockResolvedValue(db);
    const form=validDraftForm();
    form.set('project_media:not-a-uuid',mediaId);

    await expect(saveContractingDraft(form)).rejects.toThrow('Invalid project media selection');

    expect(db.rpc).not.toHaveBeenCalled();
  });
});
