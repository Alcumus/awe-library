import { useRefresh } from 'common/useRefresh'
import { useCachedAsync } from 'common/use-async'
import { uiReady } from 'common/ui-ready'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { useLocalEvent } from 'common/use-event'
import { checkInequality } from 'common/offline-data-service'
import { getType } from 'dynamic/awe-library/runtime/records'

export function useType(id) {
    const refresh = useRefresh()
    let rv = useCachedAsync(
        'getTypeU',
        async () => {
            if (!id) {
                return null
            }
            await uiReady()
            const tp = await getType(id)
            tp && (await initialize(tp))
            return tp
        },
        null,
        id,
        refresh.id
    )
    useLocalEvent(`data.updated.${id}`, (id, record) => {
        checkInequality(record, rv) && refresh()
    })

    return rv
}
