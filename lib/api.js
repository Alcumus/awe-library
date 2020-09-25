import { define, parameter, retrieve, send } from 'common/process'
import { cacheRecords, get } from 'common/offline-data-service'
import { getLocalItem, storeLocalItem } from 'common/local-storage/local-store'

export const getApps = define('app.types.get', function ({returns}) {
    returns('apps')
})
export const getTypes = retrieve('document.types.get', 'types')
export const getTypeNames = retrieve('document.types.getNames', 'types')
export const getSections = retrieve('sections.get', 'sections')
export const getSection = retrieve(
    'section.get',
    'section',
    parameter('sectionId')
)

export const addType = retrieve(
    'document.types.add',
    'id',
    parameter('name'),
    parameter('definition')
)
export const addApp = define('app.types.add', function ({required, optional, returns}) {
    required('name')
    optional('definition')
    returns('id')
})

export const deleteType = send('document.types.delete', parameter('id'))
export const getTypeFromDb = retrieve(
    'document.type.get',
    'definition',
    parameter('id')
)
export const setTypeToDb = send('document.type.set', parameter('definition'))
export const updateSection = send('section.update', parameter('section'))
export const getLookupTables = retrieve('lookupTables.get', 'tables')
export const getMetadata = define('awe.metadata.get', function({returns, offlineCache, cacheResult}) {
    returns('metadata')
    cacheResult(async result=>{
        await storeLocalItem('awe_metadata', result)
    })
    offlineCache(async ()=>{
        return await getLocalItem('awe_metadata')
    })
})

export const upgradeDocuments = define('document.upgrade', function ({
    required,
    optional,
}) {
    required('documentId')
    required('version')
    optional('fromVersion')
})

const tracking = {}
const dummy = Promise.resolve(true)

export function trackSave(id, promise) {
    tracking[id] = promise
    return promise
}

export async function getType(id) {
    if (!id) return null
    await (tracking[id] || dummy)
    return await get(id, true, false, 'server-preferred')
}

export async function setType(definition) {
    await cacheRecords(definition, true)
    return await setTypeToDb(definition)
}
