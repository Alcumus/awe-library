//
import { createDocument } from 'common/create-document'
import events from 'alcumus-local-events'
import { cacheLocalOnly, get, set } from 'common/offline-data-service'
import { showNotification } from 'common/modal'
import { getActiveClient } from 'common/global-store/api'
import { getType } from 'dynamic/awe-library/runtime/records'

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
