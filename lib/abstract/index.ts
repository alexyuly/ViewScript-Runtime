export * from "./guards";

/* Tier 0 */

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  domain: Record<string, Model | View>;
  renderable: Renderable;
};

/* Tier 1 */

export type Node<Kind extends string = string> = {
  kind: Kind;
};

export type Model<Name extends string = string> = Node<"model"> &
  Named<Name> & {
    members: Record<string, Field | Method | Action>;
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

export type Field<M extends Model = Model> = Node<"field"> & {
  publisher: Parameter<M> | Data<M> | Store<M> | Switch<M> | Pointer<M> | MethodCall<M>;
};

export type Method<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"method"> & {
  parameter?: P extends Model ? Named & Parameter<P> : never;
  result: Field<M>;
};

export type Action<M extends Model | null = Model | null> = Node<"action"> & {
  parameter?: M extends Model ? Named & Parameter<M> : never;
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

/* Tiers 3 and greater */

export type Parameter<M extends Model = Model> = Node<"parameter"> & Modeled<M>;

export type Data<M extends Model = Model> = Node<"data"> &
  Modeled<M> & {
    value: M["name"] extends "Array"
      ? Array<Field>
      : M["name"] extends "Boolean"
      ? boolean
      : M["name"] extends "Number"
      ? number
      : M["name"] extends "String"
      ? string
      : M["name"] extends "Renderable"
      ? Renderable
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

export type Pointer<M extends Model = Model> = Node<"pointer"> &
  Modeled<M> & {
    scope?: MethodCall;
    address: Array<string>;
  };

export type MethodCall<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"methodCall"> &
  Modeled<M> & {
    scope?: MethodCall;
    address: Array<string>;
    argument?: P extends Model ? Field<P> : never;
  };

export type ActionCall<M extends Model | null = Model | null> = Node<"actionCall"> & {
  address: Array<string>;
  argument?: M extends Model ? Field<M> : never;
};

export type StreamCall<M extends Model | null = Model | null> = Node<"streamCall"> &
  Modeled<M> &
  Named & {
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
  : F["publisher"] extends { writable: true } & Parameter<infer M>
  ? WritableField<M>
  : never;

export type WritableField<M extends Model> = Node<"field"> & {
  publisher: Store<M> | ({ writable: true } & (Parameter<M> | Pointer<M>));
};

export type Structure<M extends Model = Model> = Node<"structure"> &
  Modeled<M> & {
    properties: {
      [Key in keyof M["members"]]?: M["members"][Key] extends Field
        ? Property<M["members"][Key]>
        : never;
    };
  };
