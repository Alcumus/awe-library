/**
 * @module dynamic/awe-library/utils
 */
import events from 'alcumus-local-events'
import { resolveValue, resolveValueAsFunction } from 'common/resolve-value'
import { questionTypeDef } from 'dynamic/awe-library/question-typedef'
import { ensureArray } from 'common/ensure-array'
import { getType, getTypes } from 'dynamic/awe-library/lib/api'
import useAsync, { useCachedAsync } from 'common/use-async'
import * as Behaviours from 'alcumus-behaviours'
import React from 'react'
import uniq from 'lodash/uniq'
import { handle } from 'common/events'
import { initialize } from 'common/offline-data-service/behaviour-cache'
import { useRefresh } from 'common/useRefresh'
import { useDocumentTypeContext } from './document-type-context'
import { useLookup } from 'dynamic/awe-library/runtime/use-lookup'
import { lookup } from 'dynamic/awe-library/runtime/lookup'
import { uiReady } from 'common/ui-ready'
import { getTopic } from 'dynamic/awe-library/runtime/topics'

/**
 * Retrieves a string type descriptor for a type or a type id.  This is used
 * to get the correct visualiser for a type when editing. This at present only
 * returns 'document' for documents and 'application' for applications.
 * @param {string|DocumentDefinition} idOrType - the type to retrieve the id for
 * @returns {string} a string representing the type from the db
 */
export function getTypeFor(idOrType) {
    try {
        const id = typeof idOrType === 'string' ? idOrType : idOrType._id
        return id.split(':')[1].split('/')[1].split('-types')[0].toLowerCase()
    } catch (e) {
        console.error(e)
        throw e
    }
}

/**
 * Return a name only containing legal database characters
 * @param {string} v - the string to convert
 * @returns {string} a converted string
 */
export function legalDbCharacters(v = '') {
    return v.replace(/[^0-9A-Za-z_]+/gi, '')
}

/**
 * Converts a string to a suitable option label by turning camel case and _ to spaces and titlizing the result
 * @param {string} v - the name to convert
 * @returns {string} - a human readable version of the string
 */
export function optionLabel(v = '') {
    return v.spacify().titleize()
}

/**
 * Converts a string to one that is legal for a field identifier
 * @param {string} v - the string to convert
 * @returns {string} the converted legal field name string
 */
export function legalFieldNameCharacters(v = '') {
    return v.replace(/^_/, '').replace(/[^a-zA-Z0-9_]/g, '')
}

/**
 * @callback BehaviourPredicate
 * @global
 * @description Declares a predicate that will determine whether a behaviour should be shown in the UI
 * @param {Array<BehaviourDefinition>} list - the current list of behaviours
 * @param {DocumentDefinition} definition - the current definition of the document or application to which the behaviour may be added
 * @returns {Boolean} truthy if the behaviour should be added
 */

/**
 * @interface BehaviourDefinition
 * @global
 * @description the definition of a behaviour for the UI
 * @property {string} behaviour - the unique name of the behaviour
 * @property {string} caption - a caption to use when displaying the behaviour
 * @property {string} [description] - a longer text description of the behaviour
 * @property {React.Component} Icon - an icon to use for the behaviour
 * @property {string} color - a colour to use for the behaviour
 * @property {Object} [register] - the code to register for the behaviour - if omitted this should be registered directly with Alcumus Behaviours
 */

/**
 * Declares a behaviour to the system so that it appears in the UI as one that
 * can be added to a document or application.  Also if the definition contains a
 * `register` member it will be used to register the behaviours code in addition.
 * @param {BehaviourDefinition} definition - the definition to register
 * @param {...BehaviourPredicate} predicates of predicates that indicates if the behaviour should be added in a context. Some
 * helpers for this exist such as `unique()` which only allow one behaviour of this type to be used in a document. and `classification(type)` which
 * allows the behaviour to only be added to documents or applications by specifying 'document' or 'application'
 * @returns {*}
 */
