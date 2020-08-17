import events from 'alcumus-local-events'
import { resolveValue, resolveValueAsFunction } from 'common/resolve-value'
import { questionTypeDef } from 'dynamic/awe-plugin/document-behaviours/form/get-types'
import { ensureArray } from 'common/ensure-array'
import { getType, getTypes } from 'dynamic/awe-library/api'
import useAsync, { useCachedAsync } from 'common/use-async'
import * as Behaviours from 'alcumus-behaviours'
import React from 'react'
import uniq from 'lodash/uniq'
import { handle } from 'common/events'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { useRefresh } from 'common/useRefresh'
import { useDocumentTypeContext } from './document-type-context'
import { useLookup } from 'dynamic/awe-library/runtime/use-lookup'
import { lookup } from 'dynamic/awe-library/runtime/lookup'
import { uiReady } from 'common/ui-ready'
import { getTopic } from 'dynamic/awe-library/runtime/topics'

export function getTypeFor(idOrType) {
    try {
        const id = typeof idOrType === 'string' ? idOrType : idOrType._id
        return id.split(':')[1].split('/')[1].split('-types')[0].toLowerCase()
    } catch (e) {
        console.error(e)
        throw e
    }
}

export function legalDbCharacters(v = '') {
    return v.replace(/[^0-9A-Za-z_]+/gi, '')
}

export function optionLabel(v = '') {
    return v.spacify().titleize()
}

export function legalFieldNameCharacters(v = '') {
    return v.replace(/^_/, '').replace(/[^a-zA-Z0-9_]/g, '')
}

export function behaviour(definition, ...predicates) {
    const toRegister = definition.register
    delete definition.register
    if (toRegister) {
        Behaviours.register(definition.behaviour, toRegister, true)
    }
    events.emit('newConfig', {
        [definition.behaviour.toLowerCase()]: {
            ...definition.config,
            color: definition.color,
            caption: definition.caption,
        },
    })
    events.return('behaviours.awe', (list) => {
        for (let predicate of predicates) {
            if (!predicate(list, definition)) return
        }

        list.push(definition)
    })
    return definition
}

export function classification(...types) {
    return (list) => {
        return types.includes(list.type)
    }
}

export function unique(...others) {
    let rest = others.flatten()
    return (list, definition) => {
        return (
            list &&
            list.aweType &&
            ![...rest, definition.behaviour].some(
                ( i ) => !!list.aweType._behaviours.instances[i]
            )
        )
    }
}

function decorate(obj, withProps) {
    for (let [key, value] of Object.entries(withProps)) {
        Object.defineProperty(obj, key, {
            get() {
                return value
            },
            configurable: true,
        })
    }
    return obj
}

async function processFields(type, purpose, seen = {}) {
    let referenceType = await getType(type)
    if (!referenceType) return []
    await initialize(referenceType)
    const fields = referenceType.sendMessage('fields', [], purpose)
    const output = []
    for (let field of fields) {
        let subType = field.dataSource?.dataType || field.lookupType
        if (field.topic) {
            if (seen[field.topic] > 0) continue
            seen[field.topic] = (seen[field.topic] || 0) + 1
            const topic = await getTopic( field.topic )
            const concern = topic.concerns.find(
                ( c ) => c.name === ensureArray( field.concern )[0]
            )
            if (concern) {
                subType = concern.defaultType
            }
        }
        if (subType) {
            const subFields = await processFields(subType, purpose, seen)
            for (let subField of subFields) {
                output.push({
                    ...subField,
                    field: `_info.${field.name}.rows[0].${subField.field}`,
                    caption: `${field.name} > ${subField.caption}`,
                })
            }
        } else {
            if (!field.name.startsWith('_')) {
                output.push({ caption: field.name, field: field.name, type })
            }
        }
    }
    return output
}

export async function decorateFields(fields) {
    for (let field of fields) {
        if (field.$type) continue
        const $type = await getType(field.type)
        const $field = lookup($type)[field.name]
        decorate(field, { $type, $field })
    }
    return fields
}

Function.prototype.use = function (...params) {
    const fn = this
    return useCachedAsync(
        this.name,
        async () => {
            return await fn(...params)
        },
        null,
        JSON.stringify(params)
    )
}

export function use(fn, ...params) {
    return useCachedAsync(
        fn.name,
        async () => {
            return await fn(...params)
        },
        null,
        JSON.stringify(params)
    )
}

