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
  HasName<Name> & {
    members: Record<string, Model | Field | Method | Action | ((argument: any) => unknown)>;
  };

export type View<Name extends string = string> = Node<"view"> &
  HasName<Name> & {
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
    renderable: Renderable;
  };

export type Renderable = Node<"renderable"> & {
  element: Feature | Landscape;
};

/* Tier 2 */

export type HasName<Name extends string = string> = {
  name: Name;
};

export type Field<M extends Model = Model> = Node<"field"> & {
  publisher: Data<M> | Store<M> | Switch<M> | Parameter<M> | Pointer<M> | MethodCall<M>;
};

export type Method<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"method"> & {
  result: Field<M>;
  parameter?: P extends Model ? HasName & Parameter<P> : never;
};

export type Action<M extends Model | null = Model | null> = Node<"action"> & {
  steps: Array<ActionCall | StreamCall | Exception>;
  parameter?: M extends Model ? HasName & Parameter<M> : never;
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

/* Tiers 3 and greater */

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

export type Store<M extends Model = Model> = Node<"store"> &
  Modeled<M> & {
    data: Data<M>;
  };

export type Switch<M extends Model = Model> = Node<"switch"> &
  Modeled<M> & {
    condition: Field<Model<"Boolean">>;
    positive: Field<M>;
    negative: Field<M>;
  };

export type Parameter<M extends Model = Model> = Node<"parameter"> & Modeled<M>;

export type Pointer<M extends Model = Model> = Node<"pointer"> &
  Modeled<M> &
  HasAddress & {
    scope?: MethodCall;
  };

export type MethodCall<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"methodCall"> &
  Modeled<M> &
  HasAddress & {
    argument?: P extends Model ? Field<P> : never;
    scope?: MethodCall;
  };

export type ActionCall<M extends Model | null = Model | null> = Node<"actionCall"> &
  HasAddress & {
    argument?: M extends Model ? Field<M> : never;
  };

export type StreamCall<M extends Model | null = Model | null> = Node<"streamCall"> &
  Modeled<M> &
  HasName & {
    output: M extends Model ? Field<M> : never;
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

export type Structure<M extends Model = Model> = Node<"structure"> &
  Modeled<M> & {
    properties: {
      [Key in keyof M["members"]]?: M["members"][Key] extends Field
        ? Property<M["members"][Key]>
        : never;
    };
  };

export type HasAddress = {
  address: Array<string>;
};

export type WritableParameter<M extends Model = Model> = Parameter<M> & {
  writable: true;
};

export type WritableField<M extends Model> = Node<"field"> & {
  publisher: WritableParameter<M> | WritablePointer<M> | Store<M>;
};

export type WritablePointer<M extends Model = Model> = Pointer<M> & {
  writable: true;
};
