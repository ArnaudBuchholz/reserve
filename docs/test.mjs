import { readFileSync } from 'fs'
import { remark } from 'remark'
import remarkParse from 'remark-parse'
import { remarkAlert } from 'remark-github-blockquote-alert'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const markdown = readFileSync('README.md')
const htmlStr = remark()
  .use(remarkParse)
  .use(remarkAlert)
  .use(remarkRehype)
  .use(rehypeStringify)
  .processSync(markdown).toString()
console.log(htmlStr)
