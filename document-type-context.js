import {createContext, useContext} from 'react'

export const DocumentTypeContext = createContext({})

export function useDocumentTypeContext() {
    return useContext(DocumentTypeContext)
}
