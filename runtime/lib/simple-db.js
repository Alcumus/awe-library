import { get } from 'common/offline-data-service'
import {
    getContext,
    sendChanges,
    setContext,
} from 'dynamic/awe-runner-plugin/lib-runner/api'
import { handle, raiseAsync } from 'common/events'

import { getItem, using } from 'common/using-local-storage-key'
import { showNotification } from 'common/modal'
import { initialize } from 'common/offline-data-service/behaviour-cache'

export const {
    resetStorage,
    documentRetrieve,
    documentContextRetrieve,
    documentContextRemove,
    documentContextStore,
    documentChangesStore,
    documentChangesApply,
} = (window.documentHandler =
    window.documentHandler ||
    handle(
        class Document {
            async documentRetrieve(info) {
                info.document = await get(info.id)
                if (info.document?._behaviours) {
                    await initialize(info.document)
                    await info.document.sendMessage('willRetrieve')
                } else {
                    showNotification(`Error: could not open the document`)
                    throw new Error(`No document ${info.id}`)
                }
            }

            async documentContextRetrieve(info) {
                info.context = await getContext(info.id, info.actionId)
            }

            async documentContextRemove(info) {
                localStorage.removeItem(`${info.id}-${info.actionId}`)
                setContext(info.id, info.actionId, {})
            }

            async documentContextStore(info) {
                info.context.$refId = await setContext(
                    info.id,
                    info.actionId,
                    info.context
                )
            }

            async resetStorage(id, actionIds = []) {
                await using(
                    `changes-${id}`,
                    (changes) => {
                        changes.length = 0
                    },
                    []
                )
                for (let actionId of actionIds) {
                    await documentContextRemove({ id, actionId })
                }
            }

            async documentChangesStore(record, id) {
                await using(
                    `changes-${id}`,
                    (changes) => {
                        changes.push(record)
                    },
                    []
                )
                await changeEnqueue(record)
            }

            async documentChangesApply({ id, document }) {
                if (!document) return
                await initialize(document)
                for (let { toState, instance } of await getItem(
                    `changes-${id}`,
                    []
                )) {
                    Object.assign(document, instance)
                    delete document.$trackId
                    toState && (await document.behaviours.setState(toState))
                }
                await document.sendMessage('willRetrieve')
            }

            async aweChangeComplete({ id, trackId }) {
                await using(
                    `changes-${id}`,
                    (changes) => {
                        return changes.filter(
                            (change) => change.instance.$trackId !== trackId
                        )
                    },
                    []
                )
            }
        }
    ))

async function changeEnqueue(record) {
    await using(
        `awe-send-queue`,
        (queue) => {
            let list = (queue[record.id] = queue[record.id] || [])
            list.push(record)
            processQueue()
        },
        {}
    )
}

handle('hydrate.*', async (document) => {
    if(!document) return
    await raiseAsync(`documentChangesApply`, { id: document._id, document })
})

let retry = false

const processQueue = async function processQueue() {
    if (!navigator.onLine) return
    if (window.processingQueue) {
        retry = true
        return
    }
    retry = false
    window.processingQueue = true
    try {
        let documentId
        let queue
        while ((queue = await getItem(`awe-send-queue`, {})) && (documentId = Object.keys(queue)[0])) {
            let changes = queue[documentId] || []
            if (changes.length) {
                await sendChanges(documentId, changes)
            }
            await using(
                `awe-send-queue`,
                async function(queue) {
                    queue[documentId] = (queue[documentId] || []).filter(
                        (f) => !changes.find((c) => c.$trackId === f.$trackId)
                    )
                    !queue[documentId].length && delete queue[documentId]
                },
                {}
            )
        }
    } catch (e) {
        console.error(e)
    } finally {
        window.processingQueue = false
        if (retry) processQueue()
    }
}.debounce(300)
setTimeout(processQueue, 100)

window.addEventListener('online', processQueue)
