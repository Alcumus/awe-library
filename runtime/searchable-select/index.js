import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import TextField from '@material-ui/core/TextField'
import { Box, IconButton } from '@material-ui/core'
import { ensureArray } from 'common/ensure-array'
import { StandardDialog } from 'common/Dialog'
import ListItem from '@material-ui/core/ListItem'
import { ListItemBox } from 'common/ListItemBox'
import { setFromEvent } from 'common/set-from-event'
import { useRefresh } from 'common/useRefresh'
import { showModal } from 'common/modal'
import { prevent } from 'common/prevent'
import { VirtualRepeat } from 'common/repeat'
import { focusMe } from 'common/focus-me'
import { Sized } from 'common/sized'
import { filterAsync } from 'js-coroutines'
import { FaCheck, MdClear, MdSearch } from 'react-icons/all'
import Typography from '@material-ui/core/Typography'
import noop from 'common/noop'
import { MobiscrollLook, useStyles } from 'dynamic/awe-library/runtime/mobiscroll-look'

function returnValue(v) {
    return v
}

let block = false
const unblock = function() {
    block = false
}.debounce( 300 )

export function blockClick(fn) {
    return function( ...params ) {
        if (block) return
        block = true
        unblock()
        fn( ...params )
    }
}

function Option ( { label } ) {
    let mobile = innerWidth < 768
    const classes = useStyles( { mobile } )
    return <Box className={`${classes.option} mobi-child`}>{label}</Box>
}

function renderTextField ( { values, inputExtra, label, helperText, ...props } ) {
    let mobile = innerWidth < 768
    const classes = useStyles( { mobile } )
    return (
        <MobiscrollLook label={label} float={values.length} {...props}>
            {inputExtra}

            {values.map( ( value, index ) => {
                return <Option key={index} label={value}/>
            })}
            {helperText && mobile && (
                <Box
                    mt={3}
                    ml={1}
                    mb={1}
                    color={props.error ? 'error.main' : ''}
                >
                    <Typography variant={'caption'}>{helperText}</Typography>
                </Box>
            )}
            {helperText && !mobile && (
                <Box className={classes.helperText}>{helperText}</Box>
            )}
        </MobiscrollLook>
    )
}

let lastClick = 0