export function useGroupByFields(type) {
    return getAndDecorate.use(type) || []

    async function getAndDecorate() {
        const fields = (await processFields(type, 'groupBy')) || []
        return await decorateFields(fields)
    }
}

export async function getFields(type) {
    let referenceType = typeof type === 'object' ? type : await getType(type)
    await initialize(referenceType)
    return referenceType.sendMessage('fields', [])
}

export function useField(fieldName) {
    const lookup = useLookup()
    return lookup[fieldName]
}

export function useFields ( type, deep = false ) {
    return useAsync(
        // `getFieldsForType${deep}`,
        async () => {
            if (!type) return deep ? [{}, {}] : []
            await uiReady()
            let referenceType = Object.isObject( type )
                ? type
                : await getType( type )
            await initialize( referenceType )
            await referenceType.sendMessage( 'refresh' )
            if (deep) {
                const result = {}
                const linkFields = {}
                await referenceType.sendMessage( 'deepFields', result, linkFields )
                return [result, linkFields]
            } else {
                const result = []
                await referenceType.sendMessage( 'fields', result )
                return result
            }
        },
        deep ? [{}, {}] : [],
        type,
        // Date.now() / 15000 | 0
    )
}

export function questionType(typesOrFunction) {
    events.return('awe.question-types', resolveValueAsFunction(typesOrFunction))

    let types = ensureArray(resolveValue(typesOrFunction) || [])
    for (let type of types) {
        events.emit('newConfig', {
            [type.value.toLowerCase()]: {
                caption: type.label,
                color: type.color,
                sort: type.sort,
                map: type.map,
                icon: type.icon,
            },
        })
    }
}

export function trackComponent(typesOrFunction) {
    handle('awe.track-components', function (list) {
        list.push(...ensureArray(resolveValueAsFunction(typesOrFunction)()))
    })

    let types = ensureArray(resolveValue(typesOrFunction) || [])
    for (let type of types) {
        events.emit('newConfig', {
            [type.value.toLowerCase()]: {
                caption: type.label,
                color: type.color,
                sort: type.sort,
                map: type.map,
                icon: type.icon,
            },
        })
    }
}

export function eventSource(type, eventSource) {
    handle(`awe.event-source.${type}`, function (list, item, owner) {
        let result = eventSource({ item, owner }, list)
        if (Array.isArray(result)) {
            list.push(...result.filter((f) => !!f))
        } else if (typeof result === 'object') {
            list.push(...Object.values(result).filter((f) => !!f))
        }
    })
}

export function questionCaption(question, type) {
    type = type || questionTypeDef(question)
    return (
        (type.caption ? type.caption(question) : undefined) ||
        question.question.replace(/\s*<p><\/p>\s*/g, '') ||
        question.inputLabel ||
        question.name ||
        type.captionValue ||
        type.label
    )
}

export function hints(predicate, hintsOrFn) {
    hintsOrFn = resolveValueAsFunction(hintsOrFn)
    setTimeout(() => {
        events.on('awe.question-hints', function (event, info) {
            if (typeof predicate === 'function') {
                if (predicate( info.target, info.target, info )) {
                    info.hints.push.apply(
                        info.hints,
                        Array.isArray( hintsOrFn ) ? hintsOrFn : hintsOrFn()
                    )
                }
            } else {
                if (predicate === info.target.type) {
                    info.hints.push.apply(
                        info.hints,
                        Array.isArray( hintsOrFn ) ? hintsOrFn : hintsOrFn()
                    )
                }
            }
        } )
    } )
}

export function logErrorOnLongCall ( fn, delay = 3000 ) {
    return async function( ...params ) {
        const id = setTimeout( problem, delay )
        try {
            await fn( ...params )
        } catch (e) {
            console.error( e )
        } finally {
            clearTimeout( id )
        }

        function problem () {
            // eslint-disable-next-line no-console
            console.trace( 'timeout', ...params )
        }
    }


}

export function deepFields ( predicate, deepFieldFn ) {
    deepFieldFn = resolveValueAsFunction( deepFieldFn )
    setTimeout( () => {
        events.on( 'awe.deep-fields', async function( event, info ) {
            if (info.path.length > 2) return
            if (typeof predicate === 'function') {
                if (predicate( info.target, info.target, info )) {
                    await logErrorOnLongCall( deepFieldFn )( info )
                }
            } else {
                if (predicate === info.target.type) {
                    await logErrorOnLongCall( deepFieldFn )( info )
                }
            }
        } )
    } )
}

