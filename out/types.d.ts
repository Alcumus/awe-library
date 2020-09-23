declare module "dynamic/awe-library/bind" {
    /**
     * <p>Create a function to binds the property functions on an object to the current this pointer.</p>
     * <p>This function is often used in behaviours as the definition of the <code>initialized</code> method to
     * ensure that the necessary methods of a behaviour are correctly bound to the this so it can
     * be used to access the behaviour definition while coding the implementation.</p>
     * @example
     * register(
     *  'examplePerQuestionBehaviour',
     *  {
     *         methods: {
     *             initialized: bind('Renderer'),
     *             // Render before a component
     *             //beforeRender,
     *             // Render after a component
     *             afterRender,
     *             // This is the internally declared component that will do the render
     *             Renderer,
     *         },
     *     },
     *  true
     * )
     * @param props - <p>the names or function to bind</p>
     * @returns <p>Binding function</p>
     */
    function bind(...props: any[]): (...params: any[]) => any;
}

declare module "dynamic/awe-library/document-type-context" {
    /**
     * <p>The DocumentTypeContext provides access to a range of
     * useful properties of a document currently being edited in
     * the ThingBuilder interface.  You can use this in any sub
     * component to access these properties.</p>
     * <p>The most useful property is probably 'type' which is the
     * whole of the currently edited document</p>
     * <p>It is most often accessed through the helper useDocumentTypeContext()
     * method</p>
     */
    const DocumentTypeContext: React.Context<IDocumentTypeContext>;
    /**
     * <p>Access the current DocumentTypeContext which contains
     * useful information about the currently edited type
     * in ThingBuilder.</p>
     * @returns <p>the current context</p>
     */
    function useDocumentTypeContext(): IDocumentTypeContext;
}

/**
 * <p>An interface into the currently edited document and
 * methods to support it. You can get this through <code>useDocumentTypeContext()</code></p>
 * @property type - <p>the whole of the currently edited definition</p>
 * @property save - <p>call to save the current definition</p>
 * @property refresh - <p>call to refresh the whole document view</p>
 * @property undo - <p>call to undo the last operation</p>
 * @property redo - <p>call to redo the last undone operation</p>
 * @property update - <p>call to replace the document definition with another</p>
 */
declare interface IDocumentTypeContext {
    type: object;
    save: ()=>void;
    refresh: ()=>void;
    undo: ()=>void;
    redo: ()=>void;
    update: (object)=>void;
}

declare module "dynamic/awe-library/fields" {
    /**
     * <p>Returns a document type associated with a field definition.</p>
     * <p>Both topics and lookup fields have related types, this returns
     * the type to which they refer.</p>
     * @param field - <p>the field to return the value of</p>
     * @returns <p>a promise for the document definition</p>
     */
    function getTypeFromField(field: FieldDefinition): Promise<DocumentDefinition>;
    /**
     * <p>Returns a list of fields associated with the source provided.
     * The source may be an existing field list, a type definition or the
     * string ID of a type.  The result is a list of the associated fields
     * available on the type.</p>
     * <p>The results include fields in related tables.</p>
     * @param source - <p>the source to retrieve fields from</p>
     * @returns <p>a promise for an array of field definitions</p>
     */
    function getFieldList(source: DocumentDefinition | string | FieldDefinition[]): Promise<FieldDefinition[]>;
    /**
     * <p>Provides a hook to access all of the fields of a type or
     * a list of existing fields, the result includes field in related
     * tables.</p>
     * @param [sourceFields] - <p>a list of source fields</p>
     * @param [type] - <p>a type to retrieve the fields from</p>
     * @returns <p>returns the list of fields (or an empty array until available)</p>
     */
    function useFieldList(sourceFields?: FieldDefinition[], type?: string | DocumentDefinition): FieldDefinition[];
    /**
     * <p>Retrieves the definition of a question based on a &quot;property path&quot;
     * string that may dive into related tables. e.g. manager.primarySite.name</p>
     * <p>The call returns the question definition AND the associated document</p>
     * @param question - <p>property path of the question</p>
     * @param document - <p>the document to which the first part of the property path syntax belongs</p>
     * @returns <p>the question and document looked up as two members of an array</p>
     */
    function useQuestion(question: string, document: DocumentDefinition): any[];
}

/**
 * <p>A definition of a field/question.  An object implementing this
 * interface may store lots of other information based on its type</p>
 * @property [name] - <p>the database field that will be updated by this question, blank if not stored</p>
 * @property type - <p>the type of this definition</p>
 */
declare interface FieldDefinition {
    name?: string;
    type: string;
}

/**
 * <p>A lookup map of behaviour name to an array of instances of that behaviour</p>
 */
declare interface BehaviourKeys {
    [key: string]: object[];
}

/**
 * <p>The behaviours associated with a type</p>
 * @property instances - <p>an object containing the instances of behaviours associated with a type, the key is the behaviour name and the value is an array of instances of that behaviour</p>
 */
declare interface Behaviours {
    /**
     * <p>Call the specified function on any methods attached
     * to behaviours on the document</p>
     * @param message - <p>the name of the message to send</p>
     * @param [params] - <p>the parameter for the method</p>
     * @returns <p>the result of calling the method on all of the behaviours</p>
     */
    sendMessage(message: string, ...params: any[]): any;
    /**
     * <p>Call the specified function on any methods attached
     * to behaviours on the document and return a promise for the value</p>
     * @param message - <p>the name of the message to send</p>
     * @param [params] - <p>the parameter for the method</p>
     * @returns <p>a promise for the result of calling the method on all of the behaviours</p>
     */
    sendMessageAsync(message: string, ...params: any[]): Promise<any>;
}

/**
 * <p>The definition of a document or application type</p>
 * @property behaviours - <p>the behaviours of this document</p>
 * @property name - <p>the name of this definition</p>
 * @property _id - <p>the unique ID of this document or application</p>
 */
declare interface DocumentDefinition {
    behaviours: BehaviourKeys;
    name: string;
    _id: string;

    /**
     * <p>Call the specified function on any methods attached
     * to behaviours on the document</p>
     * @param message - <p>the name of the message to send</p>
     * @param [params] - <p>the parameter for the method</p>
     * @returns <p>the result of calling the method on all of the behaviours</p>
     */
    sendMessage(message: string, ...params: any[]): any;

    /**
     * <p>Call the specified function on any methods attached
     * to behaviours on the document and return a promise for the value</p>
     * @param message - <p>the name of the message to send</p>
     * @param [params] - <p>the parameter for the method</p>
     * @returns <p>a promise for the result of calling the method on all of the behaviours</p>
     */
    sendMessageAsync(message: string, ...params: any[]): Promise<any>;
}

declare module "dynamic/awe-library/lookup-fields" {
    interface FieldLookup {
    }
    /**
     * <p>Provides a lookup of all of the fields in a document type</p>
     * @returns <p>the lookup of the fields (using both .id and .name)</p>
     */
    function lookup(document: DocumentDefinition): FieldLookup;
}

declare module "dynamic/awe-library/query" {
    /**
     * <p>A cascade of query definitions.  The principle is that a record
     * included in an earlier query is not available to subsequent queries.</p>
     */
    function QueryCascade(props: QueryCascadeApi): React.Component;
    /**
     * <p>Provided with a query definition from a Query component, this
     * function creates a human readable definition of the query</p>
     * @param where - <p>the query to process</p>
     * @returns <p>a human readable version of the query</p>
     */
    function convertToText(where: QueryDefinition): string;
    /**
     * <p>Defines a query editing UI</p>
     * @returns <p>A query editor</p>
     */
    function Query(props: QueryApi): React.Component;
}

/**
 * <p>the parameters passed to a QueryCascade component. Other properties
 * are passed on to the Query components used</p>
 * @property field - <p>the name of the field in which to store the definition</p>
 * @property [children] - <p>additional content to render for each entry</p>
 */
declare interface QueryCascadeApi {
    field: string;
    children: Array<React.Component>;
}

/**
 * <p>A definition of a query for the Query component, allows
 * processing of queries down to sub levels and uses a MongoDb
 * style method of storage</p>
 */
declare interface QueryDefinition {
}

/**
 * <p>a function that is used to cause a redraw of part of the UI</p>
 * @property id - <p>an id for the current refresh of the component</p>
 * @property () - <p>cause a refresh</p>
 */
declare interface RefreshFunction {
    id: string;
    ();
}

/**
 * <p>the parameters passed to a Query component. Other properties
 * are passed on to the Material UI TextField used</p>
 * @property type - <p>the document or application type on which this query will operate</p>
 * @property parentRefresh - <p>a function passed that will refresh the parent of the component</p>
 * @property [fields] - <p>optional list of fields to use, if omitted it is derived</p>
 * @property fieldName - <p>the field in which the query is stored</p>
 */
declare interface QueryApi {
    type: string;
    parentRefresh: RefreshFunction;
    fields: Array<FieldDefinition>;
    fieldName: string;
}

declare module "dynamic/awe-library/question-type-def" {
    /**
     * <p>Provides a key value pair lookup for document types to their
     * definitions</p>
     * @returns <p>the function to call to get the lookup types</p>
     */
    function lookupTypes(): (...params: any[]) => any;
    /**
     * <p>Given a question string type or FieldDefinition, returns the object that
     * describes that type</p>
     * @param type - <p>the type of question to retrieve</p>
     */
    function questionTypeDef(type: string | FieldDefinition): QuestionTypeDef;
    /**
     * <p>A function to retrieve all current question types</p>
     * @returns <p>the currently available questions</p>
     */
    function allTypes(): QuestionTypeDef;
}

/**
 * <p>A type definition for a question, includes whether this item
 * is stored, the icon etc.</p>
 * <p>All properties are NOT fully documented below.</p>
 * @property [group = ""] - <p>the group for the question in the ui, organises the ui into sections
 * The groups can be: &quot;control&quot;, &quot;layout&quot;, &quot;create&quot;, &quot;display&quot; - no group puts
 * the question in the data capture section.</p>
 * @property icon - <p>an icon to use for the question</p>
 * @property [caption] - <p>a function to extract a caption for the question for display in the editor</p>
 * @property [config] - <p>a config function to initialise an instance</p>
 * @property value - <p>the type of the question</p>
 * @property label - <p>the label to use for the question in lists</p>
 * @property color - <p>the colour to use for the question icon</p>
 * @property description - <p>a long description of the function of the question</p>
 * @property isSearchable - <p>set to <code>false</code> to disable searching on the field or <code>true</code> to allow it</p>
 * @property [notRequired = false] - <p>set to true if the field type cannot be required</p>
 * @property [stored = true] - <p>must be <code>false</code> not falsey to disable storing the question (an instance doesn't have a name in this case)</p>
 */