export function behaviour(definition, ...predicates) {
    const toRegister = definition.register
    delete definition.register
    if (toRegister) {
        Behaviours.register(definition.behaviour, toRegister, true)
    }
    events.emit('newConfig', {
        [definition.behaviour.toLowerCase()]: {
            ...definition.config,
            color: definition.color,
            caption: definition.caption,
        },
    })
    events.return('behaviours.awe', (list) => {
        for (let predicate of predicates) {
            if (!predicate(list, definition)) return
        }

        list.push(definition)
    })
    return definition
}

/**
 * Helper predicate for behaviour definitions. Provides a list of types that should be used.
 * Presently the only options are 'document' and 'application'
 * @param {...string} types - the types to check
 * @returns {function(*): boolean} a function which applies the predicate
 * @example
 behaviour(
 {
        behaviour: 'redisIndexer',
        description: 'Allows you to specify fields to be indexed in Redis',
        Icon,
        caption: 'FindIT™ Index',
        color: theme.palette.primary.main
    },
 unique(),
 classification( 'document' )
 )
 */
export function classification(...types) {
    return (list) => {
        return types.includes(list.type)
    }
}

/**
 * Helper predicate that ensures that only one instance of a behaviour can be added
 * to a document
 * @param {...string} [others] - other behaviours that would prevent this one from being added
 * @returns {function(*=, *): *} a function to apply the predicate
 */
export function unique(...others) {
    let rest = others.flatten()
    return (list, definition) => {
        return (
            list &&
            list.aweType &&
            ![...rest, definition.behaviour].some((i) => !!list.aweType._behaviours.instances[i])
        )
    }
}

/**
 * Decorates an object with other properties that will not be persisted and
 * are read only
 * @param {Object} obj - the object to decorate
 * @param {Object} withProps - the properties to add
 * @returns {Object} obj (which has been decorated)
 */
export function decorate(obj, withProps) {
    for (let [key, value] of Object.entries(withProps)) {
        Object.defineProperty(obj, key, {
            get() {
                return value
            },
            configurable: true,
        })
    }
    return obj
}

async function processFields(type, purpose, seen = {}) {
    let referenceType = await getType(type)
    if (!referenceType) return []
    await initialize(referenceType)
    const fields = referenceType.sendMessage('fields', [], purpose)
    const output = []
    for (let field of fields) {
        let subType = field.dataSource?.dataType || field.lookupType
        if (field.topic) {
            if (seen[field.topic] > 0) continue
            seen[field.topic] = (seen[field.topic] || 0) + 1
            const topic = await getTopic(field.topic)
            const concern = topic.concerns.find((c) => c.name === ensureArray(field.concern)[0])
            if (concern) {
                subType = concern.defaultType
            }
        }
        if (subType) {
            const subFields = await processFields(subType, purpose, seen)
            for (let subField of subFields) {
                output.push({
                    ...subField,
                    field: `_info.${field.name}.rows[0].${subField.field}`,
                    caption: `${field.name} > ${subField.caption}`,
                })
            }
        } else {
            if (!field.name.startsWith('_')) {
                output.push({ caption: field.name, field: field.name, type })
            }
        }
    }
    return output
}

/**
 * Decorates the fields list with their type and field definition
 * @param {Array<FieldDefinition>} fields
 * @returns {Array<FieldDefinition>} the fields array where each element has a $type for its type and $field for its typedef
 */
export async function decorateFields(fields) {
    for (let field of fields) {
        if (field.$type) continue
        const $type = await getType(field.type)
        const $field = lookup($type)[field.name]
        decorate(field, { $type, $field })
    }
    return fields
}

Function.prototype.use = function (...params) {
    const fn = this
    return useCachedAsync(
        this.name,
        async () => {
            return await fn(...params)
        },
        null,
        JSON.stringify(params)
    )
}

/**
 * Uses a function as a cached async, the function name must be present and unique
 * @param {Function} fn - a function to be used for cached async
 * @param {...*} [params] - parameters for the function
 * @returns {*} the cached async result of running the function
 */
export function use(fn, ...params) {
    return useCachedAsync(
        fn.name,
        async () => {
            return await fn(...params)
        },
        null,
        JSON.stringify(params)
    )
}

/**
 * Returns a list of fields that can be used in a group by operation
 * @param {DocumentDefinition} type
 * @returns {Array<FieldDefinition>} the fields which can be grouped by
 */
