export interface YAMLLDData {
  [key: string]: unknown
  $type?: string
  $context?: string
  $base?: string
  $vocab?: string
  $language?: string
  $list?: unknown[]
  $set?: Set<unknown>
  $reverse?: boolean
}
