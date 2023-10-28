import type { Node, Called, Name } from "./helpers";

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  members: Record<string, Model | View>;
  renders: Component;
};

export type Model<Name extends string = string> = Node<"model"> &
  Called<Name> & {
    members: Record<string, Field | Method | Action>;
  };

export type Modeled<T extends Model | null> = {
  modelName: T extends Model ? Name<T> : never;
};

export type Field<T extends Model | null = Model | null> = ImmutableField<T> | MutableField<T>;

export type ImmutableField<T extends Model | null> = BaseField<T> & {
  source: Slot<T> | Option<T> | FieldPointer<T> | MethodPointer<T>;
};

export type MutableField<T extends Model | null> = BaseField<T> & {
  source: MutableSlot<T> | Store<T>;
};

export type BaseField<T extends Model | null> = Node<"field"> & Modeled<T>;

export type Slot<T extends Model | null> = Node<"slot"> & Modeled<T>;

export type MutableSlot<T extends Model | null> = Slot<T> & {
  mutable: true;
};

export type Store<T extends Model | null> = Node<"store"> & {
  value: Value<T>;
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

export type Structure<T extends Model | null = Model | null> = Node<"structure"> &
  Modeled<T> & {
    data: T extends Model
      ? {
          [Key in keyof T["members"]]?: T["members"][Key] extends Field ? T["members"][Key] : never;
        }
      : Record<string, Field>;
  };

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
  Parameter extends Model | null = Model | null,
> = Node<"methodPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    methodPath: Array<string>;
    argument: Parameter extends Model ? Field<Parameter> : never;
  };

export type Method<
  T extends Model | null = Model | null,
  Parameter extends Model | null = Model | null,
> = Node<"method"> &
  Modeled<T> &
  (
    | {
        handler: (argument: Value<Parameter>) => Value<T>;
      }
    | {
        parameter: Parameter extends Model ? Called & Field<Parameter> : never;
        result: Field<T>;
      }
  );

export type Action<Parameter extends Model | null = Model | null> = Node<"action"> &
  (
    | {
        handler: (argument: Value<Parameter>) => void;
      }
    | {
        parameter: Parameter extends Model ? Called & Field<Parameter> : never;
        steps: Array<ActionPointer | Exception | StreamPointer>;
      }
  );

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

export type Stream<Event extends Model = Model> = Node<"stream"> & Modeled<Event>;

export type View<Name extends string = string> = Node<"view"> &
  Called<Name> & {
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
    renders: Component;
  };

export type Component = Node<"component"> & {
  renders: Element | Landscape;
};

export type Element = Node<"element"> & {
  tagName: string;
  fieldProps: Record<string, Field>;
  actionProps: Record<`on${string}`, Action>;
};

export type Landscape<T extends View = View> = Node<"landscape"> & {
  viewName: Name<T>;
  fieldProps: {
    [Key in keyof T["fields"]]?: T["fields"][Key]["source"] extends Slot<infer State>
      ? ImmutableField<State>
      : T["fields"][Key]["source"] extends MutableSlot<infer State>
      ? MutableField<State>
      : never;
  };
  actionProps: {
    [Key in keyof T["streams"]]?: T["streams"][Key] extends Stream<infer Event>
      ? Action<Event>
      : never;
  };
};
