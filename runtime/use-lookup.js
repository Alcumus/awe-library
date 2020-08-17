import {useBoundContext} from 'common/component-utilities'
import {lookup} from 'dynamic/awe-library/runtime/lookup'

export function useLookup() {
    const {document} = useBoundContext()
    return lookup(document)
}

