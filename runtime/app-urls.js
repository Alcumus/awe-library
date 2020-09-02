/**
 * @module dynamic/awe-library/runtime/app-urls
 */
import { currentUser } from 'common/User'
import { ensure } from 'dynamic/awe-library/runtime/create-document'
import { useCachedAsync } from 'common/use-async'
import { handle } from 'common/events'
import { getType } from 'dynamic/awe-library/runtime/records'

export let knownUrls = {}
handle('sign-in-event', () => (knownUrls = {}))

/**
 * Returns a url given an app type
 * @param {DocumentDefinition} appType - the type to get a url for
 * @returns {string} a unique id for a document
 */
export function appUrl(appType) {
    let id = `${currentUser()}:${appType.database}/${appType.table}`
    if (!knownUrls[id]) {
        knownUrls[id] = ensure(id, appType).catch(console.error)
    }
    return id
}

/**
 * Returns a url given an app type, ensuring that the document exists
 * @param {DocumentDefinition} appType - the type to get a url for
 * @returns {Promise<string>} a promise for a unique id for a document
 */
export async function guaranteedAppUrl(appType) {
    let id = `${currentUser()}:${appType.database}/${appType.table}`
    // eslint-disable-next-line no-console
    console.log('guaranteed app url', id)
    if (!knownUrls[id]) {
        let promise = (knownUrls[id] = ensure(id, appType))
        await promise
    } else {
        await knownUrls[id]
    }
    return id
}

/**
 * A hook to get a url for an application which is guaranteed to
 * exist
 * @param {string} typeId - the type for which a url is required
 * @returns {string} an empty string until an app url is generated
 */
export function useAppUrl(typeId) {
    return useCachedAsync(
        'getUrl',
        async () => {
            let type = await getType(typeId)
            return await guaranteedAppUrl(type)
        },
        '',
        typeId
    )
}
