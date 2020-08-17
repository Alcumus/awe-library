import { get, list } from 'common/offline-data-service'
import { getActiveClient } from 'common/global-store/api'
import useAsync from 'common/use-async'
import { initialize } from 'common/offline-data-service/behaviour-cache'

export async function getTopics() {
    return (
        await list('hestia', 'topics', {
            $and: [
                { $or: [{ _deleted: null }, { _deleted: 0 }] },
                {
                    $or: [{ _client: 0 }, { _client: null }, { _client: '@WORK' }, { _client: getActiveClient() }],
                },
            ],
        })
    ).map('data')
}

let lastTopics = []

export function useTopics(id) {
    return useAsync(
        async () => {
            const topics = await getTopics()
            return (lastTopics = Object.assign(topics, { _loaded: true }))
        },
        lastTopics,
        id
    )
}

export async function getTopic(topic) {
    const item = await get(topic)
    await initialize(item)
    return item
}
