import PropTypes from 'prop-types'
import React from 'react'
import Box from '@material-ui/core/Box'
import { Repeat } from 'common/repeat'
import { StandardAutocomplete, StandardCheckBox, } from 'common/bound-components'
import { Bound, useBoundContext } from 'common/component-utilities'
import { Button, CardHeader, IconButton, InputAdornment, makeStyles, Menu, TextField } from '@material-ui/core'
import { MdDelete, MdEdit } from 'react-icons/all'
import { useModal } from 'common/modal'
import { useRefresh } from 'common/useRefresh'
import { StandardDialog } from 'common/Dialog'
import { prevent } from 'common/prevent'
import { ensureArray } from 'common/ensure-array'
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state'
import MenuItem from '@material-ui/core/MenuItem'
import { ListItemBox } from 'common/ListItemBox'
import { Handle, SortableList, SortableListItem } from 'common/sortable'
import { arrayMoveWrapper } from 'common/array-move-in-place'
import { fieldNameIs, useFields } from 'dynamic/awe-library/utils'
import { Case, CaseElse, Switch } from 'common/switch'
import { useTopic } from 'dynamic/awe-plugin/lib/topics'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import { setFromEvent } from 'common/set-from-event'
import { useDocumentTypeContext } from 'dynamic/awe-library/document-type-context'
import { basicField, fieldBelongsLocally } from 'dynamic/awe-library/utils'
import noop from 'common/noop'
import { useType } from 'dynamic/awe-library/use-types'

const useStyles = makeStyles( ( theme ) => ({
    holder: {
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
    },
    button: {
        color: theme.palette.primary.main,
        cursor: 'pointer',
    },
}))

export function QueryCascade({ field, children, ...props }) {
    const { target, refresh } = useBoundContext()
    Object.set(target, field, Object.get(target, field, true) || [])
    const queries = Object.get(target, field, true)
    return (
        <Box>
            <SortableList onSortEnd={arrayMoveWrapper(queries, refresh)} distance={10}>
                <Repeat collection={queries}>
                    {(query, index) => {
                        return (
                            <Bound target={query}>
                                <SortableListItem disableGutters={true} index={index}>
                                    <ListItemBox>
                                        <Box mr={1}>
                                            <Handle />
                                        </Box>
                                        <Box flexGrow={1}>
                                            <Query {...props} field={'query'} />
                                        </Box>
                                        {children}
                                        <Box>
                                            <IconButton onClick={remove(index)} color={'secondary'}>
                                                <MdDelete />
                                            </IconButton>
                                        </Box>
                                    </ListItemBox>
                                </SortableListItem>
                            </Bound>
                        )
                    }}
                </Repeat>
            </SortableList>
            <Box mt={2}>
                <Button onClick={addQuery} color={'primary'}>
                    + Query
                </Button>
            </Box>
        </Box>
    )

    function addQuery() {
        queries.push({ query: {} })
        refresh()
    }

    function remove(index) {
        return function () {
            queries.splice(index, 1)
            refresh()
        }
    }
}

export function convertToText(where) {
    const list = where.$or || [where]
    const output = list.map(where => {
        if (!where || Object.isEmpty(where)) return ' (All) '
        const conditions = Object.entries(where)
            .filter((v) => !!toText(v[1]))
            .map((v) => `${v[0]} ${toText(v[1])}`)
        if (conditions.length === 1) {
            return conditions[0]
        } else {
            return `(${conditions.join(' AND ')})`
        }

    })
    if (output.length === 1 && output[0].startsWith('(')) {
        return output[0].slice(1, -1)
    }
    return output.join(' OR ')
}

