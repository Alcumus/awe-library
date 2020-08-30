/**
 * @module dynamic/awe-library/document-type-context
 */
import {createContext, useContext} from 'react'


/**
 * @interface IDocumentTypeContext
 * @description An interface into the currently edited document and
 * methods to support it. You can get this through <code>useDocumentTypeContext()</code>
 * @property {object} type - the whole of the currently edited definition
 * @property {function(void)} save - call to save the current definition
 * @property {function(void)} refresh - call to refresh the whole document view
 * @property {function(void)} undo - call to undo the last operation
 * @property {function(void)} redo - call to redo the last undone operation
 * @property {function(definition)} update - call to replace the document definition with another
 * @see {@link module:dynamic/awe-library/document-type-context.useDocumentTypeContext}
 */



/**
 * The DocumentTypeContext provides access to a range of
 * useful properties of a document currently being edited in
 * the ThingBuilder interface.  You can use this in any sub
 * component to access these properties.
 *
 * The most useful property is probably 'type' which is the
 * whole of the currently edited document
 *
 * It is most often accessed through the helper useDocumentTypeContext()
 * method
 * @type {React.Context<IDocumentTypeContext>}
 */
export const DocumentTypeContext = createContext({})

/**
 * Access the current DocumentTypeContext which contains
 * useful information about the currently edited type
 * in ThingBuilder.
 * @returns {IDocumentTypeContext} the current context
 */
export function useDocumentTypeContext() {
    return useContext(DocumentTypeContext)
}
