import { flatten, complement, has, allPass, assoc, reduce } from 'ramda'
import { isArray } from 'ramda-adjunct'


export const arrayify = (input: any) => isArray(input) ? input : [input]
export const flatArrayify = (input: any) => flatten(arrayify(input))

// TODO: use lens groups and add hasProps to lg ???

export const hasProps = (propNameList: string[], obj: any)
: boolean => {
  const preds = propNameList.map(propName => has(propName))
  return allPass(preds)(obj);
}

export const doesNotHaveProps = complement(hasProps)

// export const assocPropIf = (
//   pred: (v:any)=>boolean, val: any, propName: string, targetObj: object) : object =>
//     pred(val) ? assoc(propName, val, targetObj) : targetObj