export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  members: Record<string, Model | View>;
  renders: Component;
};

export type Node<Kind extends string> = {
  kind: Kind;
};

export type Model<Name extends string = string> = Node<"model"> &
  Called<Name> & {
    members: Record<string, Model | Field | Method | Action | ((argument: any) => unknown)>;
  };

export type Called<Name extends string = string> = {
  name: Name;
};

export type Field<M extends Model = Model> = Node<"field"> & {
  channel: Store<M> | Binding<M> | Slot<M> | Option<M> | FieldPointer<M> | MethodPointer<M>;
};

export type Method<
  M extends Model = Model,
  P extends Model | null = Model | null,
> = Node<"method"> & {
  parameter: P extends Model ? Called & ReadOnlyField<P> : never;
  result: ReadOnlyField<M>;
};

export type Action<M extends Model | null = Model | null> = Node<"action"> & {
  parameter: M extends Model ? Called & ReadOnlyField<M> : never;
  steps: Array<ActionPointer | Exception | StreamPointer>;
};

export type Store<M extends Model> = Node<"store"> &
  Modeled<M> & {
    value: Value<M>;
  };

export type Binding<M extends Model> = Node<"binding"> & Modeled<M>;

export type Slot<M extends Model> = Node<"slot"> & Modeled<M>;

export type Option<M extends Model> = Node<"option"> &
  Modeled<M> & {
    condition: Field<Model<"Boolean">>;
    result: Field<M>;
    opposite: Field<M>;
  };

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

export type ReadOnlyField<M extends Model> = Node<"field"> & {
  channel: Slot<M> | Option<M> | FieldPointer<M> | MethodPointer<M>;
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

export type Value<M extends Model = Model> = M["name"] extends "Array"
  ? Array<Field>
  : M["name"] extends "Boolean"
  ? boolean
  : M["name"] extends "Number"
  ? number
  : M["name"] extends "String"
  ? string
  : M["name"] extends "Component"
  ? Component
  : Array<Field> | boolean | number | string | Component | Structure<M>;

export type Structure<M extends Model = Model> = Node<"structure"> &
  Modeled<M> & {
    properties: {
      [Key in keyof M["members"]]?: M["members"][Key] extends Field
        ? Property<M["members"][Key]>
        : never;
    };
  };

export type Property<M extends Field> = M["channel"] extends Binding<infer Class>
  ? Field<Class>
  : M["channel"] extends Slot<infer Class>
  ? ReadOnlyField<Class>
  : never;

export type View<Name extends string = string> = Node<"view"> &
  Called<Name> & {
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
    renders: Component;
  };

export type Stream<M extends Model | null = Model | null> = Node<"stream"> & Modeled<M>;

export type Component = Node<"component"> & {
  renders: Feature | Landscape;
};

export type Feature = Node<"feature"> & {
  tagName: string;
  properties: Record<string, Field>;
  reactions: Record<`on${string}`, Action>;
};

export type Landscape<M extends View = View> = Node<"landscape"> & {
  viewName: M["name"];
  properties: {
    [Key in keyof M["fields"]]?: Property<M["fields"][Key]>;
  };
  reactions: {
    [Key in keyof M["streams"]]?: M["streams"][Key] extends Stream<infer Parameter>
      ? Action<Parameter>
      : never;
  };
};