export function useGroupByFields(type) {
    return getAndDecorate.use(type) || []

    async function getAndDecorate() {
        const fields = (await processFields(type, 'groupBy')) || []
        return await decorateFields(fields)
    }
}

/**
 * Retrieves all the fields of a type
 * @param {DocumentDefinition} type
 * @returns {Promise<Array<FieldDefinition>>} the fields of the type
 */
export async function getFields(type) {
    let referenceType = typeof type === 'object' ? type : await getType(type)
    await initialize(referenceType)
    return referenceType.sendMessage('fields', [])
}

/**
 * Retrieve the typedef of a field by name from the current document as a hook
 * @param {string} fieldName
 * @returns {FieldDefinition} the definition of the field
 */
export function useField(fieldName) {
    const lookup = useLookup()
    return lookup[fieldName]
}

/**
 * Uses all of the fields of a type, optionally including those from related records
 * @param {DocumentDefinition|string} type - the type whose fields should be retrieved
 * @param {boolean} deep - true if related fields should be returned
 */
export function useFields(type, deep = false) {
    return useAsync(
        // `getFieldsForType${deep}`,
        async () => {
            if (!type) return deep ? [{}, {}] : []
            await uiReady()
            let referenceType = Object.isObject(type) ? type : await getType(type)
            await initialize(referenceType)
            await referenceType.sendMessage('refresh')
            if (deep) {
                const result = {}
                const linkFields = {}
                await referenceType.sendMessage('deepFields', result, linkFields)
                return [result, linkFields]
            } else {
                const result = []
                await referenceType.sendMessage('fields', result)
                return result
            }
        },
        deep ? [{}, {}] : [],
        type
        // Date.now() / 15000 | 0
    )
}

/**
 * Defines a question for AWE, registering it with the UI
 * @param {Array<QuestionTypeDef>|QuestionTypeDef|function():QuestionTypeDef} typesOrFunction - the definition to make
 */
export function questionType(typesOrFunction) {
    events.return('awe.question-types', resolveValueAsFunction(typesOrFunction))

    let types = ensureArray(resolveValue(typesOrFunction) || [])
    for (let type of types) {
        events.emit('newConfig', {
            [type.value.toLowerCase()]: {
                caption: type.label,
                color: type.color,
                sort: type.sort,
                map: type.map,
                icon: type.icon,
            },
        })
    }
}

/**
 * @callback ConfigFunction
 * @global
 * @description A function to configure a new instance of a component
 * @param {object} instance - the instance to be configured
 */

/**
 * @interface TrackComponentDefinition
 * @global
 * @description a definition for a component that can appear
 * on the tracks of a Chase behaviour
 * @property {JSX.Element} icon - the icon to use
 * @property {string} label - the label for the track component in lists
 * @property {string} description - a description of the purpose of the track component
 * @property {ConfigFunction} [config] - a function that can be used to configure a new instance of the component
 * @property {string} color - the colour to use for the component
 * @property {string} value - the unique name of the component
 */

/**
 * A function that registers providers of Chase "track" components
 * so that they can be added to the track in the user interface
 * @param {TrackComponentDefinition} typesOrFunction - the definition of the track component
 * @example
 trackComponent({
    value: 'assignTask',
    label: 'Assign Task',
    description: 'Assigns a task to a topic',
    icon: <GoTasklist />,
    config(task) {
        task.fulfilment = {
            type: FULFILMENT_TYPES[0],
        }
    },
    color: theme.palette.primary.main,
})
 */
export function trackComponent(typesOrFunction) {
    handle('awe.track-components', function (list) {
        list.push(...ensureArray(resolveValueAsFunction(typesOrFunction)()))
    })

    let types = ensureArray(resolveValue(typesOrFunction) || [])
    for (let type of types) {
        events.emit('newConfig', {
            [type.value.toLowerCase()]: {
                caption: type.label,
                color: type.color,
                sort: type.sort,
                map: type.map,
                icon: type.icon,
            },
        })
    }
}

/**
 * Specifically for use with the Chase behaviour, this registers a component
 * as being able to make a list of events.  For instance it could represent
 * an external system that emitted its own events, and this would be a way
 * in which the Chase behaviour knew that they could be waited for.
 * @param {string} type - type of events
 * @param {Function} eventSource - a function that will be called with the existing context to get the events
 */
