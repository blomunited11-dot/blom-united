import {describe,expect,it,vi} from 'vitest';

const mocks=vi.hoisted(()=>({serverDb:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({serverDb:mocks.serverDb}));

import {withContractingProjectMediaDrafts} from '@/lib/data/contracting-project-media';
import {published} from '@/lib/data/site';

describe('contracting project media drafts',()=>{
 it('overrides only the matching project cover for draft previews',()=>{
  const projects=[
   {id:'project-1',slug:'tower',title:'Tower',summary:null,cover:'https://example.com/published.webp'},
   {id:'project-2',slug:'clinic',title:'Clinic',summary:null,cover:null}
  ];

  expect(withContractingProjectMediaDrafts(projects,{
   'project-1':{mediaId:'media-1',publicUrl:'https://example.com/draft.webp'}
  })).toEqual([
   {...projects[0],cover:'https://example.com/draft.webp'},
   projects[1]
  ]);
 });

 it('resolves covers only from media links for the requested entity type',async()=>{
  const projectId='project-1';
  const mediaQuery={
   select:vi.fn().mockReturnThis(),
   eq:vi.fn().mockReturnThis(),
   in:vi.fn().mockReturnThis(),
   order:vi.fn().mockResolvedValue({data:[{entity_id:projectId,media_assets:{public_url:'https://example.com/cover.webp'}}],error:null})
  };
  const projectQuery={
   select:vi.fn().mockReturnThis(),
   eq:vi.fn().mockReturnThis(),
   limit:vi.fn().mockResolvedValue({data:[{id:projectId,slug:'tower'}],error:null})
  };
  const translationQuery={
   select:vi.fn().mockReturnThis(),
   eq:vi.fn().mockReturnThis(),
   in:vi.fn().mockResolvedValue({data:[{entity_id:projectId,title:'Tower',summary:null}],error:null})
  };
  const db={from:vi.fn((table:string)=>table==='projects'?projectQuery:table==='entity_media'?mediaQuery:translationQuery)};
  mocks.serverDb.mockResolvedValue(db);

  await expect(published('projects','ar','sector-1')).resolves.toMatchObject([
   {id:projectId,cover:'https://example.com/cover.webp'}
  ]);
  expect(mediaQuery.eq).toHaveBeenCalledWith('entity_type','project');
 });
});
