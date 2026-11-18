# BLOM UNITED — implementation status
- Next.js 15, React 19, TypeScript, Supabase SSR/Auth and bilingual /ar /en routes are scaffolded.
- Public sector, project and news lists read published rows at request time; no rebuild is needed for DB content changes.
- Admin routes check authenticated active membership; content creation requires owner role and RLS. Editor roles and review/publish workflow are not yet enabled.
- SQL migrations 001-003 are committed **but not applied**. Review all RLS, grants, storage and database triggers in a test project before production.
- Official logo, approved fonts, city landmark and photographs are intentionally not substituted.
- Cloudflare Workers adapter, deployment credentials and runtime compatibility are not yet configured or tested.
- Dependencies have not been installed and build/typecheck has not been run in this environment. Do not deploy to production yet.
