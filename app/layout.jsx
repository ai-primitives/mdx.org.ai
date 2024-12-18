/* eslint-env node */
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Banner, Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import { Analytics } from '@vercel/analytics/react'

export const { viewport } = Head

export const metadata = {
  metadataBase: new URL('https://mdx.org.ai'),
  title: {
    template: '%s - MDX.org.AI'
  },
  description: 'MDX.org.AI: the MDX site builder',
  applicationName: 'MDX.org.AI',
  generator: 'Next.js',
  appleWebApp: {
    title: 'MDX.org.AI'
  },
  other: {
    'msapplication-TileImage': '/ms-icon-144x144.png',
    'msapplication-TileColor': '#fff'
  },
  twitter: {
    site: 'https://mdx.org.ai'
  }
}

export default async function RootLayout({ children }) {
  const navbar = (
    <Navbar
      logo={
        <div>
          <b>mdx</b><span style={{ opacity: '60%' }}>.org.ai</span>
        </div>
      }
      // Next.js discord server
      chatLink="https://discord.gg/BHZCzx83"
    />
  )
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head faviconGlyph="✦" />
      <body>
        <Layout
          // banner={<Banner storageKey="Nextra 2">Nextra 2 Alpha</Banner>}
          navbar={navbar}
          footer={<Footer />}
          editLink="Edit this page on GitHub"
          docsRepositoryBase="https://github.com/ai-primitives/mdx.org.ai/blob/main"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
          pageMap={await getPageMap()}
        >
          {children}
          <Analytics />
        </Layout>
      </body>
    </html>
  )
}
