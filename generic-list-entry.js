import { ListItemAvatar } from '@material-ui/core'
import Avatar from 'common/Avatar'
import { color } from 'common/standard-names'
import React from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import Box from '@material-ui/core/Box'
import {useSelection} from './lib/selection'

export function genericListEntry ( type, icon, caption ) {
    ListEntry.propTypes = {
        instance: PropTypes.any,
        onClick: PropTypes.any,
        refresh: PropTypes.any,
        type: PropTypes.any,
    }
    return ListEntry

    function ListEntry ( { instance, type, onClick, refresh } ) {
        const [ selected, props ] = useSelection( instance, refresh, type )
        return (
            <Box { ...props } className={ clsx( { selected } ) } flexGrow={ 1 }>
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent={ 'flex-start' }
                >
                    <ListItemAvatar>
                        <Avatar style={ { background: color( type ) } }>
                            { instance.Icon ? <instance.Icon/> : icon }
                        </Avatar>
                    </ListItemAvatar>
                    <Box mr={ 1 }>
                        { instance.Editor && (
                            <a onClick={ onClick }>
                                { instance.Caption ? (
                                    <instance.Caption/>
                                ) : (
                                    caption
                                ) }
                            </a>
                        ) }
                    </Box>
                </Box>
            </Box>
        )
    }
}
