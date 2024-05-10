//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
export function jsonMapReplacer(key: string, value: any) {
  if (value instanceof Map) return [...value]
  else return value
}

export const range = (start: number, stop: number, step: number) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const arraysEqual = (a: any[], b: any[]) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false

  return true
}

export function convertHexStringToBlob(hex: string, mimeType: string): Blob {
  if (hex.startsWith('\\x')) hex = hex.slice('\\x'.length)
  let previousValue = ''
  const bytes = [...hex].reduce((acc, _, i) => {
    if ((i - 1) & 1)
      //even
      previousValue = _
    //odd
    else acc.push(parseInt(previousValue.concat(_), 16))
    return acc
  }, [] as number[])
  return new Blob([new Uint8Array(bytes)], { type: mimeType })
}
