/**
 * @module dynamic/awe-library/fields
 */
import { get } from 'common/offline-data-service'
import { initialize } from 'alcumus-behaviours'
import { useAsync } from 'common/use-async'
import { lookup } from 'dynamic/awe-library/lookup-fields'
import { getTypeAndInitialise } from 'dynamic/awe-library/use-types'

/**
 * @interface FieldDefinition
 * @global
 * @description A definition of a field/question.  An object implementing this
 * interface may store lots of other information based on its type
 *
 * @property {string} [name] - the database field that will be updated by this question, blank if not stored
 * @property {string} type - the type of this definition
 */

/**
 * @interface BehaviourKeys
 * @description  A lookup map of behaviour name to an array of instances of that behaviour
 */

/**
 * @interface Behaviours
 * @global
 * @description  The behaviours associated with a type
 * @property {BehaviourKeys} instances - an object containing the instances of behaviours associated with a type, the key is the behaviour name and the value is an array of instances of that behaviour
 *
 * @function Behaviours#sendMessage
 * @description Call the specified function on any methods attached
 * to behaviours on the document
 * @param {string} message - the name of the message to send
 * @param {...*} [params] - the parameter for the method
 * @returns {*} the result of calling the method on all of the behaviours
 *
 * @function Behaviours#sendMessageAsync
 * @description Call the specified function on any methods attached
 * to behaviours on the document and return a promise for the value
 * @param {string} message - the name of the message to send
 * @param {...*} [params] - the parameter for the method
 * @returns {Promise<*>} a promise for the result of calling the method on all of the behaviours
 */

/**
 * @interface DocumentDefinition
 * @global
 * @description The definition of a document or application type
 * @property {Behaviours} behaviours - the behaviours of this document
 * @property {string} name - the name of this definition
 * @property {string} _id - the unique ID of this document or application
 */

/**
 * Returns a document type associated with a field definition.
 *
 * Both topics and lookup fields have related types, this returns
 * the type to which they refer.
 *
 * @param {FieldDefinition} field - the field to return the value of
 * @returns {Promise<DocumentDefinition>} a promise for the document definition
 */
export async function getTypeFromField(field) {
    let type
    if (field.topic) {
        const topic = await get(field.topic)
        const concern = topic.concerns.find((c) => c.name === field.concern[0])
        if (concern) {
            type = concern.defaultType
        }
    }
    if (field.lookupType) {
        type = field.lookupType
    }
    return type
}

async function subFields(fields, route = []) {
    if (route.length > 2) return []
    const output = []
    for (let field of fields) {
        try {
            let type = await getTypeFromField(field)
            if (type) {
                const subType = await get(type)
                await initialize(subType)
                const fields = subType
                    .sendMessage('fields', [])
                    .filter((f) => !f.name.startsWith('_') && f.name.length >= 3)
                output.push({ ...field, name: [...route, field.name].join('.') })
                output.push(...(await subFields(fields, [...route, field.name])))
            } else {
                output.push({ ...field, name: [...route, field.name].join('.') })
            }
        } catch (e) {
            //
        }
    }
    return output
}

/**
 * Returns a list of fields associated with the source provided.
 * The source may be an existing field list, a type definition or the
 * string ID of a type.  The result is a list of the associated fields
 * available on the type.
 *
 * The results include fields in related tables.
 *
 * @param {DocumentDefinition|string|Array<FieldDefinition>} source - the source to retrieve fields from
 * @returns {Promise<Array<FieldDefinition>>} a promise for an array of field definitions
 */
export async function getFieldList(source) {
    if (Array.isArray(source)) {
        return await subFields(source)
    }
    let instance
    if (source && typeof source === 'object') {
        instance = source
    } else if (source) {
        instance = await getTypeAndInitialise(source)
    }
    if (!instance) return []
    const fields = instance.sendMessage('fields', [])
    return await subFields(fields)
}

/**
 * Provides a hook to access all of the fields of a type or
 * a list of existing fields, the result includes field in related
 * tables.
 * @param {Array<FieldDefinition>} [sourceFields] - a list of source fields
 * @param {string|DocumentDefinition} [type] - a type to retrieve the fields from
 * @returns {Array<FieldDefinition>} returns the list of fields (or an empty array until available)
 */
export function useFieldList(sourceFields, type) {
    return useAsync(
        async () => {
            return await getFieldList(sourceFields || type)
        },
        [],
        JSON.stringify({
            type,
            hasInstance: !!sourceFields && sourceFields.length,
        })
    )
}

/**
 * Retrieves the definition of a question based on a "property path"
 * string that may dive into related tables. e.g. manager.primarySite.name
 *
 * The call returns the question definition AND the associated document
 *
 * @param {string} question - property path of the question
 * @param {DocumentDefinition} document - the document to which the first part of the property path syntax belongs
 * @returns {Array} the question and document looked up as two members of an array
 */
export function useQuestion(question, document) {
    return useAsync(
        async () => {
            if (typeof question !== 'string') return [question, document]
            const parts = question.split('.')
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i]
                const field = lookup(document)[part]
                if (!field) return [null, document]
                let subType = await getTypeFromField(field)
                if (!subType) return [null, document]
                document = await getTypeAndInitialise(subType)
            }
            return [lookup(document)[parts[parts.length - 1]], document]
        },
        [null, document],
        question
    )
}
