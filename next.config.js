const nextra = require('nextra')
const remarkGfm = require('remark-gfm')
const remarkFrontmatter = require('remark-frontmatter')

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  defaultShowCopyCode: true,
  flexsearch: {
    codeblocks: true
  },
  mdxOptions: {
    remarkPlugins: [
      remarkGfm,
      remarkFrontmatter,
      require('@mdx-js/mdx').remarkPlugins
    ]
  }
})

module.exports = withNextra({})
