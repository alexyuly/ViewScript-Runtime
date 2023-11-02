export type Node<Kind extends string> = {
  kind: Kind;
};

export type Called<Name extends string = string> = {
  name: Name;
};

export type Name<T extends Called> = T["name"];

export type Model<Name extends string = string> = Node<"model"> &
  Called<Name> & {
    members: Record<string, Field | Method | Action>;
  };

export type Stream<Event extends Model = Model> = Node<"stream"> & Modeled<Event>;

export type Field<T extends Model | null = Model | null> = ImmutableField<T> | MutableField<T>;

export type Method<
  T extends Model | null = Model | null,
  Parameter extends Model | null = Model | null,
> = Node<"method"> &
  Modeled<T> &
  (
    | {
        handle: (argument: Value<Parameter>) => Value<T>;
      }
    | {
        parameter: Parameter extends Model ? Called & Field<Parameter> : never;
        result: Field<T>;
      }
  );

export type Action<Parameter extends Model | null = Model | null> = Node<"action"> &
  (
    | {
        handle: (argument: Value<Parameter>) => void;
      }
    | {
        parameter: Parameter extends Model ? Called & Field<Parameter> : never;
        steps: Array<ActionPointer | Exception | StreamPointer>;
      }
  );

export type ImmutableField<T extends Model | null> = Node<"field"> &
  Modeled<T> & {
    channel: Slot<T> | Option<T> | FieldPointer<T> | MethodPointer<T>;
  };

export type MutableField<T extends Model | null> = Node<"field"> &
  Modeled<T> & {
    channel: MutableSlot<T> | Store<T>;
  };

export type Modeled<T extends Model | null> = {
  modelName: T extends Model ? Name<T> : never;
};

export type Value<T extends Model | null = Model | null> = T extends Model
  ? Name<T> extends "Boolean"
    ? boolean
    : Name<T> extends "Number"
    ? number
    : Name<T> extends "String"
    ? string
    : Name<T> extends "Component"
    ? Component
    : Name<T> extends "Array"
    ? Array<Field>
    : Structure<Model>
  : boolean | number | string | Component | Array<Field> | Structure;

export type ActionPointer<Parameter extends Model = Model> = Node<"actionPointer"> & {
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

export type Slot<T extends Model | null> = Node<"slot"> & Modeled<T>;

export type Option<T extends Model | null> = Node<"option"> &
  Modeled<T> & {
    condition: Field<Model<"Boolean">>;
    result: Field<T>;
    opposite: Field<T>;
  };

export type FieldPointer<T extends Model | null> = Node<"fieldPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    fieldPath: Array<string>;
  };

export type MethodPointer<
  T extends Model | null = Model | null,
  Parameter extends Model = Model,
> = Node<"methodPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    methodPath: Array<string>;
    argument: Parameter extends Model ? Field<Parameter> : never;
  };

export type MutableSlot<T extends Model | null> = Node<"mutableSlot"> & Modeled<T>;

export type Store<T extends Model | null> = Node<"store"> &
  Modeled<T> & {
    value: Value<T>;
  };

export type Component = Node<"component"> & {
  renders: Feature | Landscape;
};

export type Structure<T extends Model = Model> = Node<"structure"> &
  Modeled<T> & {
    properties: {
      [Key in keyof T["members"]]?: T["members"][Key] extends Field
        ? Properties<T["members"][Key]>
        : never;
    };
  };

export type Feature = Node<"feature"> & {
  tagName: string;
  properties: Record<string, Field>;
  reactions: Record<`on${string}`, Action>;
};

export type Landscape<T extends View = View> = Node<"landscape"> & {
  viewName: Name<T>;
  properties: {
    [Key in keyof T["fields"]]?: Properties<T["fields"][Key]>;
  };
  reactions: {
    [Key in keyof T["streams"]]?: T["streams"][Key] extends Stream<infer Event>
      ? Action<Event>
      : never;
  };
};

export type Properties<T extends Field> = T["channel"] extends Slot<infer State>
  ? ImmutableField<State>
  : T["channel"] extends MutableSlot<infer State>
  ? MutableField<State>
  : never;

export type View<Name extends string = string> = Node<"view"> &
  Called<Name> & {
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
    renders: Component;
  };

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  members: Record<string, Model | View>;
  renders: Component;
};
