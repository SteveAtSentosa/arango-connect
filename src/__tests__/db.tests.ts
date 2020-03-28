import 'jest-extended'
import { has, omit } from 'ramda'
import { Database } from 'arangojs'
import { logFerr, isFerr } from 'ferr'
import { ec } from '../errors'
import { returnErr } from '../utils/testUtils'
import {
  dbName,
  databaseExists, databaseDoesNotExist, createDatabase, getDatabase, deleteDatabase,
  collectionExists, collectionDoesNotExist, createDocCollection, createEdgeCollection, getCollection, deleteCollection,
  insertDocByCollection, insertDocByCollectionName,
} from '../arango-connect'


// get from config/env!!
const rootUn = 'root'
const rootPw = 'pw'

const graceful = true;

const runDbTests = () => {
  // testDbUtils()
  // testCollectionUtils()
  testDocUtils()
}

const dbPrefix = 'rytes-test-db-'
const testDbName = (dbName: string) => `rytes-test-db-${dbName}`
const isTestTb = (dbName: string) => dbName.indexOf(dbPrefix) === 0
const cleanTestDbs = async () => {
  const cn = new Database()
  cn.useBasicAuth(rootUn, rootPw)
  const dbsToClean = (await cn.listDatabases()).filter(isTestTb)
  return Promise.all(dbsToClean.map((dbName: string) => cn.dropDatabase(dbName)))
}

beforeEach(cleanTestDbs)
// afterEach(cleanTestDbs)

const testDbUtils = () => {

  test('should detect db existance correctly', async () => {
    expect(databaseExists('_system')).resolves.toBe(true)
    expect(databaseExists('db-that-does-not-exist')).resolves.toBe(false)
  })
  test('create / get / delete databases correctly', async () => {
    const dbName1 = testDbName('1')

    expect(await databaseExists(dbName1)).toBe(false)
    expect(await databaseDoesNotExist(dbName1)).toBe(true)
    const db1 = await createDatabase(dbName1)
    expect(db1).toBeInstanceOf(Database)
    expect(dbName(db1)).toBe(dbName1)
    expect(await databaseExists(dbName1)).toBe(true)
    expect(await databaseDoesNotExist(dbName1)).toBe(false)

    const dbGraceful = await createDatabase(dbName1, { graceful })
    expect(dbGraceful).toBeInstanceOf(Database)
    expect(dbName(dbGraceful)).toBe(dbName1)

    const dbGet = await getDatabase(dbName1)
    expect(dbGet).toBeInstanceOf(Database)
    expect(dbName(dbGet)).toBe(dbName1)

    const dbDoesNotExist = await getDatabase('db-does-not-exist').catch(returnErr)
    expect(isFerr(dbDoesNotExist)).toBe(true)
    expect(dbDoesNotExist.code).toBe(ec.RYTES_DB_DOES_NOT_EXIST)

    const dbDup = await createDatabase(dbName1).catch(returnErr)
    expect(isFerr(dbDup)).toBe(true)
    expect(dbDup.code).toBe(ec.RYTES_CANT_CREATE_DB)

    expect(await deleteDatabase(dbName1)).toBe(true)
    expect(await deleteDatabase(dbName1)).toBe(false)

    const db1Next = await createDatabase(dbName1)
    expect(db1Next).toBeInstanceOf(Database)
    expect(dbName(db1Next)).toBe(dbName1)
    expect(await deleteDatabase(dbName1)).toBe(true)
  })
}

const testCollectionUtils = () => {
  test('create / get / delete collections correctly', async () => {
    const dbName = testDbName('col')
    const db = await createDatabase(dbName)
    expect(db).toBeInstanceOf(Database)
    expect(collectionExists(db, 'collection-does-not-exist')).resolves.toBe(false)
    expect(collectionDoesNotExist(db, 'collection-does-not-exist')).resolves.toBe(true)

    // document collections

    const docCollectionName = 'doc-collection'
    expect(await collectionExists(db, docCollectionName)).toBe(false)
    expect(await getCollection(db, docCollectionName).catch(returnErr)).toSatisfy(isFerr)

    const docCollection = await createDocCollection(db, docCollectionName)
    expect(docCollection).toBeInstanceOf(Object)
    expect(await collectionExists(db, docCollectionName)).toBe(true)

    const docCollectionFromGet = await getCollection(db, docCollectionName)
    expect(docCollectionFromGet).toBeInstanceOf(Object)

    expect(await deleteCollection(db, docCollectionName)).toBe(true)
    expect(await deleteCollection(db, docCollectionName)).toBe(false)
    expect(await collectionExists(db, docCollectionName)).toBe(false)

    // edge collections

    const edgeCollectionName = 'edge-collection'
    expect(await collectionExists(db, edgeCollectionName)).toBe(false)
    expect(await getCollection(db, edgeCollectionName).catch(returnErr)).toSatisfy(isFerr)

    const edgeCollection = await createEdgeCollection(db, edgeCollectionName)
    expect(edgeCollection).toBeInstanceOf(Object)
    expect(await collectionExists(db, edgeCollectionName)).toBe(true)

    const edgeCollectionFromGet = await getCollection(db, edgeCollectionName)
    expect(edgeCollectionFromGet).toBeInstanceOf(Object)

    expect(await deleteCollection(db, edgeCollectionName)).toBe(true)
    expect(await deleteCollection(db, edgeCollectionName)).toBe(false)
    expect(await collectionExists(db, edgeCollectionName)).toBe(false)

    expect(await deleteDatabase(dbName)).toBe(true)
  })
}

const testDocUtils = () => {
  test('insert and retrieve docs correctly', async () => {

    const dbName = testDbName('test-doc-insert')
    const db = await createDatabase(dbName)
    expect(db).toBeInstanceOf(Database)

    const docCollectionName = 'doc-collection'
    const docCollection = await createDocCollection(db, docCollectionName)
    expect(docCollection).toBeInstanceOf(Object)
    expect(await collectionExists(db, docCollectionName)).toBe(true)

    const docToInsert = { a: 'a', b: ['b'], c: { c: 'c'}}
    const insertRspNoKey = await insertDocByCollection(docCollection, docToInsert)
    expect(has('_key', insertRspNoKey)).toBe(true)
    expect(omit(['_key', '_id', '_rev'], insertRspNoKey)).toEqual(docToInsert)

    const docToInsertWithKey = { ...docToInsert, _key: 'test-key-by-col' }
    const insertRspWithKey = await insertDocByCollection(docCollection, docToInsertWithKey)
    expect(omit(['_id', '_rev'], insertRspWithKey)).toEqual(docToInsertWithKey)

    const docToInsertByCname = { x: 'x', y: ['y'], z: { z: 'z'}}
    const insertRspByCnameNoKey = await insertDocByCollectionName(db, docCollectionName, docToInsertByCname)
    expect(has('_key', insertRspByCnameNoKey)).toBe(true)
    expect(omit(['_key', '_id', '_rev'], insertRspByCnameNoKey)).toEqual(docToInsertByCname)

    const docToInsertByCnameWithKey = { ...docToInsertByCname, _key: 'test-key-by-col-name'}
    const insertRspByCnameWithKey = await insertDocByCollection(docCollection, docToInsertByCnameWithKey)
    expect(omit(['_id', '_rev'], insertRspByCnameWithKey)).toEqual(docToInsertByCnameWithKey)

    // TODO: do I have full coverage ?? ... I had a few beers when I wrote this
  })
  xtest('remove docs correctly', () => null)
}

runDbTests()