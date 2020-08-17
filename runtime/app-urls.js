import { currentUser } from 'common/User'
import { ensure } from 'dynamic/awe-library/runtime/create-document'
import { useCachedAsync } from 'common/use-async'
import { handle } from 'common/events'
import { getType } from 'dynamic/awe-library/runtime/records'

export let knownUrls = {}
handle('sign-in-event', () => (knownUrls = {}))

export function appUrl(appType) {
    let id = `${currentUser()}:${appType.database}/${appType.table}`
    if (!knownUrls[id]) {
        knownUrls[id] = ensure(id, appType).catch(console.error)
    }
    return id
}

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
