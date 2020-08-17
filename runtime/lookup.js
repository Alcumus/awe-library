import memoize from 'memoizee'
import {initializeSync} from 'common/offline-data-service/behaviour-cache'
import {get} from 'common/offline-data-service'

function doLookup(id, document) {
    if (!document.behaviours) throw new Error('Document not initialized')
    const [, questions] = document.sendMessage('allQuestions', 'all', [])
    let lookup = {_all: questions}
    for (let question of questions) {
        if (question.name) {
            lookup[question.name] = question
        }
        lookup[question.id] = question
    }
    return lookup
}
const processLookup = memoize(doLookup, {maxAge: 16, length: 1})

const processLookupAsync = memoize(doLookupAsync, {maxAge: 2000, promise: true})

export async function doLookupAsync(id) {
    const type = await get(id)
    initializeSync(type)
    const [, questions] = type.sendMessage('allQuestions', 'all', [])
    let lookup = {_all: questions}
    for (let question of questions) {
        if (question.name) {
            lookup[question.name] = question
        }
        lookup[question.id] = question
    }
    return lookup
}

export async function lookupAsync(document) {
    return await processLookupAsync(document._settings?._id || document._settings?.$id || document._id)
}

export function lookup(document) {
    return processLookup(document._settings?._id || document._settings?.$id, document)
}
