import debounce from 'lodash-es/debounce'
import { generate } from 'shortid'
import {
    documentChangesApply,
    documentChangesStore,
    documentContextRemove,
    documentContextRetrieve,
    documentContextStore,
    documentRetrieve,
} from 'dynamic/awe-library/runtime/lib/simple-db'
import { raise } from 'common/events'
import { batch } from 'common/batched'
import { ensureArray } from 'common/ensure-array'
import { hydrateDocument, prepareDocument } from 'common/offline-data-service'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { run } from 'js-coroutines'

let updating = Promise.resolve(true)

export function waitForUpdates() {
    return new Promise((resolve) => {
        setTimeout(async () => {
            updating.finally(resolve)
        }, 100)
    })
}

let number = 0

export function trackAsync(fn) {
    return async function (...params) {
        let promise = fn(...params)
        trackPromise(promise)
        return await promise
    }
}

export function trackPromise(promise) {
    const e = new Error()
    const current = updating
    let finished = false
    const tracked = waitForPromise().finally(() => (finished = true))
    updating = Promise.race([
        tracked,
        new Promise((resolve) => {
            setTimeout(() => {
                if (!finished) {
                    // eslint-disable-next-line no-console
                    console.warn('Never finished promise', e.stack)
                }
                resolve()
            }, 30000)
        }),
    ])
    number++
    raise('tracking-promise')
    promise.then(
        () => number--,
        () => number--
    )
    return promise

    function waitForPromise() {
        return current.then(
            () => promise,
            () => promise
        )
    }
}

export async function updateDocumentIdle(documents) {
    return await run(updater(documents))
}

export async function updateDocument(documents) {
    return await trackPromise(run(updater(documents)))
}



export async function immediateUpdateDocument(documents) {
    const steps = {hydrate: 0, applyChanges: 0, count: 0, hydrated: 0, hasHydrated: 0}
    documents = await Promise.resolve(documents)
    for (let document of ensureArray(documents).compact(true)) {
        try {
            steps.count++
            let time = performance.now()
            await hydrateDocument(document)
            steps.hydrate += performance.now() -time
            const info = { id: document._id, document }
            if (!info.document.sendMessageAsync) continue
            time = performance.now()
            await documentChangesApply(info)
            steps.applyChanges += performance.now() - time
            time = performance.now()
            await info.document.sendMessageAsync('hydrated')
            steps.hydrated += performance.now() - time
            // time = performance.now()
            // await info.document.sendMessageAsync('hasHydrated')
            // steps.hasHydrated += performance.now() - time
        } catch (e) {
            console.error(e)
        }
    }
    // eslint-disable-next-line no-console
    console.log(steps)
    return documents
}

function* updater(documents) {
    documents = yield Promise.resolve(documents)
    for (let document of ensureArray(documents).compact(true)) {
        try {
            yield hydrateDocument(document)
            const info = { id: document._id, document }
            if (!info.document.sendMessageAsync) continue
            yield documentChangesApply(info)
            yield info.document.sendMessageAsync('hydrated')
            // yield info.document.sendMessageAsync('hasHydrated')
        } catch (e) {
            console.error(e)
        }
    }
    return documents
}

export async function getDocumentWithChanges(id) {
    const info = { id }
    await documentRetrieve(info)
    if (!info.document) return null
    await documentChangesApply(info)
    await initialize(info.document)
    await info.document.sendMessageAsync('hydrated')
    await info.document.sendMessageAsync('hasHydrated')
    return info.document
}

export async function getInstance(id, actionId, document) {
    const info = {
        id,
        document,
    }
    if (!info.document) {
        await documentRetrieve(info)
        if (!info.document) {
            info.document = {}
        }
        await initialize(info.document)
        await documentChangesApply(info)
    }
    const actionInfo = { ...info, context: {}, actionId }
    await documentContextRetrieve(actionInfo)
    actionInfo.context.$trackId = actionInfo.context.$trackId || generate()
    const action = info.document.behaviours.instances.formAction?.find(
        (i) => i.id === actionId
    )
    let baseInstance = info.document
    if (action?.storeIn) {
        baseInstance = Object.get(info.document, action.storeIn, true) || {}
        Object.set(info.document, action.storeIn, baseInstance)
    }
    Object.setPrototypeOf(actionInfo.context, baseInstance)
    const result = {
        instance: actionInfo.context,
        save: debounce(
            (...params) => documentContextStore(actionInfo, ...params),
            300
        ),
        async reset() {
            result.save.flush()
            for (let key of Object.keys(actionInfo.context)) {
                delete actionInfo.context[key]
            }
            await documentContextStore(actionInfo)
        },
        document: info.document,
        async commit(
            toState,
            command = 'setData',
            controller = { notSet: true },
            $create
        ) {
            if ($create === undefined) {
                if (!result.instance.$created) {
                    $create = result.document
                }
            }
            toState = toState || result.instance._behaviours._state
            result.save.flush()
            await documentChangesStore(
                {
                    $trackId: result.instance.$trackId,
                    $create: prepareDocument($create),
                    actionId,
                    id,
                    instance: result.instance,
                    toState,
                    command,
                    controller,
                },
                id
            )
            await cleanUpInstance(id, actionId)

            batch(() => raise(`data.updated.${id}`, id))
        },
    }
    return result
}

export async function cleanUpInstance(id, actionId) {
    const info = {
        id,
        actionId,
    }

    await documentContextRemove(info)
}
