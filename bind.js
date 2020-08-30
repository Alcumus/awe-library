/**
 * @module dynamic/awe-library/bind
 */

/**
 * Create a function to binds the property functions on an object to the current this pointer.
 *
 * This function is often used in behaviours as the definition of the `initialized` method to
 * ensure that the necessary methods of a behaviour are correctly bound to the this so it can
 * be used to access the behaviour definition while coding the implementation.
 * @param props - the names or function to bind
 * @returns Binding function
 * @example
 register(
 'examplePerQuestionBehaviour',
 {
        methods: {
            initialized: bind('Renderer'),
            // Render before a component
            //beforeRender,
            // Render after a component
            afterRender,
            // This is the internally declared component that will do the render
            Renderer,
        },
    },
 true
)
 */
export function bind ( ...props ) {
    return function( ...params ) {
        for (let prop of props) {
            if (typeof prop === 'function') {
                prop.apply( this, params )
            } else {
                this[prop] = this[prop].bind( this )
            }
        }
    }
}
