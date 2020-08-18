import memoize from 'memoizee'
import events from 'alcumus-local-events'
import noop from 'common/noop'

const allSeen = {}

export const lookupTypes = memoize(
    function getTypes () {
        allTypes()
        return allSeen
    },
    { maxAge: 60000 },
)

export function questionTypeDef ( type ) {
    let definition = lookupTypes()[ typeof type === 'string' ? type : type.type ] || {}
    definition.config = definition.config || noop
    return definition
}

export const allTypes = memoize(
    function allTypes ( document ) {
        const types = []
        types.document = document
        let result = events.modify( 'awe.question-types', types )
        result.forEach( ( type ) => ( allSeen[ type.value ] = type ) )
        return result
    },
    { maxAge: 60000 },
)
