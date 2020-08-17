import {useRef} from 'react'
import {useLocalEvent} from 'common/use-event'
import {useRefresh} from 'common/useRefresh'
import {fields, processQuery} from 'common/offline-data-service/query'

export function AND(target = {}, withSource = {}) {
    if (target.$and) {
        target.$and.push(withSource)
        return target
    }
    const original = {...target}
    return {$and: [original, withSource].filter((v) => !Object.isEmpty(v))}
}

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
