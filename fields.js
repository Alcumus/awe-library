import { get } from 'common/offline-data-service'
import { initialize } from 'alcumus-behaviours'
import { useAsync } from 'common/use-async'
import { lookup } from 'dynamic/awe-library/lookup-fields'
import { getTypeAndInitialise } from 'dynamic/awe-library/use-types'

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
