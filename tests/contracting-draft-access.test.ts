import {describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({serverDb:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({serverDb:mocks.serverDb}));

import {getContractingDraft} from '@/lib/data/contracting';

function query(result:unknown){
 return {
  select:vi.fn().mockReturnThis(),
  eq:vi.fn().mockReturnThis(),
  maybeSingle:vi.fn().mockResolvedValue(result)
 };
}

describe('contracting draft access',()=>{
 it('does not query private drafts for a signed-out visitor',async()=>{
  const db={
   auth:{getUser:vi.fn().mockResolvedValue({data:{user:null},error:null})},
   from:vi.fn()
  };
  mocks.serverDb.mockResolvedValue(db);

  const result=await getContractingDraft('ar');

  expect(result).toMatchObject({authorized:false,found:false});
  expect(db.from).not.toHaveBeenCalled();
 });

 it('does not query private drafts for a non-owner admin',async()=>{
  const db={
   auth:{getUser:vi.fn().mockResolvedValue({data:{user:{id:'user-1'}},error:null})},
   from:vi.fn().mockReturnValue(query({data:{role:'editor'},error:null}))
  };
  mocks.serverDb.mockResolvedValue(db);

  const result=await getContractingDraft('en');

  expect(result).toMatchObject({authorized:false,found:false});
  expect(db.from).toHaveBeenCalledTimes(1);
  expect(db.from).toHaveBeenCalledWith('admin_memberships');
 });

 it('lets an owner read the locale draft row',async()=>{
  const membership=query({data:{role:'owner'},error:null});
  const draft=query({data:null,error:null});
   const projectMedia={
    select:vi.fn().mockReturnThis(),
    limit:vi.fn().mockResolvedValue({data:[{
     project_id:'project-1',
     media_id:'media-1',
     media_assets:{public_url:'https://example.com/draft.webp'}
    }],error:null})
   };
  const db={
   auth:{getUser:vi.fn().mockResolvedValue({data:{user:{id:'owner-1'}},error:null})},
    from:vi.fn((table:string)=>table==='admin_memberships'?membership:table==='contracting_content_drafts'?draft:projectMedia)
  };
  mocks.serverDb.mockResolvedValue(db);

  const result=await getContractingDraft('ar');

   expect(result).toMatchObject({
    authorized:true,
    found:false,
    projectMediaDrafts:{
     'project-1':{mediaId:'media-1',publicUrl:'https://example.com/draft.webp'}
    }
   });
  expect(db.from).toHaveBeenCalledWith('contracting_content_drafts');
   expect(db.from).toHaveBeenCalledWith('contracting_project_media_drafts');
 });
});
