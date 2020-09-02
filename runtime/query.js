/**
 * @module dynamic/awe-library/runtime/query
 */
import {useRef} from 'react'
import {useLocalEvent} from 'common/use-event'
import {useRefresh} from 'common/useRefresh'
import {fields, processQuery} from 'common/offline-data-service/query'

/**
 * ANDs together two queries
 * @param {WhereDefinition} [target={}] - the initial where clause
 * @param {WhereDefinition} [withSource={}] - the second where clause
 * @returns {WhereDefinition} the two queries ANDed together
 * @constructor
 */
export function AND(target = {}, withSource = {}) {
    if (target.$and) {
        target.$and.push(withSource)
        return target
    }
    const original = {...target}
    return {$and: [original, withSource].filter((v) => !Object.isEmpty(v))}
}

/**
 * Resolves a query (which may use {parameters}) using an instance
 * creating a final where clause to be used with the database
 * @param {WhereDefinition} query - the query to be resolved
 * @param {Document} instance - the instance to resolve parameters
 * @returns {WhereDefinition} a where clause with parameters resolved
 */
export function useQuery(query, instance) {
    const refresh = useRefresh()
    const trackFields = useRef()
    let cleaned = processQuery(query, instance)
    trackFields.current = fields
    useLocalEvent(`question.exit.${instance?._id}`, (question) => {
        if (trackFields.current[question.name]) {
            refresh()
        }
    })
    return cleaned
}
