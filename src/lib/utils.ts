//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+
export function jsonMapReplacer(key: string, value: any) {
  if (value instanceof Map) return [...value]
  else return value
}

export const range = (start: number, stop: number, step: number) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
