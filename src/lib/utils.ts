//Copyright 2023 RADar-AZDelta
//SPDX-License-Identifier: gpl3+

import { DEV, BROWSER } from 'esm-env'

export const range = (start: number, stop: number, step: number) => Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function debounce<T extends (...args: any[]) => any>(cb: T, wait: number) {
  let h: any
  const callable = (...args: any) => {
    clearTimeout(h)
    h = setTimeout(() => cb(...args), wait)
  }
  return <T>(<any>callable)
}

export function isEqual(x: any, y: any): boolean {
  const tx = typeof x,
    ty = typeof y
  return x && y && tx === 'object' && tx === ty
    ? Object.keys(x).length === Object.keys(y).length && Object.keys(x).every(key => isEqual(x[key], y[key]))
    : x === y
}

export function logWhenDev(text: string): void {
  if (DEV) console.log(text)
}

export const isBrowser = () => BROWSER
