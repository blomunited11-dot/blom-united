import {describe,expect,it} from 'vitest';
import {contractingDefaultContent} from '@/config/contracting.content';
import {mergeContractingCopy,readContractingCopy,validateContractingDraftCopy} from '@/lib/data/contracting';

describe('contracting copy',()=>{
 it('reads only the known published content shape',()=>{
  const copy=readContractingCopy({contracting:{
   title:'Published title',
   pages:{'general-contracting':{title:'Published service',description:'Updated scope'},unknown:{title:'Ignored'}},
   unrelated:'Ignored'
  }});

  expect(copy.title).toBe('Published title');
  expect(copy.pages?.['general-contracting']).toEqual({title:'Published service',description:'Updated scope'});
  expect(copy.pages).not.toHaveProperty('unknown');
  expect(copy).not.toHaveProperty('unrelated');
 });

 it('merges page-specific drafts without discarding other localized defaults',()=>{
  const copy=mergeContractingCopy('en',{
   pages:{projects:{title:'Portfolio',description:'Updated project overview'}},
   services:['Service 1','Service 2','Service 3','Service 4','Service 5','Service 6']
  });

  expect(copy.pages.projects.title).toBe('Portfolio');
  expect(copy.pages.contact.title).toBe(contractingDefaultContent.en.pages.contact.title);
  expect(copy.services[0]).toBe('Service 1');
 });

 it('rejects malformed or incomplete draft content',()=>{
  const content=structuredClone(contractingDefaultContent.ar);
  expect(()=>validateContractingDraftCopy({...content,services:['only one']})).toThrow('Exactly six service links are required');
  expect(()=>validateContractingDraftCopy({...content,pages:{...content.pages,contact:{title:'',description:'Missing title'}}})).toThrow('Invalid or empty text');
  expect(()=>validateContractingDraftCopy({...content,unknown:'not editable'})).toThrow('Invalid fields: contracting');
 });
});
