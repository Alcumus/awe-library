import { parse } from './conditional'
import { raise } from 'common/events'

function process(item, has) {
    let ok = true
    if (item.and) {
        ok = ok && item.and.every((i) => process(i, has))
    } else if (item.or) {
        ok = ok && item.or.some((i) => process(i, has))
    } else if (item.call) {
        ok = ok && has(item.call, true, item.param)
    } else {
        ok = ok && Object.keys(item).every((i) => has(i, false, item[i]))
    }
    return ok
}

const parseCache = {}

export function validConditional(conditional, instance) {
    if (typeof conditional === 'string')
        conditional = { condition: conditional }
    if (!conditional.condition) return true
    const parsed = (parseCache[conditional.condition] =
        parseCache[conditional.condition] || parse(conditional.condition))

    return process(parsed, (item, isFunction, value) => {
        if (item === 'notEmpty' && isFunction) {
            const fieldValue = Object.get(instance, value[0], true) || []
            return fieldValue.length !== 0
        } else if (item === 'isSet' && isFunction) {
            const fieldValue = Object.get(instance, value[0], true) || false
            return !!fieldValue
        } else if (isFunction) {
            const { result } = raise(`awe.execute.function.${item}`, {
                result: false,
                instance,
                params: value,
                item,
            })
            return !!result
        }
        const fieldValue = Object.get(instance, item, true)

        if (Array.isArray(fieldValue)) {
            return fieldValue.includes(value)
        } else {
            return fieldValue === value
        }
    })
}