declare interface QuestionTypeDef {
    group: string;
    icon: JSX.Element;
    caption?: string;
    config?: ConfigFunction;
    value: string;
    label: string;
    color: string;
    description: string;
    isSearchable?: boolean;
    notRequired?: boolean;
    stored?: boolean;
}

declare module "dynamic/awe-library/use-types" {
    /**
     * @property _id - <p>the id of the type</p>
     * @property modified - <p>the modification date of the type</p>
     * @property created - <p>the create date of the type</p>
     * @property type - <p>'doc' for document 'app' for apps</p>
     */
    interface DocumentRecord {
    }
    /**
     * <p>Returns a list of types that DOES NOT include
     * the definition of the type, but can be used
     * to get the names and ids</p>
     * @param [refreshId] - <p>an id used to indicate if a cached list should be refreshed</p>
     * @returns <p>the types available in the system (includes both apps and documents) and only includes name and type etc</p>
     */
    function useTypeList(refreshId?: string): DocumentRecord[];
    /**
     * <p>Retrieves a list of types including all of their definition, this
     * only includes Document types</p>
     * @param [refreshId] - <p>an id to indicate whether the list should be refreshed</p>
     * @returns <p>the types available in the current context  (client)</p>
     */
    function useTypes(refreshId?: string): DocumentRecord[];
    /**
     * <p>Retrieves a list of types including all of their definition, this
     * only includes Application types</p>
     * @param [refreshId] - <p>an id to indicate whether the list should be refreshed</p>
     * @returns <p>the types available in the current context  (client)</p>
     */
    function useApps(refreshId?: string): DocumentRecord[];
    /**
     * <p>Given an id, retrieves the type and fully initialises it.  This
     * process involves hydrating and applying all behaviour functions.
     * The result is capable of fully responding to messages etc.</p>
     * @param id - <p>the id of the type to return</p>
     * @param [whenReady] - <p>callback for when the type is ready, this may be async</p>
     * @returns <p>a promise for the initialised document</p>
     */
    function getTypeAndInitialise(id: string, whenReady?: (...params: any[]) => any): Promise<DocumentDefinition>;
    /**
     * <p>A hook which given an id, retrieves the type and fully initialises it.  This
     * process involves hydrating and applying all behaviour functions.
     * The result is capable of fully responding to messages etc.</p>
     * @param id - <p>the id of the definition to retrieve</p>
     * @param [whenReady] - <p>a callback when the type has been initialized, before it is returned. Maybe async.</p>
     * @returns <p>retrieved document definition</p>
     */
    function useType(id: string, whenReady?: (...params: any[]) => any): DocumentDefinition | null;
    /**
     * <p>This retrieves the currently published and active version of a
     * type.  This is the one that should be created if necessary in the
     * current context.  The context can be live, debugging or test depending
     * on URL parameters.</p>
     * @param type - <p>the id of the type to get the published version of</p>
     * @returns <p>the currently active published version of the type</p>
     */
    function getPublishedVersionOfType(type: string): Promise<DocumentDefinition>;
}

