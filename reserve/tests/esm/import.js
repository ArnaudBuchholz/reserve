import { join, sep } from 'path'

export default () => join('esm', 'OK').replace(sep, ':')
