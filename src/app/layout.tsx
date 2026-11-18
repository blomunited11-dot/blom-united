import type {Metadata} from 'next';import '@/styles/globals.css';
export const metadata:Metadata={title:'BLOM UNITED | مجموعة بلوم المتحدة',description:'الموقع الرسمي لمجموعة بلوم المتحدة'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar"><body>{children}</body></html>}