declare module "dynamic/awe-library/utils" {
    /**
     * <p>Retrieves a string type descriptor for a type or a type id.  This is used
     * to get the correct visualiser for a type when editing. This at present only
     * returns 'document' for documents and 'application' for applications.</p>
     * @param idOrType - <p>the type to retrieve the id for</p>
     * @returns <p>a string representing the type from the db</p>
     */
    function getTypeFor(idOrType: string | DocumentDefinition): string;
    /**
     * <p>Return a name only containing legal database characters</p>
     * @param v - <p>the string to convert</p>
     * @returns <p>a converted string</p>
     */
    function legalDbCharacters(v: string): string;
    /**
     * <p>Converts a string to a suitable option label by turning camel case and _ to spaces and titlizing the result</p>
     * @param v - <p>the name to convert</p>
     * @returns <ul>
     * <li>a human readable version of the string</li>
     * </ul>
     */
    function optionLabel(v: string): string;
    /**
     * <p>Converts a string to one that is legal for a field identifier</p>
     * @param v - <p>the string to convert</p>
     * @returns <p>the converted legal field name string</p>
     */
    function legalFieldNameCharacters(v: string): string;
    /**
     * <p>Declares a behaviour to the system so that it appears in the UI as one that
     * can be added to a document or application.  Also if the definition contains a
     * <code>register</code> member it will be used to register the behaviours code in addition.</p>
     * @param definition - <p>the definition to register</p>
     * @param predicates - <p>of predicates that indicates if the behaviour should be added in a context. Some
     * helpers for this exist such as <code>unique()</code> which only allow one behaviour of this type to be used in a document. and <code>classification(type)</code> which
     * allows the behaviour to only be added to documents or applications by specifying 'document' or 'application'</p>
     */
    function behaviour(definition: BehaviourDefinition, ...predicates: BehaviourPredicate[]): any;
    /**
     * <p>Helper predicate for behaviour definitions. Provides a list of types that should be used.
     * Presently the only options are 'document' and 'application'</p>
     * @example
     * behaviour(
     *  {
     *         behaviour: 'redisIndexer',
     *         description: 'Allows you to specify fields to be indexed in Redis',
     *         Icon,
     *         caption: 'FindIT™ Index',
     *         color: theme.palette.primary.main
     *     },
     *  unique(),
     *  classification( 'document' )
     *  )
     * @param types - <p>the types to check</p>
     * @returns <p>a function which applies the predicate</p>
     */
    function classification(...types: string[]): (...params: any[]) => any;
    /**
     * <p>Helper predicate that ensures that only one instance of a behaviour can be added
     * to a document</p>
     * @param [others] - <p>other behaviours that would prevent this one from being added</p>
     * @returns <p>a function to apply the predicate</p>
     */
    function unique(...others: string[]): (...params: any[]) => any;
    /**
     * <p>Decorates an object with other properties that will not be persisted and
     * are read only</p>
     * @param obj - <p>the object to decorate</p>
     * @param withProps - <p>the properties to add</p>
     * @returns <p>obj (which has been decorated)</p>
     */
    function decorate(obj: any, withProps: any): any;
    /**
     * <p>Decorates the fields list with their type and field definition</p>
     * @returns <p>the fields array where each element has a $type for its type and $field for its typedef</p>
     */
    function decorateFields(fields: FieldDefinition[]): FieldDefinition[];
    /**
     * <p>Uses a function as a cached async, the function name must be present and unique</p>
     * @param fn - <p>a function to be used for cached async</p>
     * @param [params] - <p>parameters for the function</p>
     * @returns <p>the cached async result of running the function</p>
     */
    function use(fn: (...params: any[]) => any, ...params: any[]): any;
    /**
     * <p>Returns a list of fields that can be used in a group by operation</p>
     * @returns <p>the fields which can be grouped by</p>
     */
    function useGroupByFields(type: DocumentDefinition): FieldDefinition[];
    /**
     * <p>Retrieves all the fields of a type</p>
     * @returns <p>the fields of the type</p>
     */
    function getFields(type: DocumentDefinition): Promise<FieldDefinition[]>;
    /**
     * <p>Retrieve the typedef of a field by name from the current document as a hook</p>
     * @returns <p>the definition of the field</p>
     */
    function useField(fieldName: string): FieldDefinition;
    /**
     * <p>Uses all of the fields of a type, optionally including those from related records</p>
     * @param type - <p>the type whose fields should be retrieved</p>
     * @param deep - <p>true if related fields should be returned</p>
     */
    function useFields(type: DocumentDefinition | string, deep: boolean): void;
    /**
     * <p>Defines a question for AWE, registering it with the UI</p>
     * @param typesOrFunction - <p>the definition to make</p>
     */
    function questionType(typesOrFunction: QuestionTypeDef[] | QuestionTypeDef | ((...params: any[]) => any)): void;
    /**
     * <p>A function that registers providers of Chase &quot;track&quot; components
     * so that they can be added to the track in the user interface</p>
     * @example
     * trackComponent({
     *     value: 'assignTask',
     *     label: 'Assign Task',
     *     description: 'Assigns a task to a topic',
     *     icon: <GoTasklist />,
     *     config(task) {
     *         task.fulfilment = {
     *             type: FULFILMENT_TYPES[0],
     *         }
     *     },
     *     color: theme.palette.primary.main,
     * })
     * @param typesOrFunction - <p>the definition of the track component</p>
     */
    function trackComponent(typesOrFunction: TrackComponentDefinition): void;
    /**
     * <p>Specifically for use with the Chase behaviour, this registers a component
     * as being able to make a list of events.  For instance it could represent
     * an external system that emitted its own events, and this would be a way
     * in which the Chase behaviour knew that they could be waited for.</p>
     * @param type - <p>type of events</p>
     * @param eventSource - <p>a function that will be called with the existing context to get the events</p>
     */
    function eventSource(type: string, eventSource: (...params: any[]) => any): void;
    /**
     * <p>Helper function that tries to extract a caption for a question if one hasn't been provided</p>
     * @param question - <p>the question whose caption should be created</p>
     * @param [type] - <p>the already resolved type if available</p>
     * @returns <p>the caption for the question</p>
     */
    function questionCaption(question: FieldDefinition, type?: QuestionTypeDef): string;
    /**
     * <p>Registers a hint producing function.  The function is called
     * to supply hints for a question type in the UI.  Hints act as
     * simple switches to enable extension functionality or alternate
     * versions of the UI for rendering questions.  Hints are strings
     * that describe a property of the FieldDefinition - so they normally
     * only contain legal characters for JavaScript identifiers.</p>
     * @param predicate - <p>a predicate to decide whether the hints should be added, either a function or the question type as a string</p>
     * @param hintsOrFn - <p>an array of hints or a function to produce an array of hints</p>
     */
    function hints(predicate: HintPredicate | string, hintsOrFn: string[] | HintFunction): void;
    /**
     * <p>Support function that logs if a call takes more than a specified
     * amount of time to return</p>
     * @param fn - <p>the function to wrap</p>
     * @param [delay = 3000] - <p>the time in m/s that the function should execute in less than</p>
     * @returns <p>a wrapped version of fn that will log if it takes more than the delay</p>
     */
    function logErrorOnLongCall(fn: (...params: any[]) => any, delay?: number): (...params: any[]) => any;
    /**
     * <p>Discovers the &quot;Deep&quot; fields from a question type.  This is called
     * to find related columns and make their metadata available and also
     * to identify local columns that contain user entered data.  If
     * a question represents a record in a different table for instance,
     * a responder to this registration would be required to gather the
     * relevant metadata.  The deep field function returns whether the
     * current question should form part of the &quot;base&quot; in this case the
     * field itself has a meaningful local value the user would be interested in
     * or a &quot;link&quot; linkage, in which case the data is
     * in another record and the value is the ID of that record, that should
     * not be shown to the user.  The result is returned through the properties
     * of the configuration</p>
     */
    function deepFields(predicate: string | DeepFieldPredicate, deepFieldFn: DeepFieldFunction): void;
    /**
     * <p>Registers one or more property editors for the current
     * target of a selection.  The ThingBuilder UI can select
     * a wide range of things, and this allows the rendering of a
     * property page for any of them.</p>
     * <p>There are a number of different things that you might want
     * to add property editors for.  The most obvious is &quot;question&quot;
     * but here are some others.</p>
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
     * @param predicate - <p>a predicate to identify the criteria by which the subsequent components should be added</p>
     * @param Components - <p>the components that should be used as property pages when the predicate succeeds</p>
     */
    function tabs(predicate: TabPredicate, ...Components: React.Component[]): void;
    /**
     * <p>A helper function to use in behaviours to add additional editor
     * tabs for a field/question or other type.  This enables a behaviour
     * to extend the standard global properties of anything. The result
     * is a function that can be used as the &quot;editorTabs&quot; method of a behaviour.</p>
     * @param predicate - <p>the predicate function to use</p>
     * @param Component - <p>the component to use if the predicate succeeds</p>
     * @returns <p>A function to add the tab when appropriate</p>
     */
    function tab(predicate: TabPredicate, Component: React.Component): (...params: any[]) => any;
    /**
     * <p>A helper function that creates a predicate for questions of
     * a specific type or types</p>
     * @param questionType - <p>the types of question that will
     * pass the predicate</p>
     * @returns <p>a predicate function matching the specification</p>
     */
    function whenQuestionTypeIs(...questionType: string[]): (...params: any[]) => any;
    /**
     * <p>A helper function that creates a predicate for track components
     * with specific type or types</p>
     * @param trackType - <p>the types that should match</p>
     * @returns <p>a predicate function for track components with the
     * provided types</p>
     */
    function whenTrackComponentIs(...trackType: string[]): (...params: any[]) => any;
    /**
     * <p>Creates a predicate function for questions that succeed with a
     * predicate which is supplied with the typedef and the
     * instance (this is a helper function to wrap a common way
     * of testing questions).</p>
     * @param predicate - <p>the predicate to use</p>
     * @returns <p>a predicate function for questions matching
     * the helper predicate</p>
     */
    function whenQuestionMatches(predicate: QuestionPredicateFunction): (...params: any[]) => any;
    /**
     * <p>A helper to create a predicate for questions that have a specific
     * hint set</p>
     * @param hint - <p>the hint that must be set</p>
     * @returns <p>a predicate for questions with the specified
     * hint</p>
     */
    function whenQuestionHasHint(hint: string): (...params: any[]) => any;
    /**
     * <p>Returns whether an item with a name is blank or if the parameter
     * is a string, tests that it is not blank</p>
     * @returns <p>true if the name or string is not blank</p>
     */
    function isNotBlank(fieldOrName: string | FieldDefinition): boolean;
    /**
     * <p>Extracts the name of a field</p>
     * @returns <p>the name</p>
     */
    function extractFieldName(field: FieldDefinition): string;
    /**
     * <p>Helper to create a function which tests if a field is defined on the
     * initial document, rather than through a sub document or
     * sub element of the document.</p>
     * @param [fn] - <p>optional additional field check function passed the field</p>
     * @returns <p>a function that
     * tests a field for a sub field</p>
     */
    function basicField(fn?: (...params: any[]) => any): (...params: any[]) => any;
    /**
     * <p>Creates a function that returns whether a field is local
     * to the current document.  Provided with a set of fields
     * it inspects the types and handles array fields and subForms
     * appropriately.</p>
     * @param fields - <p>the fields which are
     * part of the current document</p>
     * @returns <p>a function that returns
     * true for locally located fields</p>
     */
    function fieldBelongsLocally(fields: FieldDefinition[]): (...params: any[]) => any;
    /**
     * <p>A filter that tests a field and returns true if the field is
     * at the top level of a chain</p>
     * @param field - <p>the field to be tested</p>
     * @returns <p>true if the field tested is a top level field</p>
     */
    function topLevelField(field: string | FieldDefinition): boolean;
    /**
     * <p>Helper function to create a predicate which tests that a field name
     * matches a defined one.</p>
     * @param name - <p>the name that should be tested for</p>
     * @returns <p>a predicate that tests
     * for the supplied name</p>
     */
    function fieldNameIs(name: string): (...params: any[]) => any;
    /**
     * <p>Provided with an instance or a document, return all of the
     * available states for it</p>
     * @param instance - <p>the instance to test</p>
     * @returns <p>the available states</p>
     */
    function getStates(instance: DocumentDefinition | any): string[];
    /**
     * <p>Support dummy function that just returns the value it is passed,
     * this is useful as the default value of parameters that supply
     * projection functions</p>
     * @param v - <p>value</p>
     * @returns <p>the value is returned without modification</p>
     */
    function returnValue(v: any): any;
    /**
     * <p>A hook which returns all of the database/table combinations
     * for the current in context types (for the current client and
     * global)</p>
     * @param [id] - <p>an id that is used to decide if a refresh is required</p>
     * @returns <p>the tables and their fields</p>
     */
    function useTables(id?: string): TableDefinition[];
    /**
     * <p>Helper to check whether a field is a standard field</p>
     * @param field - <p>the field to test</p>
     * @returns <p>true if the field is standard</p>
     */
    function isStandardField(field: FieldDefinition): boolean;
    /**
     * <p>Returns if a field definition is stored in the database</p>
     * @param field - <p>the field to check</p>
     * @returns <p>true if the field is stored</p>
     */
    function isStoredInRecord(field: FieldDefinition): boolean;
}

/**
 * <p>Declares a predicate that will determine whether a behaviour should be shown in the UI</p>
 * @param list - <p>the current list of behaviours</p>
 * @param definition - <p>the current definition of the document or application to which the behaviour may be added</p>
 */
declare type BehaviourPredicate = (list: BehaviourDefinition[], definition: DocumentDefinition) => boolean;

/**
 * <p>the definition of a behaviour for the UI</p>
 * @property behaviour - <p>the unique name of the behaviour</p>
 * @property caption - <p>a caption to use when displaying the behaviour</p>
 * @property [description] - <p>a longer text description of the behaviour</p>
 * @property Icon - <p>an icon to use for the behaviour</p>
 * @property color - <p>a colour to use for the behaviour</p>
 * @property [register] - <p>the code to register for the behaviour - if omitted this should be registered directly with Alcumus Behaviours</p>
 */
declare interface BehaviourDefinition {
    behaviour: string;
    caption: string;
    description?: string;
    Icon: JSX.Element;
    color: string;
    register?: object;
}

/**
 * <p>A function to configure a new instance of a component</p>
 * @param instance - <p>the instance to be configured</p>
 */
declare type ConfigFunction = (instance: any) => void;

/**
 * <p>a definition for a component that can appear
 * on the tracks of a Chase behaviour</p>
 * @property icon - <p>the icon to use</p>
 * @property label - <p>the label for the track component in lists</p>
 * @property description - <p>a description of the purpose of the track component</p>
 * @property [config] - <p>a function that can be used to configure a new instance of the component</p>
 * @property color - <p>the colour to use for the component</p>
 * @property value - <p>the unique name of the component</p>
 */
declare interface TrackComponentDefinition {
    icon: JSX.Element;
    label: string;
    description: string;
    config?: ConfigFunction;
    color: string;
    value: string;
}

/**
 * <p>A list of hints for a target</p>
 * @property hints - <p>a list of hints currently associated</p>
 */
declare interface HintList {
    hints: Array<string>;
}

/**
 * <p>A call back to decide whether hints should be added to a list</p>
 * @param target - <p>the item for which hints are being discovered</p>
 * @param info - <p>the list of existing hints</p>
 */
declare type HintPredicate = (target: FieldDefinition, info: HintList) => boolean;

/**
 * <p>A function that returns the hints to associate with a question/field</p>
 */
declare type HintFunction = () => string[];

declare interface Dictionary<T> {
    [key: string]: T;
}

/**
 * <p>a lookup of a field definition from it's property path syntax</p>
 */
declare type DeepFieldDictionary = Dictionary<FieldDefinition>;

/**
 * <p>An object which describes the deep field data for a FieldDefinition</p>
 * @property path - <p>the path to the current target, this is like property syntax but split into an array on '.'</p>
 * @property target - <p>the current target of the deep field request</p>
 * @property dictionary - <p>a dictionary of all property paths to their definitions (including '.') - this is automatically populated from base fields</p>
 * @property linkFields - <p>a dictionary of all property paths to their definitions (including '.') - this is automatically populated from link fields</p>
 * @property addBaseField - <p>set this to true to add the current target as a base field</p>
 * @property addLinkField - <p>set this to true to add the current target as a link field (it's value is the ID of a linked record)</p>
 */
declare interface DeepFieldDefinition {
    path: string;
    target: FieldDefinition;
    dictionary: DeepFieldDictionary;
    linkFields: DeepFieldDictionary;
    addBaseField?: boolean;
    addLinkField?: boolean;
}