export function eventSource(type, eventSource) {
    handle(`awe.event-source.${type}`, function (list, item, owner) {
        let result = eventSource({ item, owner }, list)
        if (Array.isArray(result)) {
            list.push(...result.filter((f) => !!f))
        } else if (typeof result === 'object') {
            list.push(...Object.values(result).filter((f) => !!f))
        }
    })
}

/**
 * Helper function that tries to extract a caption for a question if one hasn't been provided
 * @param {FieldDefinition} question - the question whose caption should be created
 * @param {QuestionTypeDef} [type] - the already resolved type if available
 * @returns {string} the caption for the question
 */
export function questionCaption(question, type) {
    type = type || questionTypeDef(question)
    return (
        (type.caption ? type.caption(question) : undefined) ||
        question.question.replace(/\s*<p><\/p>\s*/g, '') ||
        question.inputLabel ||
        question.name ||
        type.captionValue ||
        type.label
    )
}

/**
 * @interface HintList
 * @global
 * @description A list of hints for a target
 * @property {Array<string>} hints - a list of hints currently associated
 */

/**
 * @callback HintPredicate
 * @global
 * @description A call back to decide whether hints should be added to a list
 * @param {FieldDefinition} target - the item for which hints are being discovered
 * @param {HintList} info - the list of existing hints
 * @returns {boolean} true if the hints should be added
 */

/**
 * @callback HintFunction
 * @global
 * @description A function that returns the hints to associate with a question/field
 * @returns {Array<string>} an array of hints
 */

/**
 * Registers a hint producing function.  The function is called
 * to supply hints for a question type in the UI.  Hints act as
 * simple switches to enable extension functionality or alternate
 * versions of the UI for rendering questions.  Hints are strings
 * that describe a property of the FieldDefinition - so they normally
 * only contain legal characters for JavaScript identifiers.
 * @param {HintPredicate|string} predicate - a predicate to decide whether the hints should be added, either a function or the question type as a string
 * @param {Array<string>|HintFunction} hintsOrFn - an array of hints or a function to produce an array of hints
 */
export function hints(predicate, hintsOrFn) {
    hintsOrFn = resolveValueAsFunction(hintsOrFn)
    setTimeout(() => {
        events.on('awe.question-hints', function (event, info) {
            if (typeof predicate === 'function') {
                if (predicate.call(info.target, info.target, info)) {
                    info.hints.push.apply(
                        info.hints,
                        Array.isArray(hintsOrFn) ? hintsOrFn : hintsOrFn.call(info.target)
                    )
                }
            } else {
                if (predicate === info.target.type) {
                    info.hints.push.apply(
                        info.hints,
                        Array.isArray(hintsOrFn) ? hintsOrFn : hintsOrFn.call(info.target)
                    )
                }
            }
        })
    })
}

/**
 * Support function that logs if a call takes more than a specified
 * amount of time to return
 * @param {function} fn - the function to wrap
 * @param {number} [delay=3000] - the time in m/s that the function should execute in less than
 * @returns {function} a wrapped version of fn that will log if it takes more than the delay
 */
export function logErrorOnLongCall(fn, delay = 3000) {
    return async function (...params) {
        const id = setTimeout(problem, delay)
        try {
            await fn(...params)
        } catch (e) {
            console.error(e)
        } finally {
            clearTimeout(id)
        }

        function problem() {
            // eslint-disable-next-line no-console
            console.trace('timeout', ...params)
        }
    }
}

/**
 * @typedef {Object.string<string, FieldDefinition>} DeepFieldDictionary
 * @global
 * @description a lookup of a field definition from it's property path syntax
 */

/**
 * @interface DeepFieldDefinition
 * @global
 * @description An object which describes the deep field data for a FieldDefinition
 * @property {Array<string>} path - the path to the current target, this is like property syntax but split into an array on '.'
 * @property {FieldDefinition} target - the current target of the deep field request
 * @property {DeepFieldDictionary} dictionary - a dictionary of all property paths to their definitions (including '.') - this is automatically populated from base fields
 * @property {DeepFieldDictionary} linkFields - a dictionary of all property paths to their definitions (including '.') - this is automatically populated from link fields
 * @property {boolean} addBaseField - set this to true to add the current target as a base field
 * @property {boolean} addLinkField - set this to true to add the current target as a link field (it's value is the ID of a linked record)
 */

