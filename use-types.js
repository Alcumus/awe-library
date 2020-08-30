/**
 * @module dynamic/awe-library/use-types
 */

import { useAsync, useCachedAsync } from 'common/use-async'
import { getApps, getTypeNames, getTypes } from 'dynamic/awe-library/lib/api'
import noop from 'common/noop'
import { useRefresh } from 'common/useRefresh'
import { useLocalEvent } from 'common/use-event'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { getType } from 'dynamic/awe-library/lib/api'

/**
 * @interface DocumentRecord
 * Additional properties are available on the object implementing this interface if the whole type is returned
 *
 * @property {string} _id - the id of the type
 * @property {Date} modified - the modification date of the type
 * @property {Date} created - the create date of the type
 * @property {string} type - 'doc' for document 'app' for apps
 *
 */


/**
 * Returns a list of types that DOES NOT include
 * the definition of the type, but can be used
 * to get the names and ids
 * @param {string} [refreshId] - an id used to indicate if a cached list should be refreshed
 * @returns {Array<DocumentRecord>} the types available in the system (includes both apps and documents) and only includes name and type etc
 */
export function useTypeList(refreshId) {
    return useCachedAsync(
        'getTypeList',
        async () => {
            return await getTypeNames()
        },
        [],
        'standard',
        refreshId
    )
}

/**
 * Retrieves a list of types including all of their definition, this
 * only includes Document types
 *
 * @param {string} [refreshId] - an id to indicate whether the list should be refreshed
 * @returns {Array<DocumentRecord>} the types available in the current context  (client)
 */
export function useTypes ( refreshId ) {
    return useCachedAsync(
        'getTypes',
        async () => {
            return await getTypes()
        },
        [],
        'standard',
        refreshId
    )
}

/**
 * Retrieves a list of types including all of their definition, this
 * only includes Application types
 *
 * @param {string} [refreshId] - an id to indicate whether the list should be refreshed
 * @returns {Array<DocumentRecord>} the types available in the current context  (client)
 */
export function useApps(refreshId) {
    return useCachedAsync(
        'getApps',
        getApps,
        [],
        'standard',
        refreshId
    )
}

/**
 * Given an id, retrieves the type and fully initialises it.  This
 * process involves hydrating and applying all behaviour functions.
 * The result is capable of fully responding to messages etc.
 * @param {string} id - the id of the type to return
 * @param {function} [whenReady] - callback for when the type is ready, this may be async
 * @returns {Promise<DocumentDefinition>} a promise for the initialised document
 */
export async function getTypeAndInitialise(id, whenReady = noop) {
    if (!id) return null
    const type = await getType(id)
    if (!type) return null
    await initialize(type)
    await type.sendMessageAsync('hydrated')
    await type.sendMessageAsync('hasHydrated')
    await Promise.resolve(whenReady(type))
    return type
}

/**
 * A hook which given an id, retrieves the type and fully initialises it.  This
 * process involves hydrating and applying all behaviour functions.
 * The result is capable of fully responding to messages etc.
 * @param {string} id - the id of the definition to retrieve
 * @param {function} [whenReady] - a callback when the type has been initialized, before it is returned. Maybe async.
 * @returns {DocumentDefinition|null} retrieved document definition
 */
export function useType(id, whenReady = noop) {
    const refresh = useRefresh()
    useLocalEvent(`data.updated.${id}`, refresh)
    return useAsync(async () => getTypeAndInitialise(id, whenReady), null, `${id}:${refresh.id}`)
}

/**
 * This retrieves the currently published and active version of a
 * type.  This is the one that should be created if necessary in the
 * current context.  The context can be live, debugging or test depending
 * on URL parameters.
 *
 * @param {string} type - the id of the type to get the published version of
 * @returns {Promise<DocumentDefinition>} the currently active published version of the type
 */
export async function getPublishedVersionOfType(type) {
    const loaded = await getType(type)
    if (!loaded) {
        console.error('NOT FOUND', type)
        return null
    }
    let versionId = loaded?.currentVersion?.[window.mode || 'live'] ?? null
    if (!versionId) {
        const toReturn = JSON.parse(JSON.stringify(loaded))
        delete toReturn.versions
        delete toReturn.currentVersion
        return toReturn
    }
    return JSON.parse(loaded.versions.find((v) => v.name === versionId).content)
}
