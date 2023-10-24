import type { Node, Called, Name } from "./helpers";

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  members: Record<string, Model | View>;
  renders: Renderable;
};

export type Model<Name extends string = string> = Node<"model"> &
  Called<Name> & {
    members: Record<string, Field | Method | Action>;
  };

export type Modeled<T extends Model | null> = {
  modelName: T extends Model ? Name<T> : never;
};

export type Field<T extends Model = Model> = Node<"field"> &
  Modeled<T> & {
    publisher?: Store<T> | Option<T> | FieldPointer<T> | MethodPointer<T>;
  };

export type Store<T extends Model> = Node<"store"> & {
  value: Value<T>;
};

export type Value<T extends Model | null = Model | null> = T extends Model
  ? Name<T> extends "Boolean"
    ? boolean
    : Name<T> extends "Number"
    ? number
    : Name<T> extends "String"
    ? string
    : Name<T> extends "Renderable"
    ? Renderable
    : Name<T> extends "Array"
    ? Array<Field>
    : Name<T> extends `Array of ${infer InnerModelName}`
    ? Array<Field<Model<InnerModelName>>>
    : Structure<Model>
  : boolean | number | string | Renderable | Array<Field> | Structure;

export type Structure<T extends Model | null = Model | null> =
  Node<"structure"> &
    Modeled<T> & {
      data: T extends Model
        ? {
            [Key in keyof T["members"]]?: T["members"][Key] extends Field
              ? T["members"][Key]
              : never;
          }
        : Record<string, Field>;
    };

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
  Param extends Model | null = Model | null,
> = Node<"methodPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    methodPath: Array<string>;
    argument: Param extends Model ? Field<Param> : never;
  };

export type Method<
  T extends Model = Model,
  Param extends Model | null = Model | null,
> = Node<"method"> &
  Modeled<T> &
  (
    | {
        delegate: (arg: Value<Param>) => Value<T>;
      }
    | {
        parameter: Param extends Model ? Called & Field<Param> : never;
        result: Field<T>;
      }
  );

export type Action<Param extends Model | null = Model | null> = Node<"action"> &
  (
    | {
        delegate: (arg: Value<Param>) => void;
      }
    | {
        parameter: Param extends Model ? Called & Field<Param> : never;
        steps: Array<ActionPointer | Exception | StreamPointer>;
      }
  );

export type ActionPointer<Param extends Model | null = Model | null> =
  Node<"actionPointer"> & {
    actionPath: Array<string>;
    argument: Param extends Model ? Field<Param> : never;
  };

export type Exception = Node<"exception"> & {
  condition: Field<Model<"Boolean">>;
  steps?: Array<ActionPointer | Exception | StreamPointer>;
};

export type StreamPointer<Event extends Model = Model> = Node<"streamPointer"> &
  Modeled<Event> & {
    streamName: string;
  };

export type Stream<Event extends Model = Model> = Node<"stream"> &
  Modeled<Event>;

export type View<Name extends string = string> = Node<"view"> &
  Called<Name> & {
    renders: Renderable;
    fields: Record<string, Field>;
    streams: Record<`on${string}`, Stream>;
  };

export type Renderable = Node<"renderable"> & {
  body: Atom | Organism;
};

export type Atom = Node<"atom"> & {
  tagName: string;
  properties: Record<string, Field>;
  handlers: Record<`on${string}`, Action>;
};

export type Organism<T extends View = View> = Node<"organism"> & {
  viewName: Name<T>;
  properties: {
    [Key in keyof T["fields"]]: T["fields"][Key]["publisher"] extends undefined
      ? T["fields"][Key]
      : never;
  };
  handlers: {
    [Key in keyof T["streams"]]?: T["streams"][Key] extends Stream<infer Event>
      ? Action<Event>
      : never;
  };
};