/**
 * @callback DeepFieldPredicate
 * @global
 * @description a callback that decides if there is a deep field list
 * for a particular target
 * @param {FieldDefinition} target
 * @param {DeepFieldDefinition} info
 */

/**
 * @callback DeepFieldFunction
 * @global
 * @description a callback that is provided with information on a
 * definition and reacts by setting addBaseField and addLinkField properties
 * to indicate how the question/field should be treated.
 * @param {FieldDefinition} target - the target question being considered
 * @param {DeepFieldDefinition} info - the info about the current context that
 * should be updated to adjust the field specified.
 */

/**
 * Discovers the "Deep" fields from a question type.  This is called
 * to find related columns and make their metadata available and also
 * to identify local columns that contain user entered data.  If
 * a question represents a record in a different table for instance,
 * a responder to this registration would be required to gather the
 * relevant metadata.  The deep field function returns whether the
 * current question should form part of the "base" in this case the
 * field itself has a meaningful local value the user would be interested in
 * or a "link" linkage, in which case the data is
 * in another record and the value is the ID of that record, that should
 * not be shown to the user.  The result is returned through the properties
 * of the configuration
 * @param {string|DeepFieldPredicate} predicate
 * @param {DeepFieldFunction} deepFieldFn
 */
export function deepFields(predicate, deepFieldFn) {
    deepFieldFn = resolveValueAsFunction(deepFieldFn)
    setTimeout(() => {
        events.on('awe.deep-fields', async function (event, info) {
            if (info.path.length > 2) return
            if (typeof predicate === 'function') {
                if (predicate.call(info.target, info.target, info)) {
                    await logErrorOnLongCall(deepFieldFn)(info)
                }
            } else {
                if (predicate === info.target.type) {
                    await logErrorOnLongCall(deepFieldFn)(info)
                }
            }
        })
    })
}

/**
 * @interface PropertySheetComponents
 * @global
 * @description A structure that contains info about the components being added
 * @property {string} type - the string type of the current type of selection
 * @property {object} selected - the currently selected item
 * @property {Array<React.Component>} Components - the components to render as property editors
 */

/**
 * @callback TabPredicate
 * @global
 * @description A predicate that returns whether a tab should be added to the properties area
 * @param {string} type - the string type of the current selection, this is an arbitrary value that the
 * thing doing the selection sets.  It's 'question' for questions and 'group' for groups
 * @param {object} selected - whatever the user has currently selected
 * @param {PropertySheetComponents} info - a structure which contains the current selected tabs for the selection
 * @returns {boolean} returns truthy to have the Components specified added to the property editor
 */

/**
 * Registers one or more property editors for the current
 * target of a selection.  The ThingBuilder UI can select
 * a wide range of things, and this allows the rendering of a
 * property page for any of them.
 *
 * There are a number of different things that you might want
 * to add property editors for.  The most obvious is "question"
 * but here are some others.
 *
 * <table>
 *     <thead>
 *         <tr>
 *             <th>Type</th>
 *             <th>Description</th>
 *         </tr>
 *     </thead>
 *     <tbody>
 *         <tr>
 *             <td>formAction</td>
 *             <td>An action displayed on the Activity editor screen</td>
 *         </tr>
 *         <tr>
 *             <td>section</td>
 *             <td>The group of questions on a form</td>
 *         </tr>
 *         <tr>
 *             <td>published</td>
 *             <td>A published version of a document</td>
 *         </tr>
 *         <tr>
 *             <td>question</td>
 *             <td>A question on a form</td>
 *         </tr>

 *     </tbody>
 * </table>
 *
 *
 * @param {TabPredicate} predicate - a predicate to identify the criteria by which the subsequent components should be added
 * @param {...React.Component} Components - the components that should be used as property pages when the predicate succeeds
 * @see {@link module:dynamic/awe-library/utils.tab}
 */
