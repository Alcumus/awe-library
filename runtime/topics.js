/**
 * @module dynamic/awe-library/runtime/topics
 * @description Access topics for the current context
 */

import { get, list } from 'common/offline-data-service'
import { getActiveClient } from 'common/global-store/api'
import useAsync from 'common/use-async'
import { initialize } from 'common/offline-data-service/behaviour-cache'

/**
 * @typedef {Object<string, Relationship>} Relationships
 * @global
 * @description A relationship between a topic and another
 * table
 */

/**
 * @interface Concern
 * @global
 * @description An element in a topic - for instance a reporting level,
 * a organisational structure level etc.  This is not the "value"
 * but a placeholder for a set of values that represent the entities
 * that make up this concern within a topic.
 */

/**
 * @interface Topic
 * @global
 * @description Describes a topic in the system
 * @property {string} _id - the id of the topic
 * @property {string} _client - the client/app context
 * @property {string} name - the name of the topic
 * @property {Array<Concern>} concerns - the concerns within the topic
 * @property {Relationships} relationships - the relationships between the
 * topic and the user or other context information
 *
 */

/**
 * Retrieve the topics for the current context
 * @returns {Promise<Array<Topic>>}
 */
export async function getTopics() {
    try {
        console.log("get topics")
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
    } finally {
        console.log("got topics")
    }
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