/**
 * <p>a callback that decides if there is a deep field list
 * for a particular target</p>
 */
declare type DeepFieldPredicate = (target: FieldDefinition, info: DeepFieldDefinition) => void;

/**
 * <p>a callback that is provided with information on a
 * definition and reacts by setting addBaseField and addLinkField properties
 * to indicate how the question/field should be treated.</p>
 * @param target - <p>the target question being considered</p>
 * @param info - <p>the info about the current context that
 * should be updated to adjust the field specified.</p>
 */
declare type DeepFieldFunction = (target: FieldDefinition, info: DeepFieldDefinition) => void;

/**
 * <p>A structure that contains info about the components being added</p>
 * @property type - <p>the string type of the current type of selection</p>
 * @property selected - <p>the currently selected item</p>
 * @property Components - <p>the components to render as property editors</p>
 */
declare interface PropertySheetComponents {
    type: string;
    selected: object;
    Components: Array<React.Component>;
}

/**
 * <p>A predicate that returns whether a tab should be added to the properties area</p>
 * @param type - <p>the string type of the current selection, this is an arbitrary value that the
 * thing doing the selection sets.  It's 'question' for questions and 'group' for groups</p>
 * @param selected - <p>whatever the user has currently selected</p>
 * @param info - <p>a structure which contains the current selected tabs for the selection</p>
 */
declare type TabPredicate = (type: string, selected: any, info: PropertySheetComponents) => boolean;

/**
 * @param type - <p>the typedef of the question being tested</p>
 * @param instance - <p>the current instance being tested</p>
 */
declare type QuestionPredicateFunction = (type: QuestionTypeDef, instance: FieldDefinition) => boolean;

/**
 * <p>Describes a table in the database</p>
 * @property value - <p>the database/table entry</p>
 * @property label - <p>a human readable label for the entry</p>
 * @property fields - <p>all of the fields in the table</p>
 * @property types - <p>the list of document types that can write to the table</p>
 */
declare interface TableDefinition {
    value: string;
    label: string;
    fields: FieldDefinition[];
    types: string[];
}

declare module "common/use-async" {
    /**
     * <p>A hook that allows you to create a function
     * that will be nulled when the current component
     * unmounts.  Calling the function after an unmount
     * will be a noop.</p>
     * @param fn - <p>the function to be wrapped</p>
     * @returns <p>a version of the function that is a
     * noop after the component unmounts</p>
     */
    function useCurrent(fn: (...params: any[]) => any): (...params: any[]) => any;
    /**
     * <p>A hook that does the equivalent of React.useState, however
     * if the component unmounts, the set function of the
     * state will be a noop.  Helps with asyncs that later try to
     * update a component that has been unmounted.</p>
     * @param [params] - <p>parameters passed to useState</p>
     * @returns <ul>
     * <li>the same as React useState</li>
     * </ul>
     */
    function useCurrentState(...params: any[]): any[];
    /**
     * <p>A hook to use async data, with additional caching.  This
     * caching is designed to reduce flicker in the UI.  The
     * specific async is given a name and the results will
     * be cached globally and be supplied as the initial result
     * when it is used again.  Data may then be refreshed depending
     * on a separate run id.</p>
     * <p>useCachedAsync needs handling with care so that you don't
     * accidentally use cached data from a different purpose. When
     * used appropriately it makes the UI much more responsive.</p>
     * @example
     * export function useRecordsForType(type, where, sort, options) {
     *     return useCachedAsync(
     *         'getRecords', // purpose of the async
     *         async () => { // function to get the records
     *             if (!type) return []
     *             const typeDef = Object.isObject(type) ? type : await get(type)
     *             await initialize(typeDef)
     *             await raiseAsync('update-records', [typeDef])
     *             return getRecords(typeDef?.database, typeDef?.table, {}, sort, options)
     *         },
     *         [], // default value if no cache
     *         JSON.stringify({ type, where, sort, options }) // unique cache key when added to purpose
     *     )
     * }
     * @param purpose - <p>this should be a unique string to cache
     * data of a particular type</p>
     * @param promiseProducingFunction - <p>the function
     * that will retrieve the async data</p>
     * @param [defaultValue] - <p>a value to use when there is no cached data</p>
     * @param [refId = standard] - <p>an id that indicates the cache key to use, this should
     * is used in conjunction with <code>purpose</code> to create a cache key</p>
     * @param [runId] - <p>an id that indicates that even if the keys match
     * that the function should be run again and the data updated when
     * it is available</p>
     * @returns <p>the results of the function, the cached value or the default value
     * as appropriate</p>
     */
    function useCachedAsync(purpose: string, promiseProducingFunction: (...params: any[]) => any, defaultValue?: any, refId?: string, runId?: string): any;
    /**
     * <p>A hook to retrieve data from an async function.</p>
     * @example
     * const fields = useAsync(
     *  async () => {
     *             const type = await getType(target.actionType)
     *             await initialize(type)
     *             return type.sendMessage('fields', [])
     *         },
     *  [],
     *  target.actionType
     *  )
     * @param promiseProducingFunction - <p>the async function to run</p>
     * @param [defaultValue = null] - <p>a default value to use until the function returns</p>
     * @param [refId = standard] - <p>a value that indicates the resource and if it doesn't match, causes the function to run again</p>
     * @returns <p>the result of the function or the default value as appropriate</p>
     */
    function useAsync(promiseProducingFunction: (...params: any[]) => any, defaultValue?: any, refId?: string): any;
}

declare module "common/offline-data-service" {
    /**
     * <p>Given a record, that has previously been prepared for storage
     * (the behaviours removed and replaced with a small reference
     * to the underlying document type) this finds the type and
     * makes the document whole again ready for processing.</p>
     * <p>The retrieved document is initialized and ready to
     * perform behaviour actions.</p>
     * @param record - <p>the record to hydrate</p>
     * @returns <p>a promise for the rehydrated
     * document</p>
     */
    function hydrateDocument(record: Document): Promise<Document>;
    /**
     * <p>Prepares a document for database storage, this removes
     * all of the behaviours and replaces them with a reference
     * to the underlying document type that creates them.  It
     * also stores the current state of the document.</p>
     * @param record - <p>the record to prepare</p>
     * @returns <p>the record having been modified</p>
     */
    function prepareDocument(record: Document): Document;
    /**
     * <p>ONLINE ONLY - retrieves the number of records that match
     * a where clause</p>
     * @param database - <p>the database of the table</p>
     * @param table - <p>the table to query</p>
     * @param where - <p>the query to count</p>
     * @returns <p>a promise for the number of records</p>
     */
    function getCount(database: string, table: string, where: WhereDefinition): Promise<number>;
    /**
     * <p>A hook to get a record or create it if it does not
     * exist</p>
     * @param id - <p>the id of the record (must include the full Alcumus database/table part)</p>
     * @param [track] - <p>whether the record should be locally cached if possible</p>
     * @returns <p>returns the document when available, null before</p>
     */
    function useRecordOrCreate(id: string, track?: boolean): Document | null;
    /**
     * <p>A hook to retrieve a record</p>
     * @param id - <p>the id of the record</p>
     * @param [track] - <p>whether the record should be locally cached if possible</p>
     * @returns <ul>
     * <li>a record from the db</li>
     * </ul>
     */
    function useRecord(id: string, track?: boolean): Document;
    /**
     * <p>Deletes a record from the db. Note you
     * can also delete a record by setting a _deleted property of it to 1</p>
     * @param id - <p>the id of the record</p>
     * @returns <p>a promise for the deletion being complete</p>
     */
    function del(id: string): Promise<void>;
    /**
     * <p>Stores a document in the database. We don't often do this
     * on the client as we expect AWE processing to do it on our
     * behalf. But for other kinds of document this will work.</p>
     * @param record - <p>the record to store</p>
     * @param [cache = false] - <p>whether we should cache the record</p>
     * @param [now = false] - <p>if true the record is immediately stored, otherwise it is queued</p>
     * @returns <p>a promise for the storage of the document</p>
     */
    function set(record: Document, cache?: boolean, now?: boolean): Promise<Document>;
    /**
     * <p>Retrieve a document.  The primary retrieval order will be: local memory
     * cache, local db cache, the server unless overridden using the <code>localOnly</code>
     * parameter.</p>
     * @param id - <p>the id of the record to retrieve</p>
     * @param [track = true] - <p>whether to cache the record and then track it as it changes on the server</p>
     * @param [raw = false] - <p>if true the retrieved document is NOT hydrated, otherwise it is prepared for execution</p>
     * @param [localOnly = false] - <p>a flag to override the processing of the documents location.</p>
     * <p>Possible values are 'false' the document will be retrieved locally
     * if available, 'server' the document must be retrieved from the server
     * and if we are offline it will fail and 'server-preferred' we retrieve
     * from the server if we are online, otherwise a local copy will do.</p>
     * @returns <p>a promise for the retrieved document</p>
     */
    function get(id: string, track?: boolean, raw?: boolean, localOnly?: string | boolean): Promise<Document | null>;
    /**
     * <p>Retrieves a list of matching documents.  This function prefers
     * the server if we are online and uses a local backup if we are not.</p>
     * <p>Note that this retrieves the outer wrapper of the record, the
     * actual record is contained in the <code>data</code> property of the record</p>
     * @param database - <p>the database of the table</p>
     * @param table - <p>the table to retrieve data from</p>
     * @param [where = {}] - <p>a query to apply</p>
     * @param [options = {}] - <p>options for the retrieval</p>
     */
    function list(database: string, table: string, where?: WhereDefinition, options?: ListOptions): Promise<DocumentRecord[]>;
}

/**
 * <p>An object that has associated behaviours and state,
 * it references an underlying document type and stores
 * the data that the user input</p>
 */
declare interface Document extends DocumentDefinition {
}

/**
 * <p>A mongo db style where clause using
 * an object and keys to describe a query</p>
 */
declare interface WhereDefinition {
}

/**
 * <p>The options when retrieving a list</p>
 * @property [skip = 0] - <p>the number of records to skip</p>
 * @property [take] - <p>the number of records to take</p>
 * @property [orderStmt] - <p>an array of the field names to sort by, if the field name starts with a '-' it will be in descending order</p>
 * @property [fields] - <p>a list of fields to retrieve (online only)</p>
 * @property [audit = false] - <p>if true the created and modified dates will be returned (online only)</p>
 * <p>that represent the columns to sort on (starting with '-' for descending order)</p>
 */
