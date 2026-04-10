#!/usr/bin/env node

/**
 * Prepend `&nbsp;` to every non-empty line after the YAML front matter,
 * correctly wrap `***` scene breaks in centered divs,
 * and ensure every line ends with exactly two spaces for Markdown hard breaks.
 *
 * Usage:
 * node scripts/prepend-tabs.mjs <path/to/file.mdx>
 */

import fs from 'fs'
import path from 'path'

function printUsageAndExit() {
  console.error('Usage: node scripts/prepend-tabs.mjs <path/to/file.mdx>')
  process.exit(1)
}

function computeFrontMatterEndIndex(fileContent) {
  const delimiterRegex = /^---\s*$/gm
  const indices = []
  let match
  while ((match = delimiterRegex.exec(fileContent)) !== null) {
    indices.push(match.index)
    if (match.index === delimiterRegex.lastIndex) delimiterRegex.lastIndex++
  }

  if (indices.length >= 2 && indices[0] === 0) {
    const second = indices[1]
    const newlineIdx = fileContent.indexOf('\n', second)
    return newlineIdx === -1 ? fileContent.length : newlineIdx + 1
  }

  return 0 
}

function wrapCenteredDividers(body) {
  // FIXED: Removed the extra backslashes. 
  // \*\*\* correctly escapes the asterisks for regex so it matches exactly ***
  return body.replace(/^(\s*)\*\*\*(\s*)$/gm, '$1<div align="center">***</div>$2')
}

function transformBody(body) {
  // First wrap *** in centered divs
  let transformed = wrapCenteredDividers(body)

  // Then prepend &nbsp; at the start of every line that contains any non-whitespace
  // characters, but exclude lines that start with <div tags (optionally with leading whitespace)
  transformed = transformed.replace(
    /^(?!\s*<div)(?=.*\S)/gm,
    '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'
  )

  // Finally, remove existing trailing spaces/tabs and append exactly two spaces.
  transformed = transformed.replace(/[ \t]*(\r?)$/gm, '  $1')

  return transformed
}

function prependNbspToFile(filePath) {
  const absolutePath = path.resolve(process.cwd(), filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const original = fs.readFileSync(absolutePath, 'utf8')
  const fmEndIndex = computeFrontMatterEndIndex(original)
  const head = original.slice(0, fmEndIndex)
  const body = original.slice(fmEndIndex)

  const transformedBody = transformBody(body)
  const output = head + transformedBody
  fs.writeFileSync(absolutePath, output, 'utf8')

  const totalLines = original.split(/\r?\n/).length
  const changedLines = (body.match(/^.*\S.*$/gm) || []).length
  console.log(`Updated ${filePath} — total lines: ${totalLines}, modified lines: ${changedLines}`)
}

// Main
const args = process.argv.slice(2)
if (args.length < 1) printUsageAndExit()
for (const target of args) {
  prependNbspToFile(target)
}