export function Query({type, refresh: parentRefresh = noop, fields, field: fieldName = 'where', ...props}) {
    LongQuery.propTypes = {
        ok: PropTypes.any
    }

    const { save, target } = useBoundContext()
    const { type: documentType } = useDocumentTypeContext()
    const typeFields = useFields( type || documentType )
    fields = (fields ? fields : (typeFields || []))
    fields = fields.filter( fieldBelongsLocally( fields ) )
    const modal = useModal( LongQuery )
    let where = (target[fieldName] = target[fieldName] || {})
    const classes = useStyles()
    const refresh = useRefresh( save, parentRefresh )

    let text = convertToText( where )
    return (
        <TextField
            {...props}
            fullWidth
            readOnly
            multiline
            variant="outlined"
            value={text}
            InputProps={{
                endAdornment: (
                    <InputAdornment className={classes.button} onClick={prevent(edit)} position="end">
                        <MdEdit />
                    </InputAdornment>
                ),
            }}
        />
    )

    async function edit() {
        if (await modal()) refresh()
    }

    function LongQuery({ ok }) {
        Elements.propTypes = {
            index: PropTypes.any,
            where: PropTypes.any
        }

        const refresh = useRefresh( save )
        const masterWhere = where
        const list = where.$or ? where.$or : [where]

        return (
            <StandardDialog
                startButtonAdornment={
                    !Object.isEmpty( list.slice( -1 )[0] ) &&
                    <Button onClick={addOr} color={'primary'} variant={'contained'}>
                        OR
                    </Button>
                }
                accept={'Done'}
                contentProps={{dividers: false}}
                onOk={ok}
                title={props.label || 'Query'}
            >
                <Bound target={target} refresh={refresh} save={save}>
                    <Box className={classes.holder}>
                        <Repeat collection={list} item={<Elements/>} keyFn={(v, i) => i} pass={'where'}/>
                    </Box>
                </Bound>
            </StandardDialog>
        )

        function addOr() {
            if (where.$or) {
                where.$or.push({})
            } else {
                where.$or = [{...where}, {}]
            }
            refresh()
        }

        function Elements({where, index}) {
            ArrayField.propTypes = {
                definition: PropTypes.any,
                field: PropTypes.any
            }

            TopicField.propTypes = {
                definition: PropTypes.any,
                field: PropTypes.any
            }

            LookupField.propTypes = {
                definition: PropTypes.any,
                field: PropTypes.any
            }

            ChoiceField.propTypes = {
                field: PropTypes.any,
                options: PropTypes.any
            }


            const usedFields = Object.keys( where ).filter( ( f ) => !f.startsWith( '_' ) || f === 'id' || f === '_id' )
            const availableFields = fields.filter( ( f ) => where[f.name] === undefined )
            return (
                <Box flexGrow={1} clone mb={1}>
                    <Card variant={'outlined'}>
                        {index > 0 && (
                            <CardHeader
                                title={'OR'}
                                action={
                                    <Button color={'secondary'} onClick={removeOr( where )}>
                                        DELETE
                                    </Button>
                                }
                            />
                        )}
                        <CardContent>
                            <Box className={classes.holder}>
                                <Repeat collection={usedFields} pass={'field'} keyFn={(v) => v} item={<Field/>}/>
                                <AddField/>
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            )

            function removeOr(or) {
                return function () {
                    masterWhere.$or = masterWhere.$or.filter((f) => f !== or)
                    refresh()
                }
            }

            function Field({field}) {
                const fieldDef = fields.find(fieldNameIs(field)) || {}
                const options = (fieldDef?.choices || []).map((v) => `${v.value}`)

                return (
                    <Box key={field} mt={2}>
                        <ListItemBox>
                            <Box flexGrow={1}>
                                <Switch value={{ fieldDef, options }}>
                                    <Case when={( { fieldDef } ) => fieldDef?.type === 'array'}>
                                        <ArrayField field={field} definition={fieldDef}/>
                                    </Case>
                                    <Case when={( { fieldDef } ) => fieldDef?.topic}>
                                        <TopicField field={field} definition={fieldDef}/>
                                    </Case>
                                    <Case when={( { fieldDef } ) => fieldDef?.lookupType}>
                                        <LookupField field={field} definition={fieldDef}/>
                                    </Case>
                                    <Case when={( v ) => v.options?.length}>
                                        <ChoiceField options={options} field={field}/>
                                    </Case>
                                    <CaseElse>
                                        <StandardTextEntry field={field}/>
                                    </CaseElse>
                                </Switch>
                            </Box>
                            <Box ml={1}>
                                <IconButton onClick={remove( field )} color={'secondary'}>
                                    <MdDelete/>
                                </IconButton>
                            </Box>
                        </ListItemBox>
                    </Box>
                )
            }

            function ArrayField ( { field, definition } ) {
                const localRefresh = useRefresh( save )
                const forms = documentType.sendMessage( 'getForms', [] ).groupBy( 'id' )
                const activeForm = forms[definition.useForm]?.[0]
                if (!activeForm) return null
                const fields = returnFrom( activeForm.getFields ).filter( basicField() )
                const value = where[field] = where[field] || { $elemMatch: {} }
                return <Bound target={value.$elemMatch} refresh={localRefresh}>
                    <Query fields={fields} label={field}/>
                </Bound>

                function returnFrom ( fn, ...params ) {
                    const result = []
                    fn( result, ...params )
                    return result
                }
            }

            function TopicField ( { field, definition } ) {
                const { save } = useBoundContext()
                const value = where[field]
                const isSubQuery = Object.isObject( value )
                const topic = useTopic( definition.topic )
                const concern = topic?.concerns.find( ( c ) => c.name === ensureArray( definition.concern )[0] )
                const type = concern?.defaultType
                const typeDef = useType( type )
                const canShowSubQuery = typeDef && isSubQuery
                const localRefresh = useRefresh(save)
                return (
                    <Box display={'flex'} alignItems={'center'}>
                        {!!typeDef && (
                            <Box mr={1}>
                                <StandardCheckBox value={isSubQuery} label={'Query'} onChange={switchType}/>
                            </Box>
                        )}
                        <Box flexGrow={1}>
                            {!canShowSubQuery && !isSubQuery && <StandardTextEntry field={field}/>}
                            {!!canShowSubQuery && (
                                <Bound target={value.$joinsTo} refresh={localRefresh}>
                                    <Query type={type} label={field}/>
                                </Bound>
                            )}
                        </Box>
                    </Box>
                )

                function switchType() {
                    if (isSubQuery) {
                        where[field] = ''
                    } else {
                        where[field] = {
                            $joinsTo: {
                                table: `${typeDef.database}/${typeDef.table}`,
                                where: {},
                            },
                        }
                    }
                    localRefresh()
                }
            }

            function LookupField({field, definition}) {
                const {save} = useBoundContext()
                const value = where[field]
                const isSubQuery = Object.isObject(value)
                const typeDef = useType(definition.lookupType)
                const canShowSubQuery = typeDef && isSubQuery
                const localRefresh = useRefresh(save)
                return (
                    <Box display={'flex'} alignItems={'center'}>
                        {!!typeDef && (
                            <Box mr={1}>
                                <StandardCheckBox value={isSubQuery} label={'Query'} onChange={switchType}/>
                            </Box>
                        )}
                        <Box flexGrow={1}>
                            {!canShowSubQuery && !isSubQuery && <StandardTextEntry field={field}/>}
                            {!!canShowSubQuery && (
                                <Bound target={value.$joinsTo} refresh={localRefresh}>
                                    <Query type={type} label={field}/>
                                </Bound>
                            )}
                        </Box>
                    </Box>
                )

                function switchType() {
                    if (isSubQuery) {
                        where[field] = ''
                    } else {
                        where[field] = {
                            $joinsTo: {
                                table: `${typeDef.database}/${typeDef.table}`,
                                where: {},
                            },
                        }
                    }
                    localRefresh()
                }
            }

            function AddField() {
                if (!availableFields) return null
                return (
                    <PopupState variant="popover">
                        {(popupState) => (
                            <Box mt={2} display={'flex'} width={'100%'}>
                                <Button variant="contained" color={'primary'} {...bindTrigger(popupState)}>
                                    {Object.isEmpty(where) ? 'Start' : 'And'}
                                </Button>
                                <Menu {...bindMenu(popupState)}>
                                    {availableFields.sort().map((t) => {
                                        return (
                                            <MenuItem onClick={add(t, popupState)} key={t.name}>
                                                <ListItemBox>
                                                    <Box flexGrow={1} mr={2}>
                                                        {t.name}
                                                    </Box>
                                                </ListItemBox>
                                            </MenuItem>
                                        )
                                    })}
                                </Menu>
                            </Box>
                        )}
                    </PopupState>
                )
            }

            function remove(field) {
                return function () {
                    delete where[field]
                    refresh()
                }
            }

            function add(field, popupState) {
                return function () {
                    popupState.close()
                    where[field.name] = field.lookupType || field.topic ? {  } : ''
                    refresh()
                }
            }

            function ChoiceField({options, field}) {
                const {save} = useBoundContext()
                const localRefresh = useRefresh(save)
                return (
                    <StandardAutocomplete
                        includeInputInList
                        options={options}
                        multiple
                        field={fieldName}
                        label={`Where ${field} is `}
                        value={toText(where[field])
                            .replace(/=/g, '')
                            .split('|')
                            .filter(Boolean)
                            .map((c) => c.trim())
                            .filter(Boolean)}
                        onChange={((_, v) => {
                            where[field] = toQuery(`= ${v.filter(Boolean).join(' | ')}`, toText(where[field]))
                            localRefresh()
                        })}
                    />
                )
            }

            function StandardTextEntry({field}) {
                const {save} = useBoundContext()
                const localRefresh = useRefresh(save)
                return (
                    <TextField
                        fullWidth
                        variant={'outlined'}
                        label={`Where ${field} is `}
                        value={toText(where[field])}
                        onChange={setFromEvent((v) => {
                            where[field] = toQuery(v, toText(where[field]))
                            localRefresh()
                        })}
                    />
                )
            }
        }
    }
}

