// @ts-expect-error ts issue for importing JSON files
import { defaultOptions } from '@dtlib/constants/options.json'
import type { ITableOptions } from '@dtlib/interfaces/Types'

export default class Config {
  static defaultOptions: ITableOptions = defaultOptions
}
