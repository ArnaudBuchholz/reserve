import { log, send, serve } from 'reserve'
import { readFile } from 'fs/promises'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'

log(serve({
  port: 8080,
  mappings: [{
    match: '^/(.*\\.md)',
    custom: async (request, response, path) => {
      const markdown = (await readFile(path)).toString()
      const converted = remark()
        .use(remarkParse)
        .use(remarkAlert)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeStringify)
        .processSync(markdown).toString()
      return send(response, `<html>
  <head>
    <title>${path}</title>
    <link rel="stylesheet" href="github.css">
    <style>
body { padding: 1rem; }
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
