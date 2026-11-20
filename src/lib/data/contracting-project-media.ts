import type {Entry} from '@/lib/data/site';

export type ContractingProjectMediaDraft={
 mediaId:string;
 publicUrl:string;
};

export type ContractingProjectMediaDrafts=Record<string,ContractingProjectMediaDraft>;

export function withContractingProjectMediaDrafts(
 projects:Entry[],
 drafts:ContractingProjectMediaDrafts
):Entry[]{
 return projects.map(project=>{
  const draft=drafts[project.id];
  return draft?{...project,cover:draft.publicUrl}:project;
 });
}
