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