export function tabs(predicate, ...Components) {
    predicate = ensureArray(predicate)
    predicate.forEach((predicate) => {
        setTimeout(() => {
            for (let Component of Components.flatten()) {
                events.on('awe.editor.tabs', function (event, info) {
                    if (typeof predicate === 'function') {
                        if (predicate.call(info.selected, info.type, info.selected, info)) {
                            if (!info.Components.find((c) => c.toString() === Component.toString()))
                                info.Components.push(Component)
                        }
                    } else {
                        if (predicate === info.type) {
                            if (!info.Components.find((c) => c.toString() === Component.toString()))
                                info.Components.push(Component)
                        }
                    }
                })
            }
        })
    })
}

/**
 * A helper function to use in behaviours to add additional editor
 * tabs for a field/question or other type.  This enables a behaviour
 * to extend the standard global properties of anything. The result
 * is a function that can be used as the "editorTabs" method of a behaviour.
 * @param {TabPredicate} predicate - the predicate function to use
 * @param {React.Component} Component - the component to use if the predicate succeeds
 * @returns {function(*=): void} A function to add the tab when appropriate
 * @see {@link module:dynamic/awe-library/utils.tabs}
 */
export function tab(predicate, Component) {
    return (info) => {
        if (typeof predicate === 'function') {
            if (predicate(info.type, info.selected, info)) {
                if (!info.Components.find((c) => c.toString() === Component.toString())) info.Components.push(Component)
            }
        } else {
            if (predicate === info.type) {
                if (!info.Components.find((c) => c.toString() === Component.toString())) info.Components.push(Component)
            }
        }
    }
}

/**
 * A helper function that creates a predicate for questions of
 * a specific type or types
 * @param {...string} questionType - the types of question that will
 * pass the predicate
 * @returns {function} a predicate function matching the specification
 */
export function whenQuestionTypeIs(...questionType) {
    return (type, selected) => {
        return type === 'question' && questionType.includes(selected.type)
    }
}

/**
 * A helper function that creates a predicate for track components
 * with specific type or types
 * @param {...string} trackType - the types that should match
 * @returns {function} a predicate function for track components with the
 * provided types
 */
export function whenTrackComponentIs(...trackType) {
    return (type, selected) => {
        return type === 'track' && trackType.includes(selected.type)
    }
}

/**
 * @callback QuestionPredicateFunction
 * @global
 * @param {QuestionTypeDef} type - the typedef of the question being tested
 * @param {FieldDefinition} instance - the current instance being tested
 * @returns {boolean} - true if the predicate is satisfied
 */

/**
 * Creates a predicate function for questions that succeed with a
 * predicate which is supplied with the typedef and the
 * instance (this is a helper function to wrap a common way
 * of testing questions).
 * @param {QuestionPredicateFunction} predicate - the predicate to use
 * @returns {function} a predicate function for questions matching
 * the helper predicate
 */
export function whenQuestionMatches(predicate = () => true) {
    return (type, selected) => {
        return type === 'question' && predicate(questionTypeDef(selected), selected)
    }
}

/**
 * A helper to create a predicate for questions that have a specific
 * hint set
 * @param {string} hint - the hint that must be set
 * @returns {function} a predicate for questions with the specified
 * hint
 */
export function whenQuestionHasHint(hint) {
    return (type, selected) => {
        return type === 'question' && selected?.hints?.[hint]
    }
}

/**
 * Returns whether an item with a name is blank or if the parameter
 * is a string, tests that it is not blank
 * @param {string|FieldDefinition} fieldOrName
 * @returns {boolean} true if the name or string is not blank
 */
export function isNotBlank(fieldOrName) {
    return (fieldOrName && fieldOrName.name && !!fieldOrName.name.trim()) || (fieldOrName && typeof fieldOrName === 'string' && !!fieldOrName.trim())
}

/**
 * Extracts the name of a field
 * @param {FieldDefinition} field
 * @returns {string} the name
 */
export function extractFieldName(field) {
    return field && field.name
}

/**
 * Helper to create a function which tests if a field is defined on the
 * initial document, rather than through a sub document or
 * sub element of the document.
 * @param {function(FieldDefinition): boolean} [fn] - optional additional field check function passed the field
 * @returns {function(FieldDefinition): boolean} a function that
 * tests a field for a sub field
 */