declare interface ListOptions {
    skip?: number;
    take?: number;
    orderStmt?: string[];
    fields?: string[];
    audit?: boolean;
}

/**
 * <p>a wrapped document record</p>
 * @property data - <p>the document</p>
 * @property id - <p>the id of the document</p>
 * @property type - <p>the type of the document</p>
 */
declare interface DocumentRecord {
    data: object;
    id: string;
    type: string;
}

declare module "common/offline-data-service/records" {
    /**
     * <p>A hook that given a type definition or ID, creates a function that streams
     * records from that database type</p>
     * @param type - <p>the type to get records from</p>
     * @param [where = {}] - <p>the query to apply</p>
     * @param [sort] - <p>the sort fields for the records</p>
     * @param [filter] - <p>an additional filter applied
     * to retrieved records</p>
     * @returns <p>the function to get the records</p>
     */
    function useStreamedResultsForType(type: string | DocumentDefinition, where?: WhereDefinition, sort?: string[], filter?: (...params: any[]) => any): typeof RetrieveFunction;
    /**
     * <p>A hook that given a database and table, creates a function that streams
     * records</p>
     * @param database - <p>the database for the table</p>
     * @param table - <p>the table to stream records from</p>
     * @param [where = {}] - <p>the query to apply</p>
     * @param [sort] - <p>the sort fields for the records</p>
     * @param [filter] - <p>an additional filter applied
     * to retrieved records</p>
     * @returns <p>the function to get the records</p>
     */
    function useStreamedResults(database: string, table: string, where?: WhereDefinition, sort?: string[], filter?: (...params: any[]) => any): typeof RetrieveFunction;
    /**
     * <p>Gets records for a type definition or ID</p>
     * @param type - <p>the type to get records from</p>
     * @param [where = {}] - <p>the query to apply</p>
     * @param [sort] - <p>the sort fields for the records</p>
     * @param [options = {}] - <p>options for the retrieval</p>
     * @returns <p>retrieves the documents or [] until available</p>
     */
    function useRecordsForType(type: string | DocumentDefinition, where?: WhereDefinition, sort?: string[], options?: ListOptions): Document[];
    /**
     * <p>A hook to get records for a database and table</p>
     * @param database - <p>the database for the table</p>
     * @param table - <p>the table to stream records from</p>
     * @param [where = {}] - <p>the query to apply</p>
     * @param [sort] - <p>the sort fields for the records</p>
     * @param [options = {}] - <p>options for the retrieval</p>
     * @returns <p>retrieves the documents or [] until available</p>
     */
    function useRecords(database: string, table: string, where?: WhereDefinition, sort?: string[], options?: ListOptions): Document[];
    /**
     * <p>Gets records for a database and table</p>
     * @param database - <p>the database for the table</p>
     * @param table - <p>the table to stream records from</p>
     * @param [where = {}] - <p>the query to apply</p>
     * @param [sort] - <p>the sort fields for the records</p>
     * @param [options = {}] - <p>options for the retrieval</p>
     * @returns <p>a promise for the documents</p>
     */
    function getRecords(database: string, table: string, where?: WhereDefinition, sort?: string[], options?: ListOptions): Promise<Document[]>;
}

/**
 * <p>A function that retrieves records. This is
 * returned from the streaming functions and reacts to the
 * current state of retrieval.  Initially it will retrieve
 * dummy records, of the number requested, later it will
 * be populated with real values and will truncate if there
 * aren't enough.</p>
 * @param first - <p>the first record to retrieve</p>
 * @param count - <p>the number of records to retrieve</p>
 * @returns <p>an array of records</p>
 */
declare function RetrieveFunction(first: number, count: number): Document[];

declare module "common/menu" {
    /**
     * <p>Provide a list of menu items.  This is a convenience
     * function for handling the 'get-menu-items' event.  You
     * provide a handler that takes the existing items and return
     * an object containing keys which have unique menu item ids and
     * values which are an object containing the data for the
     * menu item to show.</p>
     * <p>menuItems refers to the main left hand icon based menu.  Sub items
     * can be shown on a menu shown when the top level is selected.  These
     * sub items can be resolved using the <code>subItems()</code> function
     * or by supplying <code>children</code> to the main menu.</p>
     * @param menuItemFn - <p>a function that provides menu items</p>
     */
    function menuItems(menuItemFn: MenuItemFunction): void;
    /**
     * <p>Provide a list of submenu items for a parent.  You can
     * use this method to provide an on-demand context specific list
     * of children for any menu item.</p>
     * @param parentMenuId - <p>the menuId of the parent currently selected</p>
     * @param subMenuFn - <p>the function that will provide sub menu items</p>
     */
    function subMenuItems(parentMenuId: string, subMenuFn: SubMenuProvider): void;
    /**
     * <p>Provide a header for a submenu given a parent.</p>
     * @param parentMenuId - <p>the id that will be used for the header</p>
     * @param subMenuFn - <p>a function to provide the sub menu header</p>
     */
    function subMenuHeader(parentMenuId: string, subMenuFn: SubMenuHeaderProvider): void;
}

/**
 * <p>a function that indicates if a menu should be shown
 * as active</p>
 * @param location - <p>the current route</p>
 */
declare type IsActiveFunction = (location: string) => boolean;

/**
 * <p>a function that returns if the current user has permission for an action.</p>
 * <p>Frequently one uses the <code>secureRoute('demand', ...)</code> to
 * create a function to supply this need.</p>
 */
declare type SecurityFunction = () => void;

/**
 * <p>A function called when a menu item is clicked</p>
 * @param hide - <p>a function to call to hide the menu</p>
 */
declare type MenuClickFunction = (hide: (...params: any[]) => any) => void;

/**
 * <p>A menu item entry</p>
 * @example
 * {
 *  title: 'PowerSearch',
 *  icon: <MdSearch />,
 *  secure: secureRoute('power-search'),
 *  isActive: '/search',
 *  click(hide) {
 *         navigate('/search')
 *         hide()
 *    }
 * }
 * @property id - <p>the id of the menu item</p>
 * @property title - <p>the title of the item, on the main menu this is a tooltip</p>
 * @property icon - <p>the icon to use for the menu item</p>
 * @property [isActive] - <p>either a path that must be included in the route to indicate activity or a function to return if the menu item is active</p>
 * @property [secure] - <p>a function that returns whether the current user has permission to access the path</p>
 * @property [click] - <p>a function to be run when clicking the item</p>
 * @property [children] - <p>a list of children of this item</p>
 */
declare interface MenuItem {
    id: string;
    title: string;
    icon: JSX.Element;
    isActive?: IsActiveFunction;
    secure?: SecurityFunction;
    click?: MenuClickFunction;
    children?: MenuItem[];
}

/**
 * <p>A dictionary of menu items</p>
 */
declare type MenuItems = {
    [key: string]: MenuItem;
};

/**
 * <p>A function that returns menu items</p>
 * @param items - <p>the current items</p>
 */
declare type MenuItemFunction = (items: MenuItems) => MenuItems;

/**
 * <p>Describes a sub menu</p>
 * @property selected - <p>the currently selected main menu</p>
 * @property id - <p>the id of the main menu item selected</p>
 * @property title - <p>the title of the menu item selected</p>
 * @property header - <p>the header used for the sub menu</p>
 * @property children - <p>the current children that will form the sub menu</p>
 */
declare interface SubMenuInfo {
}

/**
 * <p>A function to provide sub menu items and/or modify
 * information about the sub menu</p>
 * @param info - <p>information about the currently selected menu</p>
 */
declare type SubMenuProvider = (info: SubMenuInfo) => MenuItems;

/**
 * <p>Provides a header for a sub menu</p>
 * @param info - <p>info about the currently selected menu and sub menu items</p>
 */
declare type SubMenuHeaderProvider = (info: SubMenuInfo) => React.Component;

/**
 * <p>Functions to send server commands</p>
 */
declare module "common/process" {
    /**
     * <p>Creates a parameter setting function</p>
     * @param path - <p>the path of the value to set in the request parameters</p>
     * @param [transform] - <p>a function to transform the value before setting it</p>
     * @returns <p>a function to set the parameter</p>
     */
    function parameter(path: string, transform?: TransformFunction): Parameter;
    /**
     * <p>Declares a server call as an async function that returns a value.</p>
     * <p>One specifies the api call to make and a value to extract. The result
     * is an async function to perform the operation.</p>
     * @example
     * // Declares an acquireLock function that calls 'lock.acquire' which
     * // takes an 'id' as a parameter and returns the value of 'locked' returned
     * // by the server
     *
     * const acquireLock = retrieve('lock.acquire', 'locked', parameter('id'))
     * @param type - <p>the name of the command to execute</p>
     * @param extract - <p>the value to extract from the server result</p>
     * @param params - <p>a list of parameters for the function, normally
     * declared with the <code>parameter()</code> function</p>
     */
    function retrieve(type: string, extract: string, ...params: Parameter[]): (...params: any[]) => any;
    /**
     * <p>Declares a server call that does not return a value</p>
     * @param type - <p>the name of the command to execute</p>
     * @param params - <p>a list of parameters for the function, normally
     * declared with the <code>parameter()</code> function</p>
     */
    function send(type: string, ...params: Parameter[]): (...params: any[]) => any;
    /**
     * <p>Send a command to the server as a post, this will
     * not return until the results are ready</p>
     * @param itemOrItems - <p>the item or items to process</p>
     * @returns <p>the result of the command</p>
     */
    function immediateProcess(itemOrItems: Process[] | Process): Promise<any>;
    /**
     * <p>Returns a promise for a time when there are no jobs
     * running on the server for this client</p>
     */
    function notRunning(): Promise<void>;
    /**
     * <p>Queues a job to run on the server</p>
     * @param singleItem - <p>the item to process</p>
     * @param [timeout = 300000] - <p>the timeout for the function in m/s default 5 mins</p>
     * @param [name] - <p>a name to display in the job list for this job</p>
     * @param [important = false] - <p>a flag to indicate that the job is important.
     * Important jobs are shown in a running list always, other jobs are only
     * shown in debug mode</p>
     * @param [isAnonymous = false] - <p>flag to indicate that the job should be run as an anonymous user</p>
     * @returns <p>The result of the job after processing on the server</p>
     */
    function process(singleItem: Process, timeout?: number, name?: string, important?: boolean, isAnonymous?: boolean): Promise<any>;
    /**
     * <p>Define an API call using a richer syntax that allows
     * for required and optional parameters, outbound and inbound
     * transformations plus one or more return values.</p>
     * @param type - <p>the api process to call</p>
     * @param fn - <p>a function that will be
     * called to create the definition</p>
     * @returns <p>a function to asynchronously
     * make the API call</p>
     */
    function define(type: string, fn: DeclarationFunction): (...params: any[]) => any;
}

