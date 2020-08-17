import { get, list } from 'common/offline-data-service'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { updateDocument } from 'dynamic/awe-library/runtime/lib/get-instance'
import useAsync from 'common/use-async'

export const getRecords = async (type, query, skip, take, options) => {
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

export function useRecordsOfType(type, query, skip, take, options) {
    return useAsync(
        async () => {
            return await getRecords(type, query, skip, take, options)
        },
        [[], []],
        `${type}-${skip}:${take}!${JSON.stringify(query)}`
    )
}

export async function getType(id) {
    if (Object.isObject(id)) return id
    if (!id) return null
    return await get(id, true, false, 'server-preferred')
}
