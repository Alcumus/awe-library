/**
 * @module dynamic/awe-library/runtime/question-value
 */
import { useAsync, useCachedAsync } from 'common/use-async'
import {lookup, lookupAsync} from './lookup'
import {get} from 'common/offline-data-service'
import {initialize} from 'common/offline-data-service/behaviour-cache'
import { handle, raise } from 'common/events'
import { ensureArray } from 'common/ensure-array'


async function getSubValue(document, parts) {
    if(parts.length > 1) {
        const question = lookup(document)[parts[0]]
        if(!question) return [null, null]
        const value = document[question.name]
        if(!value) return [null, null]
        if(Array.isArray(value)) {
            const output = []
            for(let entry of value) {
                let subDocument = await get(entry)
                await initialize(subDocument)
                output.push(await getSubValue(subDocument, parts.slice(1)))
            }
            return [output.map(o=>o[0]).filter(Boolean).join(', '), output.map(o=>o[1]).compact(true)[0]]
        } else {
            let subDocument = await get(value)
            await initialize(subDocument)
            return getSubValue(subDocument, parts.slice(1))
        }
    } else {
        let question = (await lookupAsync(document))[parts[0]]
        if (!question) return [null, null]
        return [document[question.name], question]
    }
}

/**
 * Given a document or the instance values of a document, retrieve the value
 * of a field and the question that created it
 * @param {Document|object} document - the set of values for the document
 * @param {string} field - the name of the field to retrieve (can include a property path string)
 * @returns {Promise.<Array>} A promise for an array with the results, the first element is the value, the second is the question
 * @example
 * const [value, question] = await getQuestionValue(document, 'some.field')
 */
export async function getQuestionValue(document, field) {
    const parts = field.split('.')
    return await getSubValue(document, parts)


}

/**
 * A hook to retrieve the value of a question and the question definition.  The definition
 * is useful for things like choice questions where you might want to look up the label
 * @param {Document|object} document - the set of values for the document
 * @param {string} field - the name of the field to retrieve (can include a property path string)
 * @returns {Array} the first element is the value, the second is the question
 * @example
 * const {instance: {instance}} = useInstanceContext()
 * const [value] = useQuestionValue(instance, 'fieldNameGoesHere')
 */
export function useQuestionValue(document, field) {
    return useAsync(async () => {
        return await getQuestionValue(document, field)
    }, [null, null], document?._id)
}

const parameter = /{([^}]+)}/g

/**
 * Given a document or instance, populates a string that uses { and } delimited
 * parameters to embed values from the document.  The document
 * can be a document value or the instance for the document
 * @param {Document|object} document - the set of values for the document
 * @param {string} text - the text to replace
 * @returns {Promise<string>} A promise for the string with the values replaced
 */
export async function getMappedString(document, text) {
    const matches = text.matchAll(parameter)
    let values = {}
    let fields = new Set()
    for(let [,match] of matches) {
        let parts = match.split(':')
        fields.add(parts[0])
        let [value, question] = await getQuestionValue(document, parts[0])
        value = ensureArray(value).map(v=> question?.choices?.find(c => c.value === v)?.label ?? v).join(',')
        values[parts[0]] = value || ''
    }
    return [text.replace(parameter, (_, capture) => {
        let parts = capture.split(':')
        let value = values[parts[0]]
        for(let i = 1; i < parts.length; i++) {
            let process = parts[i].split('=')
            ;({value} = raise(`string-process-${process[0]}`, {process, value}))
        }
        return value
    }), [...fields]]
}

handle('string-process-date', function(info) {
    if(!info.value) return
    let type = info.process[1] || 'medium'
    info.value = new Date(info.value)[type]()
})

handle('string-process-if', function(info) {
    info.value = (Array.isArray(info.value) && info.value.length > 0) || (!Array.isArray(info.value)  && info.value) ? info.process[1] : info.process[2] || ''
})

/**
 * A hook, that given a document or instance, populates a string that uses { and } delimited
 * parameters to embed values from the document.  The document
 * can be a document value or the instance for the document.
 *
 * The string parameters can have a function and parameters delimited by : the functions are
 * passed using a string-process-FUNCTIONNAME event and the standard ones are:
 *
 * date - that takes a format or long/short/medium (default)
 * if - which returns the first parameter if the value exists or the second if it does not.
 *
 * <code> The date is {someDate:date:short} {someText:Text is} {someText}</code>
 *
 * This can be used to embed values in HTML etc.
 *
 * @param {Document|object} document - the set of values for the document
 * @param {string} text - the text to replace
 * @param {string} refreshId - an id used to indicate that the process should run again
 * @returns {string} The resulting string having embedded the parameters
 */
export function useMappedString(document, text, refreshId='standard') {
    return useCachedAsync('getStringMapping', async ()=>{
        return await getMappedString(document, text)
    }, [text && text.includes('{') ? '' : text,[]], `${document._id}:${text}`, `${refreshId}-${document.__}`)
}