export function basicField(fn = () => true) {
    return function (item) {
        return !/(^\$|_)|(\.\$|_)/.test(typeof item === 'string' ? item : item.name) && fn(item)
    }
}

/**
 * Creates a function that returns whether a field is local
 * to the current document.  Provided with a set of fields
 * it inspects the types and handles array fields and subForms
 * appropriately.
 * @param {Array<FieldDefinition>} fields - the fields which are
 * part of the current document
 * @returns {function(FieldDefinition): boolean} a function that returns
 * true for locally located fields
 */
export function fieldBelongsLocally(fields) {
    const lookup = fields.groupBy('name')
    return function (field) {
        const name = typeof field === 'string' || field?.name
        if (!name) return false
        switch (lookup[name]?.[0]?.type) {
            case 'subForm':
            case 'array':
                return false
        }
        const parts = name.split('.')
        if (parts.length === 1) return true
        switch (lookup[parts[0]]?.[0]?.type) {
            case 'subForm':
            case 'array':
                return true
        }
        return false
    }
}

/**
 * A filter that tests a field and returns true if the field is
 * at the top level of a chain
 * @param {string|FieldDefinition} field - the field to be tested
 * @returns {boolean} true if the field tested is a top level field
 */
export function topLevelField(field) {
    return (field && field.name && !field.name.includes('.')) || (field && typeof field === 'string' && !field.includes('.'))
}

/**
 * Helper function to create a predicate which tests that a field name
 * matches a defined one.
 * @param {string} name - the name that should be tested for
 * @returns {function(*): boolean} a predicate that tests
 * for the supplied name
 */
export function fieldNameIs(name) {
    return function (f) {
        return f && f.name === name
    }
}

/**
 * Provided with an instance or a document, return all of the
 * available states for it
 * @param {DocumentDefinition|object} instance - the instance to test
 * @returns {Array<string>} the available states
 */
export function getStates(instance) {
    const { type } = useDocumentTypeContext()
    return uniq(
        instance.sendMessage('availableStates', [type.defaultState || 'default'], instance.document, instance).flatten()
    ).filter(isNotBlank)
}

/**
 * Support dummy function that just returns the value it is passed,
 * this is useful as the default value of parameters that supply
 * projection functions
 * @param {*} v - value
 * @returns {*} the value is returned without modification
 */
export function returnValue(v) {
    return v
}

/**
 * @interface TableDefinition
 * @global
 * @description Describes a table in the database
 * @property {string} value - the database/table entry
 * @property {string} label - a human readable label for the entry
 * @property {Array<FieldDefinition>} fields - all of the fields in the table
 * @property {Array<string>} types - the list of document types that can write to the table
 */

/**
 * A hook which returns all of the database/table combinations
 * for the current in context types (for the current client and
 * global)
 * @param {string} [id] - an id that is used to decide if a refresh is required
 * @returns {Array<TableDefinition>} the tables and their fields
 */
export function useTables(id) {
    const refresh = !id && useRefresh()
    return useCachedAsync(
        'getTables',
        async () => {
            const types = await getTypes()
            const groups = types
                .filter((t) => !!t.database && !!t.table)
                .groupBy((type) => `${type.database.toLowerCase()}/${type.table.toLowerCase()}`)
            const results = await Promise.all(
                Object.keys(groups).map(async (key) => {
                    const list = groups[key].map('name').join(', ')
                    const fields = []
                    for (let item of groups[key]) {
                        await initialize(item)
                        item.sendMessage('fields', fields)
                    }
                    const ref = groups[key][0]
                    return {
                        value: key,
                        label: `${ref.database} / ${ref.table} (${list})`,
                        fields,
                        types: groups[key],
                    }
                })
            )
            return Object.assign(results.sortBy('label'), { _loaded: true })
        },
        [],
        id,
        refresh.id
    )
}

/**
 * Helper to check whether a field is a standard field
 * @param {FieldDefinition} field - the field to test
 * @returns {boolean} true if the field is standard
 */
export function isStandardField(field) {
    return field && field.name && !/^[$_]/.test(field.name)
}

/**
 * Returns if a field definition is stored in the database
 * @param {FieldDefinition} field - the field to check
 * @returns {boolean} true if the field is stored
 */
export function isStoredInRecord(field) {
    return !!field.name
}