/**
 * <p>A function to transform a value</p>
 */
declare type TransformFunction = (value: any) => any;

/**
 * <p>A function that sets a value in the outbound parameters
 * of the request.</p>
 * <p>This is often created by the <code>parameter()</code> function</p>
 * @param value - <p>the value to set</p>
 * @param output - <p>the outbound parameter request</p>
 */
declare type Parameter = (value: any, output: any) => void;

/**
 * <p>A command to run on the server, the other properties
 * of this object are parameters for the function being run</p>
 * @property type - <p>the command to execute on the server</p>
 * @property [id] - <p>an id for the job, one will be supplied if missing</p>
 */
declare interface Process {
}

/**
 * <p>An api that is used to define server calls.
 * The order of calls declares the API.</p>
 * <p>You may also import these functions directly from common/process.</p>
 * <p>These calls should only be used inside a call to <code>define()</code>
 * to create a server api call.</p>
 */
declare interface DeclarationApi {
    /**
     * <p>Declare a required parameter</p>
     * @param name - <p>the name by which the parameter will be known on the server</p>
     * @param [transform] - <p>a function to transform the value
     * export const addApp = define('app.types.add', function ({required, optional, returns}) {
     * required('name') // First parameter will be known as 'name' in the server
     * optional('definition')
     * returns('id')
     * })</p>
     */
    required(name: string, transform?: TransformFunction): void;
    /**
     * <p>Declare an optional parameter</p>
     * @param name - <p>the name by which the parameter will be known on the server</p>
     * @param [transform] - <p>a function to transform the value
     * export const addApp = define('app.types.add', function ({required, optional, returns}) {
     * required('name') // First parameter will be known as 'name' in the server
     * optional('definition')
     * returns('id')
     * })</p>
     */
    optional(name: string, transform?: TransformFunction): void;
    /**
     * <p>Declare a return value for the function.  If only
     * one value is returned, it becomes the return value of the generated
     * server call, if more than one - then the multiple values are
     * returned in an array.</p>
     * @example
     * export const addApp = define('app.types.add', function ({required, optional, returns}) {
     *     required('name') // First parameter will be known as 'name' in the server
     *     optional('definition')
     *     returns('id') // Returns the result.id property
     * })
     * @param path - <p>the path of the property to retrieve from the server result object</p>
     */
    returns(path: string): void;
    /**
     * <p>Declare that calls with the same parameters will
     * be cached and returned without a server call</p>
     * @param [count = 50] - <p>the number of calls to retain</p>
     */
    lruCache(count?: number): void;
    /**
     * <p>Declares a function that will be used to
     * cache the result of a server call</p>
     */
    cacheResult(cache: CacheFunction): void;
    /**
     * <p>Declare a function to retrieve a value from a
     * cache, this allows you to write your own caching functions.</p>
     * @param retrieve - <p>a function to retrieve a value from the cache</p>
     */
    cacheRetrieve(retrieve: CacheRetrieveFunction): void;
    /**
     * <p>Declare a function to be called before sending the command,
     * there may be more than one before function.</p>
     * @param transform - <p>transform the command that is being sent</p>
     */
    before(transform: TransformFunction): void;
    /**
     * <p>Declare a function to be called after retrieving the result,
     * there may be more than one after function.</p>
     * @param transform - <p>transform the result that has been retrieved</p>
     */
    after(transform: TransformFunction): void;
    /**
     * <p>Declare a function that will create a cache key from an API packet.
     * By default the key is all of the parameters in the packet.</p>
     * @param getKey - <p>a function to get a key from the command</p>
     */
    cacheKey(getKey: CacheKeyFunction): void;
    /**
     * <p>Declare a function that will be used when the app is offline.</p>
     * @param fn - <p>the function to be called when the app is offline.</p>
     */
    offline(fn: OfflineProcessor): void;
    /**
     * <p>Flags this command as being registered in the &quot;important&quot;
     * running jobs</p>
     */
    important(): void;
    /**
     * <p>Declare the timeout for the function call in m/s</p>
     * @param timeout - <p>the number of m/s that the call should run before timing out</p>
     */
    timeout(timeout: number): void;
    /**
     * <p>Set a name for the job in the list of running jobs</p>
     * @param name - <p>the name of the job that is running for the monitored list</p>
     */
    description(name: string | ((...params: any[]) => any)): void;
}

/**
 * <p>cache a result</p>
 * @param result - <p>the result to be cached</p>
 * @param command - <p>the parameters that were sent to create the result</p>
 */
declare type CacheFunction = (result: any, command: Process) => void;

/**
 * @param command - <p>the command to retrieve from the cache</p>
 */
declare type CacheRetrieveFunction = (command: Process) => any | null;

/**
 * <p>retrieve a key from a command object</p>
 * @param command - <p>the command that is being sent</p>
 */
declare type CacheKeyFunction = (command: Process) => string;

/**
 * @param command - <p>the command being processed</p>
 */
declare type OfflineProcessor = (command: Process) => Promise<object>;

/**
 * <p>A function that uses function calls to
 * declare an API call to the server</p>
 * @example
 * export const addApp = define('app.types.add', function ({required, optional, returns}) {
 *     required('name') // First parameter will be known as 'name' in the server
 *     optional('definition')
 *     returns('id')
 * })
 * @param api - <p>the api for declaring server calls</p>
 */
declare type DeclarationFunction = (api: DeclarationApi) => void;

/**
 * <p>Sortable Material UI components using react-sortable-hoc</p>
 */
declare module "common/sortable" {
    /**
     * <p>A sortable Material UI List Item</p>
     * @param props - <p>the properties for the ListItem and hoc</p>
     */
    function SortableListItem(props: any): JSX.Element;
    /**
     * <p>A sortable div</p>
     * @param props - <p>the properties for the div and hoc</p>
     */
    function SortableDiv(props: any): JSX.Element;
    /**
     * <p>A sortable Material UI List</p>
     * @param props - <p>the properties for the List and hoc</p>
     */
    function SortableList(props: any): JSX.Element;
    /**
     * <p>A default handle for a sortable item</p>
     */
    function Handle(): JSX.Element;
}

declare module "common/use-event" {
    /**
     * <p>Returns the window size of the current viewport and
     * refreshes (using debounce) should it change</p>
     */
    function useWindowSize(): any;
    /**
     * <p>Adds an event handler for an alcumus-local-event sourced event.
     * The handler does NOT receive the first <code>event</code> parameter
     * that would be passed to a normal handler, but may return <code>false</code>
     * to prevent any further handling of the event.</p>
     * <p>The handler is added in a React useEffect, this may miss immediately
     * raised events - for that use <code>useLocalEventImmediate</code>.</p>
     * <p>Event names use &quot;.&quot; to separate parts and can use &quot;*&quot; and &quot;**&quot; to handle
     * multiple events.</p>
     * @example
     * useLocalEvent('orientationchange', 'resize', doRefresh, window)
     * useLocalEvent( 'errors.changed.**', localRefresh ) // Handle everything that starts errors.changed.
     * useLocalEvent('data.updated.*', check) // Handle all data updated events
     * @param events - <p>a list of events to be handled</p>
     * @param handler - <p>the handler for the event(s)</p>
     * @param [source = alcumusLocalEvents] - <p>the emitter of the events (e.g. window)</p>
     */
    function useLocalEvent(events: string[], handler: EventHandler, source?: EventSource): void;
    /**
     * <p>Adds an event handler for an alcumus-local-event sourced event.
     * The handler does NOT receive the first <code>event</code> parameter
     * that would be passed to a normal handler, but may return <code>false</code>
     * to prevent any further handling of the event.</p>
     * <p>The handler is added in a React useLayoutEffect, this will catch rapidly
     * raised events, but causes many additional calls to add and remove
     * listeners - if you don't need this immediate handling,
     * use <code>useLocalEvent</code>.</p>
     * <p>Event names use &quot;.&quot; to separate parts and can use &quot;*&quot; to handle
     * multiple events.</p>
     * @param events - <p>a list of events to be handled</p>
     * @param handler - <p>the handler for the event(s)</p>
     * @param [source = alcumusLocalEvents] - <p>the emitter of the events (e.g. window)</p>
     */
    function useLocalEventImmediate(events: string[], handler: EventHandler, source?: EventSource): void;
}

/**
 * <p>An event handling function</p>
 * @param params - <p>the parameters passed to the event</p>
 */
declare type EventHandler = (...params: any[]) => boolean;

/**
 * <p>A source of events</p>
 */
declare interface EventSource {
    /**
     * <p>Add an event listener</p>
     * @param event - <p>name of the event</p>
     * @param handler - <p>the function to handle the event</p>
     */
    addListener(event: string, handler: (...params: any[]) => any): void;
    /**
     * <p>Remove an event listener</p>
     * @param event - <p>name of the event</p>
     * @param handler - <p>the function that handles the event</p>
     */
    removeListener(event: string, handler: (...params: any[]) => any): void;
}

declare module "dynamic/awe-library/runtime/query" {
    /**
     * <p>ANDs together two queries</p>
     * @param [target = {}] - <p>the initial where clause</p>
     * @param [withSource = {}] - <p>the second where clause</p>
     * @returns <p>the two queries ANDed together</p>
     */
    function AND(target?: WhereDefinition, withSource?: WhereDefinition): WhereDefinition;
    /**
     * <p>Resolves a query (which may use {parameters}) using an instance
     * creating a final where clause to be used with the database</p>
     * @param query - <p>the query to be resolved</p>
     * @param instance - <p>the instance to resolve parameters</p>
     * @returns <p>a where clause with parameters resolved</p>
     */
    function useQuery(query: WhereDefinition, instance: Document): WhereDefinition;
}

