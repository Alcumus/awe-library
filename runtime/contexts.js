import React, { createContext, useContext } from 'react'
import { useWindowSize } from 'common/use-event'

export const ComponentContext = createContext({})
export const DocumentContext = createContext( { document: null } )
export const WidthContext = createContext( innerWidth )
export const RelatedContext = createContext( { number: -1 } )
export const QuestionContext = React.createContext( {} )
export const InstanceContext = React.createContext( {} )

export function useWidthBreak () {
    const { width } = useWindowSize()
    let result = 'xs'
    if (width >= 758) {
        result = 'md'
    }
    if (width >= 1020) {
        result = 'lg'
    }
    return result
}


export function useDocumentContext() {
    return useContext(DocumentContext)
}

export function useRelatedContext() {
    return useContext(RelatedContext)
}

export function useWidth() {
    return useContext(WidthContext)
}

export function useOptions() {
    return useContext(ComponentContext)
}

export function useError() {
    return useContext(ComponentContext).useError()
}

export function useInputProps(ignoreProps) {
    const componentContext = useContext( ComponentContext )
    try {
        return componentContext.props( ignoreProps )
    } catch (e) {
        return {}
    }
}

export function useComponentContext() {
    return useContext(ComponentContext)
}

export function useQuestionContext() {
    return useContext(QuestionContext)
}

export function useInstanceContext() {
    return useContext(InstanceContext)
}
