export default {
  logo: <span>MDX.org.ai</span>,
  project: {
    link: 'https://github.com/ai-primitives/mdx.org.ai'
  },
  docsRepositoryBase: 'https://github.com/ai-primitives/mdx.org.ai',
  useNextSeoProps() {
    return {
      titleTemplate: '%s – MDX.org.ai'
    }
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta property="og:title" content="MDX.org.ai" />
      <meta property="og:description" content="AI-powered MDX documentation and tooling" />
    </>
  )
}