declare module "dynamic/awe-library/runtime/utils" {
    /**
     * <p>Returns a function that can be used to check if a component
     * is still mounted.</p>
     * <p>This  is useful in async functions</p>
     * @returns <p>a function that returns <code>true</code>
     * if the component is still mounted.</p>
     */
    function useLoaded(): CheckFunction;
    /**
     * <p>Get all of the fields associated with a document (not only visible ones)</p>
     * @param type - <p>the type to check</p>
     * @returns <p>the fields associated with the document</p>
     */
    function getFields(type: Document | DocumentDefinition | string): Promise<FieldDefinition[]>;
    /**
     * <p>Returns whether an item with a name is blank or if the parameter
     * is a string, tests that it is not blank</p>
     * @returns <p>true if the name or string is not blank</p>
     */
    function isNotBlank(fieldOrName: string | FieldDefinition): boolean;
    /**
     * <p>Extracts the name of a field</p>
     * @returns <p>the name</p>
     */
    function extractFieldName(field: FieldDefinition): string;
    /**
     * <p>A filter that tests a field and returns true if the field is
     * at the top level of a chain</p>
     * @param field - <p>the field to be tested</p>
     * @returns <p>true if the field tested is a top level field</p>
     */
    function topLevelField(field: string | FieldDefinition): boolean;
    /**
     * <p>Returns a predicate function that checks if a field name
     * is equal to the supplied value</p>
     * @param name - <p>the name to check for</p>
     * @returns <p>a predicate function that checks for the name</p>
     */
    function fieldNameIs(name: string): (...params: any[]) => any;
    /**
     * <p>Creates a label from a field name type</p>
     * @param label - <p>the label to check</p>
     * @returns <p>the cleaned label</p>
     */
    function cleanLabel(label: string): string;
    /**
     * <p>Returns a promise for a delay in milliseconds</p>
     * @param ms - <p>the number of milliseconds to wait for</p>
     * @returns <p>a promise that will be satisfied when the delay expires</p>
     */
    function delay(ms: number): Promise<void>;
    /**
     * <p>Default properties that can be set for periods of time
     * or used as a bag of configuration</p>
     */
    const properties: any;
    /**
     * <p>Sets a value in an object for a period of time</p>
     * @param property - <p>the property to set</p>
     * @param value - <p>the value to set on the property</p>
     * @param [obj = properties] - <p>the object on which to set the value</p>
     * @param [time = 750] - <p>the time to set the value for in ms</p>
     * @returns <p>A function to retrieve the value at the present moment</p>
     */
    function setForTime(property: string, value: any, obj?: any, time?: number): (...params: any[]) => any;
    /**
     * <p>A hook that given a type and a field name, returns the field definition
     * of the field, returns null before it is resolved.</p>
     * @param type - <p>the type to retrieve the value for</p>
     * @param field - <p>the name of the field to retrieve (its stored name)</p>
     * @returns <ul>
     * <li>the definition of the field</li>
     * </ul>
     */
    function useFieldDefinition(type: DocumentDefinition | Document | string, field: string): FieldDefinition;
    /**
     * <p>Retrieves the label for a question, this uses the user supplied label or generates one</p>
     * @param question - <p>the question whose label is required</p>
     * @returns <p>the label to use</p>
     */
    function getLabelFor(question: FieldDefinition): string;
    /**
     * <p>Processes a field value and if its a date, show the date as relative or a formatted
     * value</p>
     * @param value - <p>the value to format</p>
     * @param date - <p>should the value be potentially treated as a date</p>
     * @returns <p>A formatted value</p>
     */
    function process(value: any, date: boolean): string;
    /**
     * <p>creates a navigation function to a document id</p>
     * @property embed - <p>call to create a function that can embed documents inside a modal with given modes</p>
     * @property callback - <p>call to create a simple navigation function that supplies defaults for the other properties of this call
     * a function that navigates to that document and then calls the callback</p>
     * @param id - <p>the id of the document to navigate to</p>
     * @param [cb] - <p>a callback that is invoked if the goto is called</p>
     * @param [navigate] - <p>a navigate function to use as an override</p>
     * @param [location] - <p>an object to override the standard location with</p>
     * @param [modes] - <p>an array of &quot;modes&quot; to set, this allows
     * the conditional elements of the target document to be activated or
     * deactivation</p>
     * @returns <p>the function to navigate to the document</p>
     */
    function goto(id: string, cb?: (...params: any[]) => any, navigate?: (...params: any[]) => any, location?: any, modes?: Mode[]): NavigationFunction;
}

/**
 * <p>a function that can be called to perform a defined test</p>
 */
declare type CheckFunction = () => boolean;

/**
 * <p>Called to navigate to display a document to the user</p>
 * @param id - <p>the id of the document to navigate to</p>
 */
type NavigateFunction = (id: string) => void;
declare type NavigateToIdFunction = (id: string)=>void;

/**
 * <p>A function that navigates to a document</p>
 * @param params - <p>parameters to be passed to the callback function used in the specification</p>
 */
declare type NavigationFunction = (...params: any[]) => void;

/**
 * <p>The embed function is used to create a function that can navigate to
 * and id and show that document in a modal.</p>
 * @param options - <p>options to be passed to the modal</p>
 * @param modes - <p>the modes to associate with the document</p>
 * <p>Modes are used by conditional parts of the document definition
 * (as configured) to show and hide parts of the UI</p>
 */
declare type EmbedFunction = (options: any, modes: Mode[]) => NavigationFunction;

/**
 * <p>This function creates a navigation function that wraps the parameters
 * of the usual goto to create a function that takes a single id and then
 * applies the other parameters</p>
 * @param [cb] - <p>a callback that is invoked if the goto is called</p>
 * @param [navigate] - <p>a navigate function to use as an override</p>
 * @param [location] - <p>an object to override the standard location with</p>
 * @param [modes] - <p>an array of &quot;modes&quot; to set, this allows
 * the conditional elements of the target document to be activated or
 * deactivation</p>
 */
declare type CallbackGotoFunction = (cb?: (...params: any[]) => any, navigate?: (...params: any[]) => any, location?: any, modes?: Mode[]) => NavigateToIdFunction;

/**
 * <p>A mode that can be used by configurators to specify how a document
 * should be displayed in different modal states.  For instance,
 * we may be tyring to display a document for review or administration
 * and so different parts of the UI may be visible.</p>
 * <p>A configurer can use queries in conditionals to specify what modes
 * must exist for an item to be visible and may also configure the
 * modes that a button uses when activating a document.</p>
 * @property mode - <p>the name of the mode</p>
 * @property value - <p>a value for the mode</p>
 */
declare interface Mode {
    mode: string;
    value: string;
}

declare module "dynamic/awe-library/runtime/navigate" {
    /**
     * <p>Navigate to a document or id immediately</p>
     * @param documentOrId - <p>the document to navigate to</p>
     * @param [navigate] - <p>an override for the standard navigation</p>
     * @param [location] - <p>an override for the standard location</p>
     */
    function navigateToDocument(documentOrId: string | Document, navigate?: (...params: any[]) => any, location?: any): void;
}

declare module "dynamic/awe-library/runtime/create-document" {
    /**
     * <p>Creates an object provided with a document type</p>
     * @param [parent = null] - <p>the parent of the document being created</p>
     * @param typeId - <p>the id of the document type to create</p>
     * @param [context = {}] - <p>default context (used by context fields) for the document being created</p>
     * @param [fromRaw = false] - <p>if true use the latest version of the document, not the active published version</p>
     * @param [id] - <p>if supplied use the id for the document, otherwise generate one</p>
     * @param [props = {}] - <p>any props to immediately set on the document</p>
     * @param [alwaysCreate = false] - <p>documents are often not really created before the first submission, setting true
     * here makes the document create immediately</p>
     * @returns <p>a promise for the created document</p>
     */
    function createDocumentOfType(parent: Document, typeId: string, context?: any, fromRaw?: boolean, id?: string, props?: any, alwaysCreate?: boolean): Promise<Document>;
    /**
     * <p>Ensure that a document has been created with an id and a given
     * type.  This is predominantly used for applications whose
     * id is the user id (they have their own unique copy of the data)</p>
     * @param id - <p>the id that must exist</p>
     * @param type - <p>the type that the id is to be created for</p>
     * @returns <p>a promise that is resolved when the id is known to exist</p>
     */
    function ensure(id: string, type: DocumentDefinition): Promise<void>;
}

declare module "dynamic/awe-library/runtime/app-urls" {
    /**
     * <p>Returns a url given an app type</p>
     * @param appType - <p>the type to get a url for</p>
     * @returns <p>a unique id for a document</p>
     */
    function appUrl(appType: DocumentDefinition): string;
    /**
     * <p>Returns a url given an app type, ensuring that the document exists</p>
     * @param appType - <p>the type to get a url for</p>
     * @returns <p>a promise for a unique id for a document</p>
     */
    function guaranteedAppUrl(appType: DocumentDefinition): Promise<string>;
    /**
     * <p>A hook to get a url for an application which is guaranteed to
     * exist</p>
     * @param typeId - <p>the type for which a url is required</p>
     * @returns <p>an empty string until an app url is generated</p>
     */
    function useAppUrl(typeId: string): string;
}

declare module "dynamic/awe-library/runtime/button-style" {
    /**
     * <p>A hook, that passed the definition of a question
     * including a button definition, will return the necessary styles.</p>
     * @param field - <p>a field including a button</p>
     * @returns <p>classes including 'button' which is to be used to
     * style the button</p>
     */
    function useButtonStyle(field: FieldDefinition): any;
}

