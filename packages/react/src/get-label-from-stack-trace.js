// @flow

const internalReactFunctionNames = /* #__PURE__ */ new Set([
  'renderWithHooks',
  'processChild',
  'finishClassComponent',
  'renderToString'
])

export const getLabelFromStackTrace = stackTrace => {
  if (!stackTrace) return undefined

  let linestart = 0
  let charptr = 0
  let end = stackTrace.length
  let line = 1

  // Skip the first line
  while (stackTrace[charptr] !== '\n') {
    charptr++
  }

  // Move to next line and set start
  charptr++
  linestart = charptr

  while (charptr < end) {
    if (charptr === linestart) {
      // Skip spaces and 'at '
      while (
        stackTrace[charptr] === ' ' ||
        (stackTrace[charptr] === 'a' &&
          stackTrace[charptr + 1] === 't' &&
          stackTrace[charptr + 2] === ' ')
      ) {
        charptr = stackTrace[charptr] === ' ' ? charptr + 1 : charptr + 3
      }
      // move line start to pointer
      linestart = charptr
    }

    switch (stackTrace[charptr]) {
      case '.': {
        // We want to infer only the last component of the function name
        // Example: Object.createEmotionProps -> createEmotionProps so
        // when we encounter a dot, we skip the previous part of the name
        // and move linestart to the next character
        linestart = ++charptr
        break
      }
      case '(':
      case ' ':
      case '@':
      case '\n': {
        // Our label has to start with an uppercase letter, skip everything else
        // note: unicode uppercase letters are technically valid JS identifiers,
        // but we will ignore them for simplicity sake.
        const firstCharCode = stackTrace.charCodeAt(linestart)
        if (firstCharCode < 65 || firstCharCode > 90) {
          while (charptr < end && stackTrace[charptr] !== '\n') {
            charptr++
          }
          line++
          linestart = ++charptr
          break
        }

        const functionName = stackTrace.slice(linestart, charptr)
        if (internalReactFunctionNames.has(functionName)) {
          charptr++
          break
        }

        // These identifiers come from error stacks, so they have to be valid JS
        // identifiers, thus we only need to replace what is a valid character for JS,
        // but not for CSS.
        return functionName.replace(/\$/g, '-')
      }
      default: {
        charptr++
      }
    }
  }

  return undefined
}
