/**
 * @module dynamic/awe-library/runtime/records
 */
import { get, list } from 'common/offline-data-service'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { updateDocument } from 'dynamic/awe-library/runtime/lib/get-instance'
import useAsync from 'common/use-async'

/**
 * @typedef RecordResults
 * @type {array}
 * @global
 * @property {Array<Document>} 0 - the items retrieved
 * @property {Array<FieldDefinition>} 1 - the field definitions
 */

/**
 * A function to retrieve records from a type.  The documents
 * retrieved are automatically updated by replaying local
 * changes.
 *
 * @param {string|DocumentDefinition} type - the type whose records should be retrieved
 * @param {WhereDefinition} [query] - a query to apply
 * @param {number} [skip] - the number of records to skip
 * @param {number} [take] - the number of records to return
 * @param {ListOptions} [options] - options to provide
 * @returns {Promise<RecordResults>} a promise for the matching records and field definitions in the type
 */
export async function getRecords(type, query, skip, take, options)  {
    if (!type) return []
    let lookupType = await getType(type)
    await initialize(lookupType)
    let fields = lookupType.sendMessage('fields', [])
    const where = Object.assign({}, query)
    let items = (
        await list(lookupType.database, lookupType.table, where, {
            ...options,
            skip,
            take,
        })
    ).map((d) => d.data)
    items.loaded = true
    await updateDocument(items)
    return [items, fields]
}

/**
 * A hook function to retrieve records from a type.  The documents
 * retrieved are automatically updated by replaying local
 * changes. Returns [[], []] until valid results are available
 *
 * @param {string|DocumentDefinition} type - the type whose records should be retrieved
 * @param {WhereDefinition} [query] - a query to apply
 * @param {number} [skip] - the number of records to skip
 * @param {number} [take] - the number of records to return
 * @param {ListOptions} [options] - options to provide
 * @returns {RecordResults} The records and field definitions
 */export function useRecordsOfType(type, query, skip, take, options) {
    return useAsync(
        async () => {
            return await getRecords(type, query, skip, take, options)
        },
        [[], []],
        `${type}-${skip}:${take}!${JSON.stringify(query)}`
    )
}

/**
 * Retrieves a type - we always prefer the server for types
 * @param {string} id - the id of the type
 * @returns {Promise<DocumentDefinition>} a promise for the definition
 */
export async function getType(id) {
    if (Object.isObject(id)) return id
    if (!id) return null
    return await get(id, true, false, 'server-preferred')
}
