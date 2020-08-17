import React, { useEffect, useRef } from 'react'

import { generate } from 'shortid'
import { noop } from 'common/noop'
import { getLocation } from 'common/routing'
import { getActiveClient } from 'common/global-store/api'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { useCachedAsync } from 'common/use-async'
import { handle } from 'common/events'
import { showURLInModal } from 'common/embedded-routes'
import { knownUrls } from 'dynamic/awe-library/runtime/app-urls'
import { getType } from 'dynamic/awe-library/runtime/records'

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

export async function getFields(type) {
    let referenceType = typeof type === 'object' ? type : await getType(type)
    await initialize(referenceType)
    return referenceType.sendMessage('fields', [])
}
export function isNotBlank(f) {
    return f && !!f.trim()
}

export function extractFieldName(f) {
    return f && f.name
}

export function topLevelField(f) {
    return (
        (f && f.name && !f.name.includes('.')) ||
        (f && typeof f === 'string' && f.includes('.'))
    )
}

export function fieldNameIs(name) {
    return function (f) {
        return f && f.name === name
    }
}

export function cleanLabel(label = '') {
    label = label.split('.').reverse().join(' of ')
    return label.replace(/^\$/, '').spacify().titleize()
}

export function delay(ms) {
    return new Promise(function (resolve) {
        setTimeout(resolve, Math.max(0, ms))
    })
}

export const properties = {}

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

export function getLabelFor(question) {
    return question.inputLabel || (question.name || '').spacify().titleize()
}

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
