import {createElement,type ReactNode} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it,vi} from 'vitest';

vi.mock('next/link',()=>({
 default:({href,children}:{href:string;children:ReactNode})=>createElement('a',{href},children)
}));

import ContractingExperience from '@/components/contracting/ContractingExperience';

describe('contracting portfolio cards',()=>{
 it('renders published project covers and links in the card grid',()=>{
  const markup=renderToStaticMarkup(createElement(ContractingExperience,{
   locale:'ar',
   services:[],
   projects:[{
    id:'project-1',
    slug:'project-one',
    title:'مشروع واحد',
    summary:'وصف المشروع',
    cover:'https://example.com/project.webp'
   }]
  }));

  expect(markup).toContain('src="https://example.com/project.webp"');
  expect(markup).toContain('href="/ar/projects/project-one"');
  expect(markup).toContain('alt="مشروع واحد"');
 });
});
