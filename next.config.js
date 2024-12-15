import nextra from 'nextra'

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  defaultShowCopyCode: true,
  flexsearch: {
    codeblocks: true
  },
  mdxOptions: {
    remarkPlugins: [
      // Include existing remark plugins
    ]
  }
})

export default withNextra({
  experimental: {
    appDir: true
  }
})
