import React from 'react'
import { sortColumnsToOrder } from 'dynamic/awe-runner-plugin/behaviours/form/question-types/data/document-list'
import { AND, useQuery } from 'dynamic/awe-library/runtime/query'
import {
    useRecordsForType,
    useStreamedResultsForType,
} from 'common/offline-data-service/records'
import {get} from 'common/offline-data-service'
import { useInstanceContext } from 'dynamic/awe-library/runtime/contexts'
import { useLookup } from './use-lookup'
import { useCachedAsync } from 'common/use-async'
import { getFields } from 'dynamic/awe-library/runtime/utils'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { uiReady } from 'common/ui-ready'
import { useLocalEvent } from 'common/use-event'
import { useRefresh } from 'common/useRefresh'
import { fieldNameIs } from 'dynamic/awe-library/utils'
import { ensureArray } from 'common/ensure-array'
import { useFieldByName, useFieldByNameChangeOnBlur } from 'dynamic/awe-library/runtime/use-value'
import { useType } from 'dynamic/awe-library/runtime/use-type'
import { getTopic } from 'dynamic/awe-library/runtime/topics'

const __ = {
    dataSourceFilter: '',
    sortColumns: [],
    searchFilterSource: '',
    detailView: '',
    concerns: [],
}

export function useDataSource(settings, where) {
    return _useDataSource(settings, where, useStreamedResultsForType)
}

export function useDataSourceAll(settings, where) {
    return _useDataSource(settings, where, useRecordsForType)
}

export function useDataSourceSettings(settings) {
    return (settings = typeof settings === 'string' ? useLookup()[settings] : settings)?.dataSource
}

function combineDataSourceWhereClauses(dataSource, where) {
    if(!dataSource) return where
    const dsWhere = dataSource.dataSourceFilter || dataSource.where
    if (where) {
        return AND(where, dsWhere)
    } else {
        return dsWhere
    }
}

function _useDataSource(settings, where, method = useStreamedResultsForType) {
    return settings && Inner()
    function Inner() {
        const dataSource = useDataSourceSettings(settings) || {}
        for(let query of dataSource.queryFields) {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            let value = ensureArray(useFieldByNameChangeOnBlur(query.localField)).compact(true)
            if(value.length >= 1) {
                where = { ...where, [query.field]: { $in: value } }
            }
        }
        const refresh = useRefresh()
        const instance = useInstanceContext()
        const query = useQuery(combineDataSourceWhereClauses(dataSource, where), instance.instance)
        const type = useType(dataSource?.dataType)
        const order = sortColumnsToOrder(dataSource?.sortColumns)
        const search = useFieldByName(dataSource?.searchFilterSource)
        useLocalEvent(`data-source-changed.${dataSource?.name}`, sourceChanged)
        const searchFields = useCachedAsync(
            'getSearchFields',
            async () => {
                if (!type) return
                if (!dataSource) return
                if (!dataSource.searchFields) return
                await uiReady()
                const targetFields = await getFields(type)
                return (
                    await Promise.all(
                        dataSource.searchFields
                            .map((field) => targetFields.find(fieldNameIs(field.field)))
                            .map(subFields)
                    )
                )
                    .compact(true)
                    .flatten()
            },
            [],
            settings.id,
            type?._id
        )
        if (search) {
            const words = search
                .split(' ')
                .map((s) => s.trim())
                .compact(true)
            const list = []
            const searcher = { $and: list }
            words.forEach((word) => {
                const or = []
                searchFields.forEach((field) => {
                    or.push({ [field]: { $like: `%${word}%` } })
                })
                list.push({ $or: or })
            })
            if (query.$and) {
                query.$and.push(...searcher.$and)
            } else {
                query.$and = searcher.$and
            }
        }
        dataSource.currentFilter = query
        return Object.defineProperty(
            {
                results: method(type, query, order),
                type,
                instance,
                view: dataSource.displayView,
                detailedView: dataSource.detailView,
            },
            'filter',
            {
                get() {
                    return Object.clone(dataSource.currentFilter, true)
                },
            }
        )

        function sourceChanged() {
            refresh()
        }

        async function subFields(field) {
            if (field.topic) {
                const topic = await getTopic(field.topic)
                const concern = topic.concerns.find((c) => c.name === field.concern[0])
                if (concern) {
                    return concern.searchFields.map((search) => `_ci__info+${field.name}+rows[0]+${search}`)
                }
            }
            if (field.lookupType) {
                const type = await get(field.lookupType)
                await initialize(type)
                const fields = type.sendMessage('fields', []).filter((f) => !f.name.startsWith('_') && f.name.length >= 3)
                return fields.map((search) => `_ci__info+${field.name}+rows[0]+${search.name}`)
            } else {
                return `_ci_${field.name}`
            }
        }
    }
}
