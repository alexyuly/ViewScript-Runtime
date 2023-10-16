// Tree structures and concepts:

/**
 * A node in the abstract syntax tree.
 */
export type Node<Kind extends string> = {
  kind: Kind;
};

export type Named<Name extends string = string> = {
  name: Name;
};

export type Modeled<T extends Model> = {
  modelName: T["name"];
};

// Fields:

/**
 * An abstract source of data feeding into a subscriber.
 */
export type Field<T extends Model = Model> = Node<"field"> &
  Modeled<T> & {
    publisher: Value<T> | FieldPointer<T> | MethodPointer<T> | Condition<T>;
  };

export type NamedField<T extends Model = Model> = Field<T> & Named;

export type PublicField<T extends Model = Model> = NamedField<T> & {
  public: true;
};

// Values:

/**
 * An anonymous source of data feeding into a subscriber.
 */
export type Value<T extends Model = Model> = T["name"] extends "Boolean"
  ? boolean
  : T["name"] extends "Number"
  ? number
  : T["name"] extends "String"
  ? string
  : T["name"] extends "Element"
  ? Element
  : T["name"] extends "Array"
  ? Array<Field>
  : T["name"] extends `Array of ${infer InnerModelName}`
  ? Array<Field<Model<InnerModelName>>>
  : Structure<Model>;

/**
 * A mapping of keys to data sources.
 */
export type Structure<T extends Model> = Node<"structure"> &
  Modeled<T> & {
    data: StructuredData<T>;
  };

export type StructuredData<T extends Model> = {
  [Key in keyof T["members"]]: T["members"][Key] extends Field
    ? T["members"][Key]
    : never;
};

/**
 * A binding to an HTML element.
 * It is rendered using either a view or an HTML tag name.
 */
export type Element = Node<"element">;

export type AtomicElement = Element & {
  tagName: string;
  properties: Record<string, Field | SideEffect>;
};

export type ViewElement<T extends View> = Element & {
  viewName: T["name"];
  properties: {
    [Key in keyof T["terrain"]]: T["terrain"][Key] extends Stream
      ? T["terrain"][Key]
      : T["terrain"][Key] extends PublicField<infer FieldModel>
      ? Field<FieldModel>
      : never;
  };
};

// Other publishers of data:

/**
 * A reference to a field, or a data source within its structure.
 */
export type FieldPointer<T extends Model> = Node<"fieldPointer"> &
  Modeled<T> & {
    pathToField: Array<string>;
  };

/**
 * A source of data from subscribing to a method.
 */
export type MethodPointer<
  T extends Model,
  Parameter extends Model = Model,
> = Node<"methodPointer"> &
  Modeled<T> & {
    pathToMethod: Array<string>;
    argument?: Field<Parameter>;
    continuation?: FieldPointer<T> | MethodPointer<T, Parameter>;
  };

/**
 * An identifiable mapping of an optional parameter to a result.
 */
export type Method<
  T extends Model = Model,
  Parameter extends Model = Model,
> = Node<"method"> &
  Modeled<T> & {
    parameter?: Field<Parameter>;
    result: Field<T>;
  };

export type NamedMethod<
  T extends Model = Model,
  Parameter extends Model = Model,
> = Method<T, Parameter> & Named;

/**
 * A conditional source of data.
 */
export type Condition<T extends Model> = Node<"condition"> &
  Modeled<T> & {
    when: Field<Model<"Boolean">>;
    then: Field<T>;
    else?: Field<T>;
  };

// Side Effects:

/**
 * An abstract drain for data flowing out of a publisher.
 */
export type SideEffect = Action | ActionStep;

/**
 * An identifiable mapping of an optional parameter to a series of steps.
 */
export type Action<Parameter extends Model = Model> = Node<"action"> & {
  parameter?: Field<Parameter>;
  steps: Array<ActionStep>;
};

export type NamedAction<Parameter extends Model = Model> = Action<Parameter> &
  Named;

/**
 * A step taken by an action.
 */
export type ActionStep = ActionPointer | StreamPointer | Fork;

/**
 * An aggregate side effect which results from calling an action.
 */
export type ActionPointer<Parameter extends Model = Model> =
  Node<"actionReference"> & {
    pathToAction: Array<string>;
    argument?: Field<Parameter>;
  };

/**
 * A reference to a stream.
 */
export type StreamPointer<T extends Model = Model> = Node<"streamReference"> &
  Modeled<T> & {
    streamName: string;
  };

/**
 * An identifiable channel for data flowing out of an element.
 */
export type Stream<T extends Model = Model> = Node<"stream"> &
  Named &
  Modeled<T>;

/**
 * A conditional fork in a series of steps.
 */
export type Fork = Node<"fork"> & {
  when: Field<Model<"Boolean">>;
  then?: Array<ActionStep>;
};

// Applications:

/**
 * A template used to construct an element.
 * It has a set of fields and streams which bind to element properties at runtime.
 */
export type View<Name extends string = string> = Node<"view"> &
  Named<Name> & {
    element: Element;
    terrain: Record<string, Stream | NamedField>;
  };

/**
 * A template used to construct, use, and manipulate data.
 * It has a set of fields, methods, and actions which bind to field members at runtime.
 */
export type Model<Name extends string = string> = Node<"model"> &
  Named<Name> & {
    members: Record<string, NamedField | NamedMethod | NamedAction>;
  };

/**
 * An abstract ViewScript app.
 */
export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  root: View;
  branches: Record<string, View | Model>;
};

// Type Guards:

// TODO Add these as needed.
