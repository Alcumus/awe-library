import { store } from 'common/global-store'
import { useEvent, useLocalEvent } from 'common/use-event'
import events from 'alcumus-local-events'
import { generate } from 'shortid'
import debounce from 'lodash-es/debounce'
import { handle, raise } from 'common/events'
import { useRefresh } from 'common/useRefresh'
import { prevent } from 'common/prevent'

store.set( { aweSelected: null, aweRefresh: null } )

const refreshTabs = debounce( function refreshTabs () {
    events.emit( 'update-current-selection', 0 )
}, 10 )

export function select ( item = null, refresh = null, type, additional = {} ) {
    if (item) {
        item._selectId = item._selectId || generate()
    }
    return ( event = {} ) => {
        event.preventDefault && event.preventDefault()
        event.stopPropagation && event.stopPropagation()
        if (refresh && !refresh.functions.some( ( f ) => f === refreshTabs )) {
            refresh.functions.push( refreshTabs )
        }
        if ((store.aweSelected.value || {}).item === item) return item
        let selection = store.aweSelected.value || {}
        store.set({
            aweSelected: {
                item,
                id: item ? item._selectId : -1,
                refresh,
                type: type || (item ? item.type : 'none'),
                additional,
            },
        })

        item && raise(`selection.${item._selectId}`, null)
        selection && raise(`selection.${selection.id}`, null)
        raise('refresh-selected', null)
        return item
    }
}

handle('reset-selection', () => {
    selections.length = 0
})

handle('item-deleted', () => {
    setTimeout(() => {
        store.set({
            aweSelected: {
                item: null,
                id: -1,
                type: 'none',
            },
        })
        selections.length = 0
        store.flush()
    }, 50)
})

export function useSelect() {
    useEvent(events, 'app.navigate', select())
}

let selections = []
let storedList = null

export function getSelections(clear) {
    let result = { selections, list: storedList }
    if (clear) {
        selections = []
        storedList = null
    }
    return result
}

export function useSelection(item, refresh, type, additional = {}, list) {
    if (item) {
        item._selectId = item._selectId || generate()
    }
    const selectId = item?._selectId
    let selection = store.aweSelected.value || {}
    const executeSelect = select(item, refresh, type, additional)
    const localRefresh = useRefresh()
    const isSelected = selection.id === item._selectId
    const isInSelections = selections.includes(selectId)
    useLocalEvent('refresh-selected', check)
    if (selection.id === selectId && selection.item !== item) {
        selection.item = item
        raise( 'refresh-selected' )
    }
    useLocalEvent(`select.item.${selectId}`, executeSelect)
    return [
        selection.item === item,
        {
            onClick: prevent(onClick),
            'data-selectid': selectId,
        },
        executeSelect,
        selections.includes(selectId),
    ]

    function onClick(e) {
        if (storedList !== list) selections = []
        storedList = list
        if (list) {
            if (!e.shiftKey && !e.ctrlKey && !e.metaKey) selections = []
            if (!e.shiftKey || !list) {
                item && selections.push(selectId)
            } else {
                let idx = list.findIndex(
                    ( i ) => i._selectId === selections.slice( -1 )[0]
                )
                if (idx !== -1) {
                    let toIdx = list.indexOf( item )
                    if (toIdx !== -1) {
                        if (toIdx < idx) [toIdx, idx] = [idx, toIdx]
                        for (let i = idx; i <= toIdx; i++) {
                            selections.push( list[i]._selectId )
                        }
                    }
                }
            }
        }
        executeSelect()
    }

    function check() {
        let currentSelection = store.aweSelected.value

        if (
            (isSelected && currentSelection.id !== selectId) ||
            (!isSelected && currentSelection.id === selectId)
        ) {
            return localRefresh()
        }
        if (
            (!isInSelections && selections.includes( selectId )) ||
            (isInSelections && !selections.includes( selectId ))
        ) {
            return localRefresh()
        }
    }
}

export function selectItem(item) {
    return function( e ) {
        raise( `select.item.${item._selectId}`, e )
    }
}

export function scrollInSelected() {
    let selection = store.aweSelected$
    if (selection && selection.id !== -1) {
        raise('scroll-list-to', selection.id)
    }
}