export function tabs(predicate, ...Components) {
    predicate = ensureArray(predicate)
    predicate.forEach((predicate) => {
        setTimeout(() => {
            for (let Component of Components.flatten()) {
                events.on('awe.editor.tabs', function (event, info) {
                    if (typeof predicate === 'function') {
                        if (predicate(info.type, info.selected, info)) {
                            if (
                                !info.Components.find(
                                    ( c ) => c.toString() === Component.toString()
                                )
                            )
                                info.Components.push( Component )
                        }
                    } else {
                        if (predicate === info.type) {
                            if (
                                !info.Components.find(
                                    ( c ) => c.toString() === Component.toString()
                                )
                            )
                                info.Components.push( Component )
                        }
                    }
                })
            }
        })
    })
}

export function tab(predicate, Component) {
    return (info) => {
        if (typeof predicate === 'function') {
            if (predicate(info.type, info.selected, info)) {
                if (
                    !info.Components.find(
                        ( c ) => c.toString() === Component.toString()
                    )
                )
                    info.Components.push( Component )
            }
        } else {
            if (predicate === info.type) {
                if (
                    !info.Components.find(
                        ( c ) => c.toString() === Component.toString()
                    )
                )
                    info.Components.push( Component )
            }
        }
    }
}

export function whenQuestionTypeIs(...questionType) {
    return (type, selected) => {
        return type === 'question' && questionType.includes(selected.type)
    }
}

export function whenTrackComponentIs(...trackType) {
    return (type, selected) => {
        return type === 'track' && trackType.includes(selected.type)
    }
}

export function whenQuestionMatches(predicate = () => true) {
    return (type, selected) => {
        return (
            type === 'question' &&
            predicate( questionTypeDef( selected ), selected )
        )
    }
}

export function whenQuestionHasHint(hint) {
    return (type, selected) => {
        return type === 'question' && selected?.hints?.[hint]
    }
}

export function isNotBlank ( f ) {
    return (
        (f && f.name && !!f.name.trim()) ||
        (f && typeof f === 'string' && !!f.trim())
    )
}

export function extractFieldName ( f ) {
    return f && f.name
}

export function basicField ( fn = () => true ) {
    return function( item ) {
        return !/(^\$|_)|(\.\$|_)/.test( typeof item === 'string' ? item : item.name ) && fn( item )
    }
}

export function fieldBelongsLocally ( fields ) {
    const lookup = fields.groupBy( 'name' )
    return function( field ) {
        const name = typeof field === 'string' || field?.name
        if (!name) return false
        switch (lookup[name]?.[0]?.type) {
            case 'subForm':
            case 'array':
                return false
        }
        const parts = name.split( '.' )
        if (parts.length === 1) return true
        switch (lookup[parts[0]]?.[0]?.type) {
            case 'subForm':
            case 'array':
                return true
        }
        return false
    }
}

export function topLevelField ( f ) {
    return (
        (f && f.name && !f.name.includes( '.' )) ||
        (f && typeof f === 'string' && !f.includes( '.' ))
    )
}

export function fieldNameIs ( name ) {
    return function( f ) {
        return f && f.name === name
    }
}

export function getStates(instance) {
    const { type } = useDocumentTypeContext()
    return uniq(
        instance
            .sendMessage( 'availableStates',
                [type.defaultState || 'default'],
                instance.document,
                instance
            )
            .flatten()
    ).filter(isNotBlank)
}

export function returnValue(v) {
    return v
}

export function useTables(id) {
    const refresh = !id && useRefresh()
    return useCachedAsync(
        'getTables',
        async () => {
            const types = await getTypes()
            const groups = types
                .filter( ( t ) => !!t.database && !!t.table )
                .groupBy(
                    ( type ) =>
                        `${type.database.toLowerCase()}/${type.table.toLowerCase()}`
                )
            const results = await Promise.all(
                Object.keys(groups).map(async (key) => {
                    const list = groups[key].map( 'name' ).join( ', ' )
                    const fields = []
                    for (let item of groups[key]) {
                        await initialize( item )
                        item.sendMessage( 'fields', fields )
                    }
                    const ref = groups[key][0]
                    return {
                        value: key,
                        label: `${ref.database} / ${ref.table} (${list})`,
                        fields,
                        types: groups[key],
                    }
                })
            )
            return Object.assign(results.sortBy('label'), { _loaded: true })
        },
        [],
        id,
        refresh.id
    )
}

export function isStandardField(f) {
    return f && f.name && !/^[$_]/.test(f.name)
}

export function isStoredInRecord(f) {
    return !!f.name
}
