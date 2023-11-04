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

export type Field<T extends Model = Model> = Node<"field"> &
  Modeled<T> & {
    channel: Slot<T> | Option<T> | FieldPointer<T> | MethodPointer<T>;
  };

export type Method<
  T extends Model = Model,
  Parameter extends Model | null = Model | null,
> = Node<"method"> &
  Modeled<T> & {
    parameter: Parameter extends Model ? Called & Field<Parameter> : never;
    result: Field<T>;
  };

export type Action<Parameter extends Model | null = Model | null> = Node<"action"> & {
  parameter: Parameter extends Model ? Called & Field<Parameter> : never;
  steps: Array<ActionPointer | Exception | StreamPointer>;
};

export type Modeled<T extends Model> = {
  modelName: T["name"];
};

export type Slot<T extends Model> = Node<"slot"> & Modeled<T>;

export type Option<T extends Model> = Node<"option"> &
  Modeled<T> & {
    condition: Field<Model<"Boolean">>;
    result: Field<T>;
    opposite: Field<T>;
  };

export type FieldPointer<T extends Model> = Node<"fieldPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    fieldPath: Array<string>;
  };

export type MethodPointer<
  T extends Model = Model,
  Parameter extends Model | null = Model | null,
> = Node<"methodPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    methodPath: Array<string>;
    argument: Parameter extends Model ? Field<Parameter> : never;
  };

export type ActionPointer<Parameter extends Model | null = Model | null> = Node<"actionPointer"> & {
  actionPath: Array<string>;
  argument: Parameter extends Model ? Field<Parameter> : never;
};

export type Exception = Node<"exception"> & {
  condition: Field<Model<"Boolean">>;
  steps?: Array<ActionPointer | Exception | StreamPointer>;
};

export type StreamPointer<Event extends Model = Model> = Node<"streamPointer"> &
  Modeled<Event> & {
    streamName: string;
  };

export type View<Name extends string = string> = Node<"view"> &
  Called<Name> & {
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
    renders: Component;
  };

export type Component = Node<"component"> & {
  renders: Feature | Landscape;
};

export type Feature = Node<"feature"> & {
  tagName: string;
  properties: Record<string, Field>;
  reactions: Record<`on${string}`, Action>;
};

export type Landscape<T extends View = View> = Node<"landscape"> & {
  viewName: T["name"];
  properties: {
    [Key in keyof T["fields"]]?: Properties<T["fields"][Key]>;
  };
  reactions: {
    [Key in keyof T["streams"]]?: T["streams"][Key] extends Stream<infer Event>
      ? Action<Event>
      : never;
  };
};

export type Properties<T extends Field> = T["channel"] extends Binding<infer State>
  ? WritableField<State>
  : T["channel"] extends Slot<infer State>
  ? Field<State>
  : never;

export type Stream<Event extends Model = Model> = Node<"stream"> & Modeled<Event>;

export type Binding<T extends Model> = Node<"binding"> & Modeled<T>;

export type WritableField<T extends Model> = Node<"field"> &
  Modeled<T> & {
    channel: Field<T>["channel"] | Binding<T> | Store<T>;
  };

export type Store<T extends Model> = Node<"store"> &
  Modeled<T> & {
    value: Value<T>;
  };

export type Value<T extends Model = Model> = T["name"] extends "Array"
  ? Array<Field>
  : T["name"] extends "Boolean"
  ? boolean
  : T["name"] extends "Number"
  ? number
  : T["name"] extends "String"
  ? string
  : T["name"] extends "Component"
  ? Component
  : Array<Field> | boolean | number | string | Component | Structure<T>;

export type Structure<T extends Model = Model> = Node<"structure"> &
  Modeled<T> & {
    properties: {
      [Key in keyof T["members"]]?: T["members"][Key] extends Field
        ? Properties<T["members"][Key]>
        : never;
    };
  };