const lookupOp = {
    $like: '*=',
    $eq: '=',
    $gt: '>',
    $lt: '<',
    $lte: '<=',
    $ne: '!=',
    $nin: 'nin',
    $in: '=',
    $gte: '>=',
    $regex: '%=',
}

const lookbackOp = {
    '=': '$in',
    '>': '$gt',
    '<': '$lt',
    '<=': '$lte',
    '!=': '$ne',
    nin: '$nin',
    in: '$in',
    like: '$like',
    '>=': '$gte',
    '%=': '$regex',
    '*=': '$like',
}

function hasLength(v) {
    return Array.isArray(v) ? v.length : !!v
}

function toText(v) {
    if (typeof v === 'object') {
        if (v.$joinsTo) {
            return `[ ${Object.entries(v.$joinsTo.where)
                .filter((v) => !!toText(v[1]))
                .map((v) => `${v[0]} ${toText(v[1])}`)
                .join(' AND ') || '(All)'} ]`
        }
        let key = Object.keys(v)[0]
        let value = v[key]
        return hasLength(value)
            ? `${lookupOp[key] || '='} ${ensureArray(v[key]).join(' | ')}`
            : lookupOp[key]?.trim()
                ? `${lookupOp[key]} ${value || ''}`
                : ''
    } else if (v) {
        if (Object.keys(lookbackOp).find(k=>k.startsWith(v))) {
            return v
        }
        return `= ${v}`
    } else {
        return ''
    }
}

