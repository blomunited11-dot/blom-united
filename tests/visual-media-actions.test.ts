import {beforeEach,describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({serverDb:vi.fn(),revalidatePath:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({serverDb:mocks.serverDb}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidatePath}));

import {assignMediaSlot} from '@/app/admin/visual/actions';

const projectId='11111111-1111-4111-8111-111111111111';
const mediaId='22222222-2222-4222-8222-222222222222';
const sectorId='33333333-3333-4333-8333-333333333333';

describe('immediate media assignments',()=>{
 beforeEach(()=>vi.clearAllMocks());

 it('keeps contracting project covers in the draft-and-publish workflow',async()=>{
  const results:Record<string,unknown>={
   admin_memberships:{role:'owner'},
   projects:{id:projectId,sector_id:sectorId},
   media_assets:{id:mediaId,sector_id:sectorId},
   sectors:{slug:'contracting'}
  };
  const db={
   auth:{getUser:vi.fn().mockResolvedValue({data:{user:{id:'owner-1'}}})},
   from:vi.fn((table:string)=>{
    const result=results[table];
    return {
     select:vi.fn().mockReturnThis(),
     eq:vi.fn().mockReturnThis(),
     maybeSingle:vi.fn().mockResolvedValue({data:result,error:null}),
     update:vi.fn().mockReturnThis(),
     insert:vi.fn().mockResolvedValue({error:null})
    };
   })
  };
  mocks.serverDb.mockResolvedValue(db);

  await expect(assignMediaSlot({
   entityType:'project',
   entityId:projectId,
   mediaId,
   slot:0
  })).rejects.toThrow('صور مشاريع المقاولات تُحفظ كمسودات');

  expect(db.from).not.toHaveBeenCalledWith('entity_media');
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
 });
});
