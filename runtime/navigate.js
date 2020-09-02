/**
 * @module dynamic/awe-library/runtime/navigate
 */
import { getLocation } from 'common/routing'


/**
 * Navigate to a document or id immediately
 * @param {string|Document} documentOrId - the document to navigate to
 * @param {function} [navigate] - an override for the standard navigation
 * @param {object} [location] - an override for the standard location
 */
export function navigateToDocument(documentOrId, navigate, location) {
    if(!navigate) {
        ({navigate} = getLocation())
    }
    if(!location) {
        ({location} = getLocation())
    }
    const id = Object.isObject(documentOrId) ? documentOrId._id : documentOrId
    navigate(`/sys/${encodeURIComponent(id)}`, {
        state: {returnTo: location.href, previous: location.state},
    })
}
