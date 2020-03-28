import { assoc, curry } from 'ramda'
import { isString } from 'ramda-adjunct'
import { Database } from 'arangojs'

export const isStr = isString
isStr.desc = "string"

export const isInstanceOf = curry((Class, toCheck) => toCheck instanceof Class)
isInstanceOf.desc = "class instance"

export const isInstanceOfArangoDb = isInstanceOf(Database)
isInstanceOfArangoDb.desc = "Arango Database class instantiation"