export function SearchableSelect({
    renderInput = renderTextField,
    filter,
    onFilter,
    renderItem,
    multiple,
    options = [],
    onCanOpen = () => true,
    getOptionForValue = returnValue,
    getOptionValue = returnValue,
    getOptionLabel = returnValue,
    getOptionText = returnValue,
    value,
    onChange,
    Item,
    ...props
}) {
    const classes = useStyles()
    const update = useRef( null )
    const values = ensureArray( value )
        .map( getOptionForValue )
        .filter( ( v ) => !!v )
        .map( getOptionText )
    const toDisplay = [...ensureArray( value )]
    if (update.current) {
        update.current( options )
    }
    return (
        <Box
            onMouseUp={blockClick( showList )}
            onClick={prevent( noop )}
            onMouseMove={prevent( noop )}
        >
            {renderInput( { values, ...props } )}
        </Box>
    )

    async function showList() {
        if (!onCanOpen(value)) return
        let selected = await showModal(Choices, {
            values: toDisplay,
            setUpdate,
            options
        } )
        if (selected) {
            if (!multiple) {
                onChange( selected[0] )
            } else {
                onChange( selected )
            }
        }
    }

    function setUpdate ( fn ) {
        update.current = fn
    }

    function RenderItem ( { option } ) {
        return getOptionLabel( option )
    }

    function Choices ( { ok, cancel, values = [], setUpdate, options } ) {
        const [sourceOptions, setSourceOptions] = useState( options )
        setUpdate( refreshChoices.debounce() )
        const refresh = useRefresh()
        const [filterText, setFilterText] = useState( '' )
        const filterCoroutine = useRef()
        const currentSearch = useRef( '' )
        useEffect( () => {
            search( filter && filterText ).catch( console.error )
            return terminate

            async function search ( filter ) {
                if (!filter) {
                    terminate()
                    return updateDisplayRows( sourceOptions )
                }
                filter = filter.toLowerCase()
                if (currentSearch.current === filter) return
                currentSearch.current = filter
                terminate()
                const rows = await (filterCoroutine.current = filterAsync(
                    sourceOptions,
                    ( item ) => onFilter( item, filter )
                ))
                filterCoroutine.current = null
                updateDisplayRows( rows )
            }

            function terminate () {
                if (filterCoroutine.current) {
                    filterCoroutine.current.terminate( false )
                    filterCoroutine.current = null
                }
            }

            function updateDisplayRows ( rows ) {
                if (!rows) return
                if (!Object.isEqual( rows, displayRows )) setDisplayRows( rows )
            }
        }, [filterText, JSON.stringify( sourceOptions )] )

        onFilter = onFilter || defaultFilter
        const [displayRows, setDisplayRows] = useState( sourceOptions )
        return (
            <StandardDialog
                contentProps={{ className: classes.grow, dividers: false }}
                title={props.label}
                accept={'Set'}
                onOk={() => ok(values.compact(true))}
                onCancel={cancel}
            >
                {filter && (
                    <Box mb={1} ml={1} mr={1} mt={1}>
                        <TextField
                            InputProps={{
                                startAdornment: (
                                    <Box color={'#444'} mr={1}>
                                        <MdSearch />
                                    </Box>
                                ),
                                endAdornment: (
                                    <IconButton
                                        onClick={blockClick( clearFilter )}
                                    >
                                        <MdClear/>
                                    </IconButton>
                                ),
                            }}
                            inputRef={focusMe}
                            fullWidth
                            label={'Filter'}
                            variant={'outlined'}
                            onChange={setFromEvent(setFilter)}
                            value={filterText}
                        />
                    </Box>
                )}
                <Sized
                    display={'flex'}
                    flexDirection={'column'}
                    height={'100%'}
                    flexGrow={1}
                    minHeight={'50vh'}
                    maxHeight={'90vh'}
                >
                    {({ height }) => (
                        <VirtualRepeat height={height} collection={displayRows}>
                            {(option, index) => {
                                const selected = values.includes(
                                    getOptionValue(option)
                                )
                                const Child = renderItem || RenderItem
                                return !Item ? (
                                    <ListItem
                                        button
                                        divider
                                        component={'div'}
                                        onClick={select(option, index)}
                                        selected={selected}
                                    >
                                        <ListItemBox>
                                            <Box
                                                style={{
                                                    opacity: selected ? 1 : 0,
                                                }}
                                                mr={1}
                                            >
                                                <Typography color={'primary'}>
                                                    <FaCheck />
                                                </Typography>
                                            </Box>
                                            <Box flexGrow={1}>
                                                <Child
                                                    option={option}
                                                    selected={selected}
                                                />
                                            </Box>
                                        </ListItemBox>
                                    </ListItem>
                                ) : (
                                    <Item
                                        onClick={select(option, index)}
                                        selected={selected}
                                        values={values}
                                        option={option}
                                        index={index}
                                    />
                                )
                            }}
                        </VirtualRepeat>
                    )}
                </Sized>
                <Box flexGrow={1}/>
            </StandardDialog>
        )

        function refreshChoices ( options ) {
            setSourceOptions( options )
        }

        function select ( option ) {
            return function() {
                if (!multiple) values.length = 0
                const optionValue = getOptionValue( option )
                if (values.includes( optionValue )) {
                    values = values.splice( values.indexOf( optionValue ), 1 )
                } else {
                    values.push( optionValue )
                }
                refresh()
                if (Date.now() - lastClick < 500 && !multiple) {
                    ok(values.compact(true))
                }
                lastClick = Date.now()
            }
        }

        function defaultFilter(item, filterText) {
            return getOptionLabel(item).indexOf(filterText) !== -1
        }
        function setFilter(value) {
            setFilterText(value)
        }

        function clearFilter() {
            setFilterText('')
            setDisplayRows(options)
        }
    }
}

renderTextField.propTypes = {
    values: PropTypes.array,
}

SearchableSelect.propTypes = {
  Item: PropTypes.any,
  filter: PropTypes.any,
  getOptionForValue: PropTypes.any,
  getOptionLabel: PropTypes.any,
  getOptionText: PropTypes.any,
  getOptionValue: PropTypes.any,
  label: PropTypes.any,
  multiple: PropTypes.any,
  onCanOpen: PropTypes.any,
  onChange: PropTypes.any,
  onFilter: PropTypes.any,
  options: PropTypes.array.isRequired,
  renderInput: PropTypes.any,
  renderItem: PropTypes.any,
  value: PropTypes.any
}

MobiscrollLook.propTypes = {
  children: PropTypes.any,
  error: PropTypes.any,
  float: PropTypes.any,
  label: PropTypes.any,
  ml: PropTypes.any,
  mr: PropTypes.any,
  pl: PropTypes.number,
  pr: PropTypes.number
}

MobiscrollLook.defaultProps = {
  pl: 1,
  pr: 1
}

SearchableSelect.defaultProps = {
  getOptionForValue: returnValue,
  getOptionLabel: returnValue,
  getOptionText: returnValue,
  getOptionValue: returnValue,
  onCanOpen: () => true,
  options: [],
  renderInput: renderTextField
}
