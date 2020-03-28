// TODO:
// * make this into a stand alone repo
// * catch any arango errors thrown, and create approrate fErr from that !!!

import { propEq, mergeLeft } from 'ramda'
import { aql, Database, DocumentCollection } from 'arangojs'
import { addExternalExp, throwIf } from 'ferr'
import { err } from './errors'

// TODO:
// * make this a stand alone library, make connection it's own thing that has to be passed in and holds creds
// * any place that an arango error could be thrown, catch it, and turn it into an ferr
// * docs
// * creds on env vars uncluding connetion url
// * type definition file for ferr
// * add graceful to getDb/Colleciton createDb/C
// * make connection external, that might be best (maybe even make a Connection Object)

const rootUn = 'root'
const rootPw = 'pw'

interface SysConnection {
  cn: Database | null
  un: string
  pw: string
}

enum CollectionType {
  Document,
  Edge,
}

//*****************************************************************************
// helpers
//*****************************************************************************

const beGraceful = (opts: any) : boolean => propEq('graceful', true, opts)

// creates the object with proper credentials applied, and supplied db set as active
// if dbName not supplied, will default to _system
// does not validate connection, existance of DB, etc
const createDbObj = (dbName?: string)
: Database => {
  const db = new Database()
  db.useBasicAuth(rootUn, rootPw)
  if (dbName) db.useDatabase(dbName)
  return db
}

// this could change over time
export const dbName = (db: any) :string => db._connection._databaseName

//*****************************************************************************
// conneciton utils
//*****************************************************************************

// connection = Database obj with active db set to '_system'

const _sysConnection: SysConnection = {
  cn: null,
  un: 'root',
  pw: 'pw'
}

// Passthrough or throw fErr
const validateConnection = async (db: Database)
: Promise<Database>=> {
  try {
    await (await db.query(aql`RETURN ${Date.now()}`)).next()
    return db
  } catch (e) {
    throw addExternalExp(e, err.cantOpenConnection())
  }
}

const getSysConnection = async ()
: Promise<Database> => {
  if (_sysConnection.cn !== null) return _sysConnection.cn
  _sysConnection.cn = createDbObj()
  await validateConnection(_sysConnection.cn)
  return _sysConnection.cn
}

//*****************************************************************************
// Database utils
//*****************************************************************************

const getDatabaseList = async ()
: Promise<string[]> => {
  const cn = await getSysConnection()
  return cn.listDatabases()
}

export const databaseExists = async (dbName: string)
: Promise<boolean> => {
  const dbList = await getDatabaseList()
  return dbList.includes(dbName)
  // const dbToCheck: Database = createDbObj(dbName)
  // return dbToCheck.exists()
}

export const databaseDoesNotExist = async (dbName: string)
: Promise<boolean> => (!await databaseExists(dbName))

// create and returns a db, with active db set to dbName
// TODO: users for DB
export const createDatabase = async (dbName: string, opts = {})
: Promise<Database> => {
  if (await databaseExists(dbName)) {
    if(beGraceful(opts)) return createDbObj(dbName)
    throw err.cantCantCreateDbWithDupName(dbName)
  }
  const cn = await getSysConnection()
  await cn.createDatabase(dbName)
  return createDbObj(dbName)
}

// TODO: assert that it exists
export const getDatabase = async (dbName: string)
: Promise<Database> => {
  throwIf(await databaseDoesNotExist(dbName), err.cantGetNonExistantDb(dbName))
  const db = new Database()
  db.useDatabase(dbName)
  return db
}

// if database exists and was deleted returns true
// if database does not exist, returns false
export const deleteDatabase = async (dbName: string)
: Promise<boolean> => {
  if (await databaseDoesNotExist(dbName)) return false
  const cn = await getSysConnection()
  await cn.dropDatabase(dbName)
  return true
}

//*****************************************************************************
// Collection Utils
//*****************************************************************************

export const collectionExists = async (db: Database, collectionName: string)
: Promise<boolean> => {
    const cl = db.collection(collectionName)
    const exists = await cl.exists()
    return exists
}

export const collectionDoesNotExist = async (db: Database, collectionName: string)
  : Promise<boolean> => !(await collectionExists(db, collectionName))

// if graceful and colleciton exists, just returns existing collection
export const createDocCollection =
async (db: Database, collectionName: string, opts = {})
: Promise<DocumentCollection> => {
  if (await collectionExists(db, collectionName)) {
    if(beGraceful(opts)) return db.collection(collectionName)
    throw err.cantCantCreateCollectionWithDupName(dbName(db), collectionName)
  }
  const docCollection = db.collection(collectionName)
  await docCollection.create()
  return docCollection
}


// if graceful and colleciton exists, just returns existing collection
export const createEdgeCollection =
async (db: Database, collectionName: string, opts = {})
: Promise<DocumentCollection> => {
  if (await collectionExists(db, collectionName)) {
    if(beGraceful(opts)) return db.collection(collectionName)
    throw err.cantCantCreateCollectionWithDupName(dbName(db), collectionName)
  }
  const edgeCollection = db.edgeCollection(collectionName)
  await edgeCollection.create()
  return edgeCollection
}


export const getCollection = async (db: Database, collectionName: string)
: Promise<DocumentCollection> => {
  throwIf(
    await collectionDoesNotExist(db, collectionName),
    err.cantGetNonExistantCollection(dbName(db), collectionName)
  )
  return db.collection(collectionName)
}
// if collection exists and was deleted returns true
// if collection does not exist, returns false
export const deleteCollection = async (db: Database, collectionName: string)
: Promise<boolean> => {
  if (await collectionDoesNotExist(db, collectionName)) return false
  const collection = db.collection(collectionName)
  await collection.drop()
  return true
}

//*****************************************************************************
// Document operations
//*****************************************************************************

// TODO: catch arango throws, and return appropriate error
// returns full representation of document that was inserted
export const insertDocByCollection = async (collection: DocumentCollection, doc: object)
: Promise<object> => {
  const rsp = await collection.save(doc)
  return mergeLeft(rsp, doc)
}

export const insertDocByCollectionName = async (db: Database, collectionName: string, doc: object)
: Promise<object> => {
  const collection = await getCollection(db, collectionName)
  return insertDocByCollection(collection, doc)
}