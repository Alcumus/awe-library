/**
 * @module dynamic/awe-library/runtime/contexts
 * @description This module contains the useful
 * contexts for the runtime app environment
 */
import React, { createContext, useContext } from 'react'
import { useWindowSize } from 'common/use-event'

export const ComponentContext = createContext({})
export const DocumentContext = createContext( { document: null } )
export const WidthContext = createContext( innerWidth )
export const RelatedContext = createContext( { number: -1 } )
export const QuestionContext = React.createContext( {} )
export const InstanceContext = React.createContext( {} )

/**
 * A hook to provide the current media "break"
 * for the display.
 *
 * Returns cs, md or lg and changes when the display
 * is resized
 * @returns {string}
 */
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

/**
 * @interface IRuntimeDocumentContext
 * @global
 * @description vital document context for the
 * currently running document
 * @property {Document} document - the currently edited document
 * @property {object} bag - a bag of key value pairs that can be used
 * to carry information about the current document around while it
 * is in memory and/or on screen
 */

/**
 * Returns the runtime context for the document currently being
 * edited or displayed.
 * @returns {IRuntimeDocumentContext} the context for the current document
 */
export function useDocumentContext() {
    return useContext(DocumentContext)
}

/**
 * @interface IRuntimeRelatedContext
 * @global
 * @description Information pertaining to the currently displayed
 * document in a related repeat question
 * @property {number} number - the index of the item in the list
 * @property {string} id - the document id of the item
 */

/**
 * While using a "related repeat" component to repeat some
 * child questions for a set of related documents, this provides
 * the information about the id of the related child and it's position
 * in the list being displayed
 * @returns {IRuntimeRelatedContext} the context of the currently used document
 */
export function useRelatedContext() {
    return useContext(RelatedContext)
}

/**
 * Returns the width currently being used as the max width
 * of the current section
 * @returns {number}
 */
export function useWidth() {
    return useContext(WidthContext)
}

/**
 * @interface IRuntimeQuestionOptions
 * @global
 * @description Useful options for the current question in
 * the current context and screen space
 * @property {string} labelStyle - the label style for the current context 'floating' 'static' etc
 * @property {boolean} mobile - true if this is a mobile device view
 * @property {string} theme - mobiscroll theme - defaults to ios
 * @property {boolean} touchUi - whether this device should provided assistive mobiscroll
 * components for touch interfaces
 * @property {string} className - the class name to apply to any container
 * @property {number} questionPadding - material UI padding units for the question
 * @property {number} questionAdjust - material UI left/right adjust for margin
 * @property {string} questionClass - the class to apply to the text of the question associated
 * @property {number} gridPadding - the padding to use on grids for the current screen state
 * @property {number} questionSpacing - the suggested vertical spacing between questions in material ui spacing units
 * @property {number} stack - how many columns should a stacked question occupy
 * @property {string} currencySymbol - the symbol to use for currency
 * @property {boolean} helpNumbers - whether a touch pad should be used for numbers
 * @property {number} boxPadding - the number of material UI spacing units to pad a sub box with
 * @property {number} embedPadding - the number of material UI spacing units to use when embeding additional form content
 */

/**
 * @function IRuntimeQuestionOptions#nonMobile
 * @description (used internally) call to change to a desktop style view
 */

/**
 * @interface ErrorState
 * @global
 * @description Describes the error state of a question
 * @property {boolean} valid - true if the current content is valid
 * @property {string} errorMessage - an error message to show for the component
 */

/**
 * @function IRuntimeQuestionOptions#useError
 * @description Hook to return the current error state of the question
 * @returns {ErrorState} the current error state of the question (suitable for
 * directly applying to a mobiscroll component)
 */

/**
 * @function IRuntimeQuestionOptions#props
 * @description Gets properties to apply to a React component from the options.
 * Many of the properties of the options are informational and shouldn't
 * be applied directly to a component.  This function screens out the
 * ones that shouldn't be applied and provides an object to spread
 * onto the underlying React component.
 * @param {...string} omit - a list of additional properties to omit
 * @returns {object} properties object
 */

/**
 * Returns the "options" for the current question, this is
 * a set of useful information that contains information
 * about suggested layout and padding, errors etc.
 * @returns {IRuntimeQuestionOptions} the options associated
 */
export function useOptions() {
    return useContext(ComponentContext)
}

/**
 * A hook that returns the current ErrorState for the current question
 * and updates as necessary
 * @returns {ErrorState}
 */
export function useError() {
    return useContext(ComponentContext).useError()
}

/**
 * A hook to get the current input props for a React component,
 * ignoring contextual/non-component props
 * @param {...string} ignoreProps - additional props to ignore
 * @returns {object} An object to spread onto a React component
 */
export function useInputProps(ignoreProps) {
    const componentContext = useContext( ComponentContext )
    try {
        return componentContext.props( ignoreProps )
    } catch (e) {
        return {}
    }
}

/**
 * Returns the "options" for the current question, this is
 * a set of useful information that contains information
 * about suggested layout and padding, errors etc.
 * @returns {IRuntimeQuestionOptions} the options associated
 */
export function useComponentContext() {
    return useContext(ComponentContext)
}

/**
 * A hook which returns the current question instance being processed.
 * This is very useful in support components to avoid significant
 * parameter passing.
 * @returns {FieldDefinition} the currently processed field definition
 */
export function useQuestionContext() {
    return useContext(QuestionContext)
}

/**
 * @interface DocumentInstance
 * @global
 * @description This is the document that is being edited by the
 * user, it contains methods to commit and save the current state
 * and provides access to the current state of the document
 * as the user sees it throughout their editing experience.
 * @property {object} instance - the contents of the document as it is being edited
 * @property {Document} document - the underlying document
 *
 */

/**
 * @function DocumentInstance#save
 * @description Saves the current edits to the document instance.
 * This is what you do during editing, it does not commit the
 * instance to the server or take any action, just maintains the
 * current editing state.
 */

/**
 * @function DocumentInstance#reset
 * @description Abandons all current edits to the document and
 * clears the instance here and on any synchronised devices
 */

/**
 * @function DocumentInstance#commit
 * @description Commits the instance and specifies the
 * optimistic expected state
 * @param {string} toState - the expected next state
 * @param {string} [command=setData] - the command to use to submit the instance
 * @param {object} [controller] - a controller that can cover storing data in different locations, rarely used
 * @param {Document} [$create] - a document to create before applying the instance to it
 */

/**
 * Returns the current instance for the edited content of
 * the current document.  This contains a <code>instance</code>
 * member which is the actual document contents as edited.
 *
 * This is very useful to get the current editors view
 * of a document in a sub component.
 *
 * @returns {DocumentInstance} the current instance being edited.
 */
export function useInstanceContext() {
    return useContext(InstanceContext)
}
