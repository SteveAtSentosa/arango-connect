import stringify from 'json-stringify-safe'

export const json  = (v: any) => stringify(v, null, 2)
export const str = (v: any) => stringify(v)
