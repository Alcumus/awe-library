//
import { createDocument } from 'common/create-document'
import events from 'alcumus-local-events'
import { cacheLocalOnly, get, set } from 'common/offline-data-service'
import { showNotification } from 'common/modal'
import { getActiveClient } from 'common/global-store/api'
import { getType } from 'dynamic/awe-library/runtime/records'

/**
 * Creates an object provided with a document type
 * @param {Document} [parent=null] - the parent of the document being created
 * @param {string} typeId - the id of the document type to create
 * @param {object} [context={}] - default context (used by context fields) for the document being created
 * @param {boolean} [fromRaw=false] - if true use the latest version of the document, not the active published version
 * @param {string} [id] - if supplied use the id for the document, otherwise generate one
 * @param {object} [props={}] - any props to immediately set on the document
 * @param {boolean} [alwaysCreate=false] - documents are often not really created before the first submission, setting true
 * here makes the document create immediately
 * @returns {Promise<Document>} a promise for the created document
 */
export async function createDocumentOfType(parent, typeId, context = {}, fromRaw, id, props = {}, alwaysCreate) {
    try {
        let versionId
        const type = await getType(typeId)
        if (!type) {
            console.info('Could not retrieve type', typeId)
            return null
        }
        let version
        if (fromRaw || !type.currentVersion) {
            delete type.versions
            delete type.currentVersion
            version = type
            type.__version = `raw-${Date.now()}`
        } else {
            versionId = type.currentVersion[window.mode || 'live']
            version = JSON.parse(type.versions.find((v) => v.name === versionId).content)

            type.__version = versionId
        }
        const newDocument = await createDocument(version, undefined, id)
        newDocument._version = type.__version
        newDocument._parent = parent?._id
        Object.assign(newDocument, props)
        if (type.defaultState) {
            newDocument.behaviours.state = type.defaultState
        }

        newDocument.sendMessage('setContext', context)
        if (context.initialize) {
            context.initialize(newDocument)
        }
        if (alwaysCreate || type.createOnNew) {
            newDocument.$created = true
            events.once(`shouldload.${newDocument._id}`, (_, props) => {
                props.change = false
            })
            await set(newDocument, true)
        } else {
            cacheLocalOnly(newDocument)
        }
        return newDocument
    } catch (e) {
        console.error(e)
        showNotification('Error: cannot create document')
    }
}

/**
 * Ensure that a document has been created with an id and a given
 * type.  This is predominantly used for applications whose
 * id is the user id (they have their own unique copy of the data)
 * @param {string} id - the id that must exist
 * @param {DocumentDefinition} type - the type that the id is part of
 * @returns {Promise<void>} a promise that is resolved when the id is known to exist
 */
export async function ensure(id, type) {
    let current = await get(id)
    if (!current) {
        // eslint-disable-next-line no-console
        console.log('cdot', type._id)
        let result = await createDocumentOfType(null, type._id, {}, false, id, {}, true)
        console.info(result)
    } else if (current.client === getActiveClient() || current._client === getActiveClient()) {
        // eslint-disable-next-line no-console
        console.log('upgrade', type._id)
        try {
            let versionId = type.currentVersion?.[window.mode || 'live']
            if (versionId && versionId !== current._version) {
                let version = JSON.parse(type.versions.find((v) => v.name === versionId).content)
                current._behaviours = version._behaviours
                delete version._behaviours
                Object.assign(current._settings, version)
                current._version = versionId
                await set(current, true, true)
            } else if (!versionId) {
                let version = JSON.parse(JSON.stringify(type))
                current._behaviours = version._behaviours
                delete version._behaviours
                Object.assign(current._settings, version)
                current._version = versionId
                await set(current, true, true)
            }
        } catch (e) {
            //Can't upgrade for some reason
            console.error("Can't upgrade" + e.message)
        }
    }
}
