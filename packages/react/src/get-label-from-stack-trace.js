// @flow

const getLastPart = (functionName: string): string => {
  // The match may be something like 'Object.createEmotionProps' or
  // 'Loader.prototype.render'
  let chars = functionName.length
  // If it is empty, do nothing
  if (chars === 0) return ''
  // if it is a single character, it cannot contain a dot
  if (chars === 1) return functionName
  // if it is three characters, it can only contain a dot in the middle
  if (chars === 3 && functionName[1] === '.') {
    return functionName[2]
  }

  // The ending cannot be a dot, so we can start from penultimate character
  let charptr = chars - 2
  while (functionName[charptr] !== '.' && charptr >= 0) {
    charptr--
  }
  return functionName.slice(charptr + 1)
}

const getFunctionNameFromStackTraceLine = (line: string): ?string => {
  // V8
  let match = /^\s+at\s+([A-Za-z0-9$.]+)\s/.exec(line)
  if (match) return getLastPart(match[1])

  // Safari / Firefox
  match = /^([A-Za-z0-9$.]+)@/.exec(line)
  if (match) return getLastPart(match[1])

  return undefined
}

const internalReactFunctionNames = /* #__PURE__ */ new Set([
  'renderWithHooks',
  'processChild',
  'finishClassComponent',
  'renderToString'
])

// These identifiers come from error stacks, so they have to be valid JS
// identifiers, thus we only need to replace what is a valid character for JS,
// but not for CSS.
const sanitizeIdentifier = (identifier: string) =>
  identifier.replace(/\$/g, '-')

export const getLabelFromStackTrace = (stackTrace: string): ?string => {
  if (!stackTrace) return undefined

  const lines = stackTrace.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const functionName = getFunctionNameFromStackTraceLine(lines[i])

    // The first line of V8 stack traces is just "Error"
    if (!functionName) continue

    // If we reach one of these, we have gone too far and should quit
    if (internalReactFunctionNames.has(functionName)) break

    // The component name is the first function in the stack that starts with an
    // uppercase letter
    if (/^[A-Z]/.test(functionName)) return sanitizeIdentifier(functionName)
  }

  return undefined
}
