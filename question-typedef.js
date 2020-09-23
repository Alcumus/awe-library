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
 * @function
 * @returns {Function} the function to call to get the lookup types
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
 * @property {string} [group=""] - the group for the question in the ui, organises the ui into sections
 * The groups can be: "control", "layout", "create", "display" - no group puts
 * the question in the data capture section.
 * @property {JSX.Element} icon - an icon to use for the question
 * @property {function(instance):string} [caption] - a function to extract a caption for the question for display in the editor
 * @property {ConfigFunction} [config] - a config function to initialise an instance
 * @property {string} value - the type of the question
 * @property {string} label - the label to use for the question in lists
 * @property {string} color - the colour to use for the question icon
 * @property {string} description - a long description of the function of the question
 * @property {boolean} isSearchable - set to <code>false</code> to disable searching on the field or <code>true</code> to allow it
 * @property {boolean} [notRequired=false] - set to true if the field type cannot be required
 * @property {boolean} [stored=true] - must be <code>false</code> not falsey to disable storing the question (an instance doesn't have a name in this case)
 *
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
 * @function
 * @name allTypes
 * @description A function to retrieve all current question types
 * @returns {QuestionTypeDef} the currently available questions
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
