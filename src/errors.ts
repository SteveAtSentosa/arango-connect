import { json } from './utils/strUtils'
import { makeErr } from 'ferr'

const errCodes = [
  'RYTES_CANT_OPEN_DB_CONNECTION',
  'RYTES_CANT_CREATE_DB',
  'RYTES_DB_DOES_NOT_EXIST',
  'RYTES_DB_COLLECTION_DOES_NOT_EXIST',
  'RYTES_CANT_CREATE_COLLECTION',
  'RYTES_CANT_CREATE_ACCOUNT',
  'RYTES_CANT_CREATE_TYPE',

]


export const ec: any = errCodes.reduce((codes, cur) => ({ ...codes, [cur]: cur }), {})

const ops = {
  connecting: 'Connecting to arango server',
  creatingDb: 'Creating arango DB',
  gettingDb: 'Getting Db instance',
  gettingCollection: 'Getting Db collection',
  creatingAccount: 'Creating Rytes account',
  creatingActorType: 'Creating Rytes actor type',
  creatingResourceType: 'Creating Rytes resource type'
}

// db errors

const cantOpenConnection = () => makeErr({
  op: ops.connecting,
  code: ec.RYTES_CANT_OPEN_DB_CONNECTION,
  msg: 'could not connect to arrango server',
  notes: ['possible causes: incorrect un/pw | incorrect connection url | arango server not running']
})

const cantCantCreateDbWithDupName = (dbName: string) => makeErr({
  op: ops.creatingDb,
  code: ec.RYTES_CANT_CREATE_DB,
  msg: `could not create db '${dbName}', a database of that name already exists`,
})

const cantGetNonExistantDb = (dbName: string) => makeErr({
  op: ops.gettingDb,
  code: ec.RYTES_DB_DOES_NOT_EXIST,
  msg: `could not get '${dbName}', it does not exist`,
})

const cantGetNonExistantCollection = (dbName: string, collectionName: string) => makeErr({
  op: ops.gettingCollection,
  code: ec.RYTES_DB_COLLECTION_DOES_NOT_EXIST,
  msg: `could not get collection '${dbName}:${collectionName}', it does not exist`,
})

const cantCantCreateCollectionWithDupName = (dbName: string, collectionName: string) => makeErr({
  op: ops.creatingDb,
  code: ec.RYTES_CANT_CREATE_COLLECTION,
  msg: `could not create collection '${dbName}:${collectionName}', it already exist`,
})

// account errors

const cantCantCreateAccountWithInvalidInfo = (statusStr: string) => makeErr({
  op: ops.creatingAccount,
  code: ec.RYTES_CANT_CREATE_ACCOUNT,
  msg: `could not create account due to invalid input: ${statusStr}`
})

const cantCantCreateDuplicateAccount = (accountName: string) => makeErr({
  op: ops.creatingAccount,
  code: ec.RYTES_CANT_CREATE_ACCOUNT,
  msg: `could not create account '${accountName}', an account of that name already exists`
})

// type errors

const canCreateActorTypeInvalidInfo = (statusStr: string) => makeErr({
  op: ops.creatingActorType,
  code: ec.RYTES_CANT_CREATE_TYPE,
  msg: `could not create actor type due to invalid input: ${statusStr}`
})

export const err = {
  cantOpenConnection,
  cantCantCreateDbWithDupName,
  cantGetNonExistantDb,
  cantGetNonExistantCollection,
  cantCantCreateCollectionWithDupName,
  cantCantCreateAccountWithInvalidInfo,
  cantCantCreateDuplicateAccount,
  canCreateActorTypeInvalidInfo,
}