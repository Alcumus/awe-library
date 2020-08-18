import { useAsync, useCachedAsync } from 'common/use-async'
import { getApps, getTypeNames, getTypes } from 'dynamic/awe-library/lib/api'
import noop from 'common/noop'
import { useRefresh } from 'common/useRefresh'
import { useLocalEvent } from 'common/use-event'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { getType } from 'dynamic/awe-library/lib/api'

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

export function useApps(refreshId) {
    return useCachedAsync(
        'getApps',
        getApps,
        [],
        'standard',
        refreshId
    )
}

export async function getTypeAndInitialise(id, whenReady = noop) {
    if (!id) return null
    const type = await getType(id)
    if (!type) return null
    await initialize(type)
    await type.sendMessageAsync('hydrated')
    await type.sendMessageAsync('hasHydrated')
    await Promise.resolve(whenReady())
    return type
}

export function useType(id, whenReady = noop) {
    const refresh = useRefresh()
    useLocalEvent(`data.updated.${id}`, refresh)
    return useAsync(async () => getTypeAndInitialise(id, whenReady), null, `${id}:${refresh.id}`)
}

export async function getPublishedVersionOfType(type) {
    const loaded = await getType(type)
    if (!loaded) {
        console.error('NOT FOUND', type)
        return null
    }
    let versionId = loaded?.currentVersion[window.mode || 'live'] ?? null
    if (!versionId) {
        const toReturn = JSON.parse(JSON.stringify(loaded))
        delete toReturn.versions
        delete toReturn.currentVersion
        return toReturn
    }
    return JSON.parse(loaded.versions.find((v) => v.name === versionId).content)
}
