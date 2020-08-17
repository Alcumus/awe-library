import { useRef } from 'react'
import { useRefresh } from 'common/useRefresh'
import { useLocalEvent } from 'common/use-event'
import { isMatchingDocument } from 'common/compare-documents'
import useAsync, { CancelAsync } from 'common/use-async'
import { documentChangesApply, documentRetrieve } from 'dynamic/awe-library/runtime/lib/simple-db'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { appReady } from 'common/app-ready'
import { getDocumentWithChanges, getInstance, trackAsync } from 'dynamic/awe-library/runtime/lib/get-instance'

export function useInstance(id, actionId, document) {
    const returnValue = useRef({ notLoaded: true })
    const refresh = useRefresh()
    useLocalEvent([`context.updated.${id}.${actionId}.*`], refresh)

    return useAsync(
        trackAsync(async () => {
            let result = await getInstance(id, actionId, document)
            returnValue.current = result
            return result
        }),
        returnValue.current,
        refresh.id
    )
}

export async function getDocument(id) {
    const info = { id }
    await documentRetrieve(info)
    await documentChangesApply(info)
    await initialize(info.document)
    await info.document.sendMessageAsync('hydrated')
    await info.document.sendMessageAsync('hasHydrated')
    return info.document
}

export function useDocumentRefresh(docs, refresh) {
    const localRefresh = useRefresh()
    refresh = refresh || localRefresh
    const all = docs.flatten()
    useLocalEvent('data.updated.*', check)
    return refresh.id

    function check(id) {
        if (all.find((v) => v._id === id)) {
            refresh()
        }
    }
}

export function useDocument(id, defaultValue = null) {
    const returnValue = useRef(defaultValue)
    if (returnValue.current && returnValue.current._id !== id) {
        returnValue.current = null
    }
    const refresh = useRefresh()
    useLocalEvent(`data.updated.${id}`, async () => {
        const updatedDocument = await getDocumentWithChanges(id)
        if (isMatchingDocument(updatedDocument, returnValue.current)) return
        // returnValue.current = null
        refresh()
    })
    return useAsync(
        trackAsync(async () => {
            if (!id) return CancelAsync
            const info = { id }
            await documentRetrieve(info)
            if (!info.document) return CancelAsync
            await documentChangesApply(info)
            await initialize(info.document)
            await info.document.sendMessageAsync('hydrated')
            await info.document.sendMessageAsync('hasHydrated')
            await appReady()
            if (isMatchingDocument(returnValue.current, info.document)) return CancelAsync
            return (returnValue.current = info.document)
        }),
        returnValue.current,
        `${id} + ${refresh.id}`
    )
}
