/**
 * @module dynamic/awe-library/question-type-def
 */

import memoize from 'memoizee'
import events from 'alcumus-local-events'
import noop from 'common/noop'

const allSeen = {}

/**
 * Provides a key value pair lookup for document types to their
 * definitions
 */
export const lookupTypes = memoize(
    function getTypes () {
        allTypes()
        return allSeen
    },
    { maxAge: 60000 },
)


/**
 * @interface QuestionTypeDef
 * @global
 * @description
 * A type definition for a question, includes whether this item
 * is stored, the icon etc.
 *
 * All properties are NOT fully documented below.
 *
 * @property {boolean} stored - is === false when this type is not stored. Note falsey is NOT enough, it must be explicitly boolean false
 * @property icon - an icon to use for the question
 * @property {string} caption - the caption to use
 * @property {ConfigFunction} [config] - a config function to initialise an instance
 */

/**
 * Given a question string type or FieldDefinition, returns the object that
 * describes that type
 * @param {string|FieldDefinition} type - the type of question to retrieve
 * @returns {QuestionTypeDef}
 */
export function questionTypeDef ( type ) {
    let definition = lookupTypes()[ typeof type === 'string' ? type : type.type ] || {}
    definition.config = definition.config || noop
    return definition
}

/**
 * @function allTypes
 * @description A function to retrieve all current question types
 * @returns [QuestionTypeDef] the currently available questions
 */
export const allTypes = memoize(
    function allTypes ( document ) {
        const types = []
        types.document = document
        let result = events.modify( 'awe.question-types', types )
        result.forEach( ( type ) => ( allSeen[ type.value ] = type ) )
        return result
    },
    { maxAge: 60000 },
)