declare module "dynamic/awe-library/runtime/records" {
    /**
     * <p>A function to retrieve records from a type.  The documents
     * retrieved are automatically updated by replaying local
     * changes.</p>
     * @param type - <p>the type whose records should be retrieved</p>
     * @param [query] - <p>a query to apply</p>
     * @param [skip] - <p>the number of records to skip</p>
     * @param [take] - <p>the number of records to return</p>
     * @param [options] - <p>options to provide</p>
     * @returns <p>a promise for the matching records and field definitions in the type</p>
     */
    function getRecords(type: string | DocumentDefinition, query?: WhereDefinition, skip?: number, take?: number, options?: ListOptions): Promise<RecordResults>;
    /**
     * <p>A hook function to retrieve records from a type.  The documents
     * retrieved are automatically updated by replaying local
     * changes. Returns [[], []] until valid results are available</p>
     * @param type - <p>the type whose records should be retrieved</p>
     * @param [query] - <p>a query to apply</p>
     * @param [skip] - <p>the number of records to skip</p>
     * @param [take] - <p>the number of records to return</p>
     * @param [options] - <p>options to provide</p>
     * @returns <p>The records and field definitions</p>
     */
    function useRecordsOfType(type: string | DocumentDefinition, query?: WhereDefinition, skip?: number, take?: number, options?: ListOptions): RecordResults;
    /**
     * <p>Retrieves a type - we always prefer the server for types</p>
     * @param id - <p>the id of the type</p>
     * @returns <p>a promise for the definition</p>
     */
    function getType(id: string): Promise<DocumentDefinition>;
}

/**
 * @property 0 - <p>the items retrieved</p>
 * @property 1 - <p>the field definitions</p>
 */
declare type RecordResults = any[];

/**
 * <p>This module contains the useful
 * contexts for the runtime app environment</p>
 */
declare module "dynamic/awe-library/runtime/contexts" {
    /**
     * <p>A hook to provide the current media &quot;break&quot;
     * for the display.</p>
     * <p>Returns cs, md or lg and changes when the display
     * is resized</p>
     */
    function useWidthBreak(): string;
    /**
     * <p>Returns the runtime context for the document currently being
     * edited or displayed.</p>
     * @returns <p>the context for the current document</p>
     */
    function useDocumentContext(): IRuntimeDocumentContext;
    /**
     * <p>While using a &quot;related repeat&quot; component to repeat some
     * child questions for a set of related documents, this provides
     * the information about the id of the related child and it's position
     * in the list being displayed</p>
     * @returns <p>the context of the currently used document</p>
     */
    function useRelatedContext(): IRuntimeRelatedContext;
    /**
     * <p>Returns the width currently being used as the max width
     * of the current section</p>
     */
    function useWidth(): number;
    /**
     * <p>Returns the &quot;options&quot; for the current question, this is
     * a set of useful information that contains information
     * about suggested layout and padding, errors etc.</p>
     * @returns <p>the options associated</p>
     */
    function useOptions(): IRuntimeQuestionOptions;
    /**
     * <p>A hook that returns the current ErrorState for the current question
     * and updates as necessary</p>
     */
    function useError(): ErrorState;
    /**
     * <p>A hook to get the current input props for a React component,
     * ignoring contextual/non-component props</p>
     * @param ignoreProps - <p>additional props to ignore</p>
     * @returns <p>An object to spread onto a React component</p>
     */
    function useInputProps(...ignoreProps: string[]): any;
    /**
     * <p>Returns the &quot;options&quot; for the current question, this is
     * a set of useful information that contains information
     * about suggested layout and padding, errors etc.</p>
     * @returns <p>the options associated</p>
     */
    function useComponentContext(): IRuntimeQuestionOptions;
    /**
     * <p>A hook which returns the current question instance being processed.
     * This is very useful in support components to avoid significant
     * parameter passing.</p>
     * @returns <p>the currently processed field definition</p>
     */
    function useQuestionContext(): FieldDefinition;
    /**
     * <p>Returns the current instance for the edited content of
     * the current document.  This contains a <code>instance</code>
     * member which is the actual document contents as edited.</p>
     * <p>This is very useful to get the current editors view
     * of a document in a sub component.</p>
     * @returns <p>the current instance being edited.</p>
     */
    function useInstanceContext(): DocumentInstance;
}

/**
 * <p>vital document context for the
 * currently running document</p>
 * @property document - <p>the currently edited document</p>
 * @property bag - <p>a bag of key value pairs that can be used
 * to carry information about the current document around while it
 * is in memory and/or on screen</p>
 */
declare interface IRuntimeDocumentContext {
    document: Document;
    bag: object;
}

/**
 * <p>Information pertaining to the currently displayed
 * document in a related repeat question</p>
 * @property number - <p>the index of the item in the list</p>
 * @property id - <p>the document id of the item</p>
 */
declare interface IRuntimeRelatedContext {
    number: number;
    id: string;
}

/**
 * <p>Useful options for the current question in
 * the current context and screen space</p>
 * @property labelStyle - <p>the label style for the current context 'floating' 'static' etc</p>
 * @property mobile - <p>true if this is a mobile device view</p>
 * @property theme - <p>mobiscroll theme - defaults to ios</p>
 * @property touchUi - <p>whether this device should provided assistive mobiscroll
 * components for touch interfaces</p>
 * @property className - <p>the class name to apply to any container</p>
 * @property questionPadding - <p>material UI padding units for the question</p>
 * @property questionAdjust - <p>material UI left/right adjust for margin</p>
 * @property questionClass - <p>the class to apply to the text of the question associated</p>
 * @property gridPadding - <p>the padding to use on grids for the current screen state</p>
 * @property questionSpacing - <p>the suggested vertical spacing between questions in material ui spacing units</p>
 * @property stack - <p>how many columns should a stacked question occupy</p>
 * @property currencySymbol - <p>the symbol to use for currency</p>
 * @property helpNumbers - <p>whether a touch pad should be used for numbers</p>
 * @property boxPadding - <p>the number of material UI spacing units to pad a sub box with</p>
 * @property embedPadding - <p>the number of material UI spacing units to use when embeding additional form content</p>
 */
declare interface IRuntimeQuestionOptions {
    /**
     * <p>(used internally) call to change to a desktop style view</p>
     */
    nonMobile(): void;
    /**
     * <p>Hook to return the current error state of the question</p>
     * @returns <p>the current error state of the question (suitable for
     * directly applying to a mobiscroll component)</p>
     */
    useError(): ErrorState;
    /**
     * <p>Gets properties to apply to a React component from the options.
     * Many of the properties of the options are informational and shouldn't
     * be applied directly to a component.  This function screens out the
     * ones that shouldn't be applied and provides an object to spread
     * onto the underlying React component.</p>
     * @param omit - <p>a list of additional properties to omit</p>
     * @returns <p>properties object</p>
     */
    props(...omit: string[]): any;
}

/**
 * <p>Describes the error state of a question</p>
 * @property valid - <p>true if the current content is valid</p>
 * @property errorMessage - <p>an error message to show for the component</p>
 */
declare interface ErrorState {
    valid: boolean;
    errorMessage?: string;
}

/**
 * <p>This is the document that is being edited by the
 * user, it contains methods to commit and save the current state
 * and provides access to the current state of the document
 * as the user sees it throughout their editing experience.</p>
 * @property instance - <p>the contents of the document as it is being edited</p>
 * @property document - <p>the underlying document</p>
 */
declare interface DocumentInstance {
    /**
     * <p>Saves the current edits to the document instance.
     * This is what you do during editing, it does not commit the
     * instance to the server or take any action, just maintains the
     * current editing state.</p>
     */
    save(): void;
    /**
     * <p>Abandons all current edits to the document and
     * clears the instance here and on any synchronised devices</p>
     */
    reset(): void;
    /**
     * <p>Commits the instance and specifies the
     * optimistic expected state</p>
     * @param toState - <p>the expected next state</p>
     * @param [command = setData] - <p>the command to use to submit the instance</p>
     * @param [controller] - <p>a controller that can cover storing data in different locations, rarely used</p>
     * @param [$create] - <p>a document to create before applying the instance to it</p>
     */
    commit(toState: string, command?: string, controller?: any, $create?: Document): void;
}

declare module "dynamic/awe-library/runtime/question-value" {
    /**
     * <p>Given a document or the instance values of a document, retrieve the value
     * of a field and the question that created it</p>
     * @example
     * const [value, question] = await getQuestionValue(document, 'some.field')
     * @param document - <p>the set of values for the document</p>
     * @param field - <p>the name of the field to retrieve (can include a property path string)</p>
     * @returns <p>A promise for an array with the results, the first element is the value, the second is the question</p>
     */
    function getQuestionValue(document: Document | any, field: string): Promise<any[]>;
    /**
     * <p>A hook to retrieve the value of a question and the question definition.  The definition
     * is useful for things like choice questions where you might want to look up the label</p>
     * @example
     * const {instance: {instance}} = useInstanceContext()
     * const [value] = useQuestionValue(instance, 'fieldNameGoesHere')
     * @param document - <p>the set of values for the document</p>
     * @param field - <p>the name of the field to retrieve (can include a property path string)</p>
     * @returns <p>the first element is the value, the second is the question</p>
     */
    function useQuestionValue(document: Document | any, field: string): any[];
    /**
     * <p>Given a document or instance, populates a string that uses { and } delimited
     * parameters to embed values from the document.  The document
     * can be a document value or the instance for the document</p>
     * @param document - <p>the set of values for the document</p>
     * @param text - <p>the text to replace</p>
     * @returns <p>A promise for the string with the values replaced</p>
     */
    function getMappedString(document: Document | any, text: string): Promise<string>;
    /**
     * <p>A hook, that given a document or instance, populates a string that uses { and } delimited
     * parameters to embed values from the document.  The document
     * can be a document value or the instance for the document.</p>
     * <p>The string parameters can have a function and parameters delimited by : the functions are
     * passed using a string-process-FUNCTIONNAME event and the standard ones are:</p>
     * <p>date - that takes a format or long/short/medium (default)
     * if - which returns the first parameter if the value exists or the second if it does not.</p>
     * <p><code> The date is {someDate:date:short} {someText:Text is} {someText}</code></p>
     * <p>This can be used to embed values in HTML etc.</p>
     * @param document - <p>the set of values for the document</p>
     * @param text - <p>the text to replace</p>
     * @param refreshId - <p>an id used to indicate that the process should run again</p>
     * @returns <p>The resulting string having embedded the parameters</p>
     */
    function useMappedString(document: Document | any, text: string, refreshId: string): string;
}

