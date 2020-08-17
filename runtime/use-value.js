import {useInstanceContext} from './contexts'
import {useLocalEvent} from 'common/use-event'
import { useCallback, useState } from 'react'
import {useLookup} from './use-lookup'
import { ensureArray } from 'common/ensure-array'

export function useFieldByName(fieldName, defaultValue) {
    const {instance} = useInstanceContext()
    const [value, setValue] = useState(instance[fieldName])
    useLocalEvent(`question.exit.${instance?._id}`, check)
    useLocalEvent(`bound-change.${fieldName}`, dynamicChange.debounce(1000))
    return value || defaultValue

    function check(question) {
        if (question.name === fieldName) {
            setValue(instance[fieldName])
        }
    }

    function dynamicChange() {
        setValue(instance[fieldName])
    }
}

export function useFieldByNameChangeOnBlur(fieldName, defaultValue, refresh) {
    const fields = ensureArray(fieldName)
    const { instance } = useInstanceContext()
    const [value, setValue] = useState(fields.map(fieldName=>instance[fieldName]))
    const check = useCallback(doCheck.debounce(100), [instance, fieldName, value])

    useLocalEvent(`question.exit.${instance?._id}`, check)
    useLocalEvent(fields.map(field=>`updated-value.${field}`), check)
    return (Array.isArray(fieldName) ? value : value[0]) || defaultValue

    function doCheck(question) {
        if (fields.includes(question?.name)) {
            const newValues = fields.map(fieldName=>instance[fieldName])
            if(!Object.isEqual(newValues, value)) {

                if(refresh) {
                    refresh()
                } else {
                    setValue(newValues)
                }
            }
        }
    }
}

export function useFieldById(id, defaultValue) {
    const lookup = useLookup()
    const fieldName = lookup[id]?.name
    return useFieldByName(fieldName, defaultValue)
}
