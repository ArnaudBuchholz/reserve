import { log, send, serve } from 'reserve'
import { readFile } from 'fs/promises'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'

log(serve({
  port: 8099,
  mappings: [{
    match: '^/(.*\\.md)',
    custom: async (request, response, path) => {
      const markdown = (await readFile(path)).toString()
      const converted = remark()
        .use(remarkParse)
        .use(remarkAlert)
        .use(remarkGfm)
        .use(remarkRehype, { allowDangerousHtml: true })
        .use(rehypeStringify)
        .processSync(markdown).toString()
        .replace(/&\#x3C;br>/g, '<br>')
        .replace(/<h(\d)>(?:<code>)?([^<]*)(?:<\/code>)?<\/h\d>/g, (_, level, title) => {
          const anchor = title
            .toLowerCase()
            .replace(/ /g, '-')
            .replace(/[^a-z-]/g, '')
          return `<a name="${anchor}"></a><h${level}>${title}</h${level}>`
        })
      return send(response, `<html>
  <head>
    <title>${path}</title>
    <link rel="stylesheet" href="github.css">
    <style>
body { padding: 1rem; }
.markdown-body div.markdown-alert { padding-left: .5rem; }
    </style>
  </head>
  <body class="markdown-body">${converted}</body>
</html>`, {
        headers: {
          'content-type': 'text/html; charset=utf-8'
        }
      })
    }
  }, {
    match: '^/$',
    custom: () => '/README.md'
  }, {
    cwd: '..',
    match: '/github.css',
    file: './node_modules/github-markdown-css/github-markdown.css'
  }, {
    match: '^/(.*)',
    file: '$1'
  }, {
    status: 404
  }]
}))
