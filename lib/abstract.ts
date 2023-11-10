/* Tier 0 */

/**
 * An app node is the root of a ViewScript application.
 * It has a set of models and views, and it renders a live tree of HTML elements.
 */
export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  domain: Record<string, Model | View>;
  renderable: Renderable;
};

/* Tier 1 */

export type Node<Kind extends string> = {
  kind: Kind;
};

export type Model<Name extends string = string> = Node<"model"> &
  Named<Name> & {
    members: Record<string, Model | Field | Method | Action | ((argument: any) => unknown)>;
  };

export type View<Name extends string = string> = Node<"view"> &
  Named<Name> & {
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
    renderable: Renderable;
  };

export type Renderable = Node<"renderable"> & {
  element: Feature | Landscape;
};

/* Tier 2 */

export type Named<Name extends string = string> = {
  name: Name;
};

/**
 * A field contains a publisher which sends out values of a certain type.
 * It inherits sub-fields and methods from its model.
 */
export type Field<M extends Model = Model> = Node<"field"> & {
  publisher:
    | Data<M>
    | Parameter<M>
    | Pointer<M>
    | Switch<M>
    | MethodCall<M>
    | Store<M>
    | WritableParameter<M>
    | WritablePointer<M>;
};

export type Method<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"method"> & {
  parameter: P extends Model ? Named & Parameter<P> : never;
  result: Field<M>;
};

export type Action<M extends Model | null = Model | null> = Node<"action"> & {
  parameter: M extends Model ? Named & Parameter<M> : never;
  steps: Array<ActionCall | StreamCall | Exception>;
};

export type Stream<M extends Model | null = Model | null> = Node<"stream"> & Modeled<M>;

export type Feature = Node<"feature"> & {
  tagName: string;
  properties: Record<string, Field>;
  reactions: Record<`on${string}`, Action>;
};

export type Landscape<V extends View = View> = Node<"landscape"> & {
  viewName: V["name"];
  properties: {
    [Key in keyof V["fields"]]?: Property<V["fields"][Key]>;
  };
  reactions: {
    [Key in keyof V["streams"]]?: V["streams"][Key] extends Stream<infer M> ? Action<M> : never;
  };
};

/* Tier 3 */

export type Data<M extends Model | null = Model | null> = Node<"data"> &
  Modeled<M> & {
    value: M extends Model
      ? M["name"] extends "Array"
        ? Array<Field>
        : M["name"] extends "Boolean"
        ? boolean
        : M["name"] extends "Number"
        ? number
        : M["name"] extends "String"
        ? string
        : M["name"] extends "Renderable"
        ? Renderable
        : Array<Field> | boolean | number | string | Renderable | Structure<M>
      : unknown;
  };

export type Parameter<M extends Model = Model> = Node<"parameter"> & Modeled<M>;

export type Pointer<M extends Model = Model> = Node<"pointer"> &
  Modeled<M> & {
    leader?: MethodCall;
    fieldPath: Array<string>;
  };

export type Switch<M extends Model = Model> = Node<"switch"> &
  Modeled<M> & {
    condition: Field<Model<"Boolean">>;
    positive: Field<M>;
    negative: Field<M>;
  };

export type MethodCall<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"methodCall"> &
  Modeled<M> & {
    leader?: MethodCall;
    methodPath: Array<string>;
    argument: P extends Model ? Field<P> : never;
  };

export type Store<M extends Model = Model> = Node<"store"> &
  Modeled<M> & {
    seedData: Data<M>;
  };

export type WritableParameter<M extends Model = Model> = Node<"writableParameter"> & Modeled<M>;

export type WritablePointer<M extends Model = Model> = Node<"writablePointer"> &
  Modeled<M> & {
    fieldPath: Array<string>;
  };

export type ActionCall<M extends Model | null = Model | null> = Node<"actionCall"> & {
  actionPath: Array<string>;
  argument: M extends Model ? Field<M> : never;
};

export type StreamCall<M extends Model | null = Model | null> = Node<"streamCall"> &
  Modeled<M> & {
    streamName: string;
    argument: M extends Model ? Field<M> : never;
  };

export type Exception = Node<"exception"> & {
  condition: Field<Model<"Boolean">>;
  steps?: Array<ActionCall | StreamCall | Exception>;
};

export type Modeled<M extends Model | null> = {
  modelName: M extends Model ? M["name"] : never;
};

export type Property<F extends Field> = F["publisher"] extends Parameter<infer M>
  ? Field<M>
  : F["publisher"] extends WritableParameter<infer M>
  ? WritableField<M>
  : never;

/* Tier 4 */

export type Structure<M extends Model = Model> = Node<"structure"> &
  Modeled<M> & {
    properties: {
      [Key in keyof M["members"]]?: M["members"][Key] extends Field
        ? Property<M["members"][Key]>
        : never;
    };
  };

/**
 * A writable field contains a publisher which publishes AND subscribes to values of a certain type.
 * It inherits sub-fields, methods, AND actions from its model.
 */
export type WritableField<M extends Model> = Node<"field"> & {
  publisher: Store<M> | WritableParameter<M> | WritablePointer<M>;
};