function toQuery(v, last) {
    if (Array.isArray(v)) {
        v = `= ${v
            .map((v) =>
                v
                    .replace(/=/g, '')
                    .trim()
                    .split(' | ')
            )
            .flatten()
            .unique()
            .join(' | ')}`
    }
    if (!v) return
    let longer = v?.length >= last?.length
    let parts = v?.split(' ').compact()
    if (parts.length === 1) {
        if (lookbackOp[parts[0]] || parts[0].length < 2) {
            return v
        }
        let op = Object.keys(lookbackOp)
            .filter((f) => v.slice(0, f.length) === f && v.length > f.length)
            .sortBy((v) => -v.length)[0]
        if (op) {
            return { [lookbackOp[op]]: v.slice(op.length) }
        }

        let value = parts[0]
        return value ? { $eq: value } : undefined
    }
    parts[1] = parts
        .slice(1)
        .compact()
        .map((r) => r.replace(/=/, ' | '))
        .join(' ')
    const op = lookbackOp[parts[0]] || '$in'
    if (op === '$in') {
        return {
            $in: parts[1]
                .split('|')
                .filter((c) => longer || c.length > 0)
                .map((c) => c.trim())
                .compact(),
        }
    }
    return { [op]: parts[1] }
}

QueryCascade.propTypes = {
    children: PropTypes.any,
    field: PropTypes.any.isRequired
}

Query.propTypes = {
  field: PropTypes.any,
  fields: PropTypes.any,
  label: PropTypes.any,
  refresh: PropTypes.func,
  type: PropTypes.any
}
