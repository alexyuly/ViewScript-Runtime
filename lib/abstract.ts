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
  Called<Name> & {
    members: Record<string, Model | Field | Method | Action | ((argument: any) => unknown)>;
  };

export type View<Name extends string = string> = Node<"view"> &
  Called<Name> & {
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
    renderable: Renderable;
  };

export type Renderable = Node<"renderable"> & {
  element: Feature | Landscape;
};

/* Tier 2 */

export type Called<Name extends string = string> = {
  name: Name;
};

export type Field<M extends Model = Model> = Node<"field"> & {
  channel:
    | Value<M>
    | FieldPlan<M>
    | FieldPointer<M>
    | MethodPointer<M>
    | Option<M>
    | Store<M>
    | WritableFieldPlan<M>
    | WritableFieldPointer<M>;
};

export type Method<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"method"> & {
  parameter: P extends Model ? Called & Field<P> : never;
  result: Field<M>;
};

export type Action<M extends Model | null = Model | null> = Node<"action"> & {
  parameter: M extends Model ? Called & Field<M> : never;
  steps: Array<ActionPointer | Exception | StreamPointer>;
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
    [Key in keyof V["streams"]]?: V["streams"][Key] extends Stream<infer P> ? Action<P> : never;
  };
};

/* Tier 3 */

export type Value<M extends Model> = M["name"] extends "Array"
  ? Array<Field>
  : M["name"] extends "Boolean"
  ? boolean
  : M["name"] extends "Number"
  ? number
  : M["name"] extends "String"
  ? string
  : M["name"] extends "Renderable"
  ? Renderable
  : Array<Field> | boolean | number | string | Renderable | Structure<M>;

export type FieldPlan<M extends Model> = Node<"fieldPlan"> & Modeled<M>;

export type FieldPointer<M extends Model> = Node<"fieldPointer"> &
  Modeled<M> & {
    leader?: MethodPointer;
    fieldPath: Array<string>;
  };

export type MethodPointer<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"methodPointer"> &
  Modeled<M> & {
    leader?: MethodPointer;
    methodPath: Array<string>;
    argument: P extends Model ? Field<P> : never;
  };

export type Option<M extends Model> = Node<"option"> &
  Modeled<M> & {
    condition: Field<Model<"Boolean">>;
    result: Field<M>;
    opposite: Field<M>;
  };

export type Store<M extends Model> = Node<"store"> &
  Modeled<M> & {
    firstValue: Value<M>;
  };

export type WritableFieldPlan<M extends Model> = Node<"writableFieldPlan"> & Modeled<M>;

export type WritableFieldPointer<M extends Model> = Node<"writableFieldPointer"> &
  Modeled<M> & {
    fieldPath: Array<string>;
  };

export type ActionPointer<M extends Model | null = Model | null> = Node<"actionPointer"> & {
  actionPath: Array<string>;
  argument: M extends Model ? Field<M> : never;
};

export type Exception = Node<"exception"> & {
  condition: Field<Model<"Boolean">>;
  steps?: Array<ActionPointer | Exception | StreamPointer>;
};

export type StreamPointer<M extends Model | null = Model | null> = Node<"streamPointer"> &
  Modeled<M> & {
    streamName: string;
  };

export type Modeled<M extends Model | null> = {
  modelName: M extends Model ? M["name"] : never;
};

export type Property<F extends Field> = F["channel"] extends WritableFieldPlan<infer M>
  ? WritableField<M>
  : F["channel"] extends FieldPlan<infer M>
  ? Field<M>
  : never;

/* Tier 4 */

export type Structure<M extends Model> = Node<"structure"> &
  Modeled<M> & {
    properties: {
      [Key in keyof M["members"]]?: M["members"][Key] extends Field
        ? Property<M["members"][Key]>
        : never;
    };
  };

export type WritableField<M extends Model> = Node<"field"> & {
  channel: Store<M> | WritableFieldPlan<M> | WritableFieldPointer<M>;
};
