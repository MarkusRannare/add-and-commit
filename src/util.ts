import * as core from '@actions/core'
import { info } from '@actions/core'
import assert from 'assert'

export type Input =
  | 'add'
  | 'author_name'
  | 'author_email'
  | 'branch'
  | 'parent_branch'
  | 'cwd'
  | 'message'
  | 'pull_strategy'
  | 'push'
  | 'remove'
  | 'signoff'
  | 'tag'

export const outputs = {
  committed: 'false',
  pushed: 'false',
  tagged: 'false'
}
export type Output = keyof typeof outputs

const fakeData = true;

function fakeInput(name: Input) : string {
  switch(name) {
    case 'add':
      return '-A'
    case 'author_name':
      return 'Your Name'
    case 'author_email':
      return 'mail@example.com'
    case 'branch':
      return 'v2.1.0'
    case 'parent_branch':
      return 'main'
    case 'cwd':
      return 'debug-data'
    case 'message':
      return 'Your commit message'
    case 'pull_strategy':
      return '--no-rebase'
    case 'remove':
      return ''
    case 'push':
      return 'true'
    case 'signoff':
      return 'false'
    case 'tag':
      return 'rel-v2.1.1'
  }
  // Should never reach here
  assert(false)
  return ''
}

export function getInput(name: Input) {
  if(fakeData) {
    return fakeInput(name)
  }

  return core.getInput(name)
}

export function log(err: any | Error, data?: any) {
  if (data) console.log(data)
  if (err) core.error(err)
}

export function parseBool(value: any) {
  try {
    const parsed = JSON.parse(value)
    if (typeof parsed == 'boolean') return parsed
  } catch {}
}

export function setOutput(name: Output, value: 'true' | 'false') {
  core.debug(`Setting output: ${name}=${value}`)
  outputs[name] = value
  return core.setOutput(name, value)
}
for (const key in outputs) setOutput(key as Output, outputs[key])
