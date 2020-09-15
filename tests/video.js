'use strict'

const { access, createWriteStream, mkdir } = require('fs')
const { promisify } = require('util')
const { join } = require('path')
const get = require('https').get
const { pipeline } = require('stream')

const videoSource = 'https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_1920_18MG.mp4'

const accessAsync = promisify(access)
const mkdirAsync = require('util').promisify(mkdir)
const getAsync = url => new Promise(resolve => {
  get(url, res => resolve(res))
})
const pipelineAsync = promisify(pipeline)

async function main () {
  await mkdirAsync(join(__dirname, 'cache'), { recursive: true })
  const videoPath = join(__dirname, 'cache/file_example_MP4_1920_18MG.mp4')
  let videoExists
  try {
    await accessAsync(videoPath)
    videoExists = true
  } catch (e) {
    videoExists = false
  }
  if (!videoExists) {
    console.log('Downloading video example...')
    const source = await getAsync(videoSource)
    if (source.statusCode < 200 || source.statusCode >= 300) {
      throw new Error(`Unexpected status code ${source.statusCode}`)
    }
    const dest = createWriteStream(videoPath)
    await pipelineAsync(source, dest)
    console.log('Downloaded.')
  }
}

main().catch(reason => console.error(reason))
