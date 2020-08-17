import { getLocation } from 'common/routing'


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
