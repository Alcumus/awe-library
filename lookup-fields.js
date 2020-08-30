/**
 * @module dynamic/awe-library/lookup-fields
 */

import memoize from 'memoizee'
import { initialize } from 'alcumus-behaviours'

const processLookup = memoize(
    function (id, document) {
        initialize(document)
        const [, questions] = document.sendMessage('allQuestions', 'all', [])
        let lookup = { _all: questions }
        for (let question of questions) {
            if (question.name) {
                lookup[question.name] = question
            }
            lookup[question.id] = question
        }
        return lookup
    },
    { maxAge: 3000, length: 1 }
)

/**
 * @interface FieldLookup
 * A lookup for fields/questions in a document or application type.
 * This is an index based on both unique ID of the question `.id` and the
 * name of the question
 */

/**
 * Provides a lookup of all of the fields in a document type
 * @param {DocumentDefinition} document
 * @returns {FieldLookup} the lookup of the fields (using both .id and .name)
 */
export function lookup(document) {
    return processLookup(document._id, document)
}
