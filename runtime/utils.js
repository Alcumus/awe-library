/**
 * @module dynamic/awe-library/runtime/utils
 */
import React, { useEffect, useRef } from 'react'

import { generate } from 'shortid'
import { noop } from 'common/noop'
import { getLocation } from 'common/routing'
import { getActiveClient } from 'common/global-store/api'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { useCachedAsync } from 'common/use-async'
import { showURLInModal } from 'common/embedded-routes'
import { getType } from 'dynamic/awe-library/runtime/records'

/**
 * @callback CheckFunction
 * @description a function that can be called to perform a defined test
 * @global
 * @returns {boolean} true if the check passes
 */

/**
 * Returns a function that can be used to check if a component
 * is still mounted.
 *
 * This  is useful in async functions
 * @returns {CheckFunction} a function that returns <code>true</code>
 * if the component is still mounted.
 */
export function useLoaded() {
    const ref = useRef({ loaded: true })
    useEffect(() => {
        ref.current.loaded = true
        return () => {
            ref.current.loaded = false
        }
    })
    return () => ref.current.loaded
}

/**
 * Get all of the fields associated with a document (not only visible ones)
 * @param {Document|DocumentDefinition|string} type - the type to check
 * @returns {Promise<Array<FieldDefinition>>} the fields associated with the document
 */
export async function getFields(type) {
    let referenceType = typeof type === 'object' ? type : await getType(type)
    await initialize(referenceType)
    return referenceType.sendMessage('fields', [])
}

/**
 * Returns whether an item with a name is blank or if the parameter
 * is a string, tests that it is not blank
 * @param {string|FieldDefinition} fieldOrName
 * @returns {boolean} true if the name or string is not blank
 */
export function isNotBlank(fieldOrName) {
    return fieldOrName && !!fieldOrName.trim()
}

/**
 * Extracts the name of a field
 * @param {FieldDefinition} field
 * @returns {string} the name
 */export function extractFieldName(field) {
    return field && field.name
}

/**
 * A filter that tests a field and returns true if the field is
 * at the top level of a chain
 * @param {string|FieldDefinition} field - the field to be tested
 * @returns {boolean} true if the field tested is a top level field
 */
export function topLevelField(field) {
    return (
        (field && field.name && !field.name.includes('.')) ||
        (field && typeof field === 'string' && field.includes('.'))
    )
}

/**
 * Returns a predicate function that checks if a field name
 * is equal to the supplied value
 * @param {string} name - the name to check for
 * @returns {function} a predicate function that checks for the name
 */
export function fieldNameIs(name) {
    return function (f) {
        return f && f.name === name
    }
}

/**
 * Creates a label from a field name type
 * @param {string} label - the label to check
 * @returns {string} the cleaned label
 */
export function cleanLabel(label = '') {
    label = label.split('.').reverse().join(' of ')
    return label.replace(/^\$/, '').spacify().titleize()
}

/**
 * Returns a promise for a delay in milliseconds
 * @param {number} ms - the number of milliseconds to wait for
 * @returns {Promise<void>} a promise that will be satisfied when the delay expires
 */
export function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, Math.max(0, ms))
    })
}

/**
 * Default properties that can be set for periods of time
 * or used as a bag of configuration
 * @type {{}}
 */
export const properties = {}

/**
 * Sets a value in an object for a period of time
 * @param {string} property - the property to set
 * @param {*} value - the value to set on the property
 * @param {object} [obj=properties] - the object on which to set the value
 * @param {number} [time=750] - the time to set the value for in ms
 * @returns {function} A function to retrieve the value at the present moment
 */
export function setForTime(
    property = 'default',
    value,
    obj = properties,
    time = 750
) {
    const id = generate()
    obj[property] = value
    obj[`${property}_setter`] = id
    setTimeout(() => {
        if (obj[`${property}_setter`] === id) {
            delete obj[property]
            delete obj[`${property}_setter`]
        }
    }, time)
    return () => {
        return obj[property]
    }
}


/**
 * A hook that given a type and a field name, returns the field definition
 * of the field, returns null before it is resolved.
 *
 * @param {DocumentDefinition|Document|string} type - the type to retrieve the value for
 * @param {string} field - the name of the field to retrieve (its stored name)
 * @returns {FieldDefinition} - the definition of the field
 */
export function useFieldDefinition(type, field) {
    return useCachedAsync(
        'fieldDef',
        async () => {
            const referenceType = await getType(type)
            if (!referenceType) return null
            const { result: fields } = await referenceType.sendMessage(
                'allQuestions',
                'all',
                []
            )
            return fields.concat(referenceType.sendMessage('getFields', [])).find(fieldNameIs(field))
        },
        null,
        { type, field }
    )
}

export function createDefaultQuery(...parts) {
    return {
        $and: [...notDeletedAndCurrentClient(), ...parts.compact(true)],
    }
}

export function notDeletedAndCurrentClient() {
    return [NOT_DELETED, { client: getActiveClient() }]
}

/**
 * Retrieves the label for a question, this uses the user supplied label or generates one
 * @param {FieldDefinition} question - the question whose label is required
 * @returns {string} the label to use
 */
export function getLabelFor(question) {
    return question.inputLabel || (question.name || '').spacify().titleize()
}

/**
 * Processes a field value and if its a date, show the date as relative or a formatted
 * value
 * @param {*} value - the value to format
 * @param {boolean} date - should the value be potentially treated as a date
 * @returns {string} A formatted value
 */
export function process(value, date) {
    if (typeof value !== 'string') return value
    if (date && isDate(value)) {
        const date = new Date(value)
        return date.hoursAgo() < 12
            ? `${date.short()} (${date.relative()})`
            : date.short()
    }
    return ('' + value).spacify().titleize()
}

function isDate(value) {
    try {
        let test = new Date(value)
        if (+test === value) return true
        return test.toISOString() === value
    } catch (e) {
        return false
    }
}

/**
 * @callback NavigationFunction
 * @global
 * @description A function that navigates to a document
 * @param {...*} params - parameters to be passed to the callback function used in the specification
 */

/**
 * @description creates a navigation function to a document id
 * @param {string} id - the id of the document to navigate to
 * @param {function} [cb] - a callback that is invoked if the goto is called
 * @param {function} [navigate] - a navigate function to use as an override
 * @param {object} [location] - an object to override the standard location with
 * @param {Array<Mode>} [modes] - an array of "modes" to set, this allows
 * the conditional elements of the target document to be activated or
 * deactivation
 * @property {EmbedFunction} embed - call to embed the document in a modal
 * @returns {NavigationFunction} the function to navigate to the document
 */
export function goto(id, cb = noop, navigate, location, modes = []) {
    let modeString = modes.map(mode => `${encodeURIComponent(mode.mode)}=${encodeURIComponent(mode.value)}`).join('&')
    return function (...params) {
        navigate = navigate || getLocation().navigate
        location = location || getLocation().location

        navigate(`/sys/${encodeURIComponent(id)}?${modeString}`, {
            state: { returnTo: location.href, previous: location.state },
        })
        cb(...params)
    }
}

goto.callback = function (cb, navigate, location, modes = []) {
    return (id) => goto(id, cb, navigate, location, modes)
}

goto.embed = function(options, modes) {
    let modeString = modes.map(mode=>`${encodeURIComponent(mode.mode)}=${encodeURIComponent(mode.value)}`).join('&')
    return (id)=>{
        return function() {
            return showURLInModal(`/sys/${encodeURIComponent(id)}?${modeString}`, options)
        }
    }
}

export const NOT_DELETED = {
    $or: [{ _deleted: null }, { _deleted: 0 }, { _deleted: false }],
}
