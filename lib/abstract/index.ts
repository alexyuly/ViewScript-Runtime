import type { Node, Named } from "./helpers";

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  members: Record<string, Model | View>;
  renders: Renderable;
};

export type Model<Name extends string = string> = Node<"model"> &
  Named<Name> & {
    members: Record<string, Field | Method | Action>;
  };

export type Modeled<T extends Model | null> = {
  modelName: T extends Model ? T["name"] : never;
};

export type Field<T extends Model = Model> = Node<"field"> &
  Modeled<T> & {
    publisher?: Value<T> | Option<T> | FieldPointer<T> | MethodPointer<T>;
  };

export type Value<T extends Model | null = Model | null> = T extends Model
  ? T["name"] extends "Boolean"
    ? boolean
    : T["name"] extends "Number"
    ? number
    : T["name"] extends "String"
    ? string
    : T["name"] extends "Renderable"
    ? Renderable
    : T["name"] extends "Array"
    ? Array<Field>
    : T["name"] extends `Array of ${infer InnerModelName}`
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
  Parameter extends Model = Model,
> = Node<"methodPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    methodPath: Array<string>;
    argument?: Field<Parameter>;
  };

export type Method<
  T extends Model = Model,
  Parameter extends Model = Model,
> = Node<"method"> &
  Modeled<T> & {
    parameter?: Named & Field<Parameter>;
    result: Field<T>;
  };

export type Action<Parameter extends Model = Model> = Node<"action"> & {
  parameter?: Named & Field<Parameter>;
  steps: Array<ActionPointer | Exception | StreamPointer>;
};

export type ActionPointer<Parameter extends Model = Model> =
  Node<"actionPointer"> & {
    actionPath: Array<string>;
    argument?: Field<Parameter>;
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
  Named<Name> & {
    members: Record<string, Stream | Field>;
    renders: Renderable;
  };

export type Renderable = Node<"renderable"> & {
  body: Atom | Organism;
};

export type Atom = Node<"atom"> & {
  tagName: string;
  properties: Record<string, Action | Field>;
};

export type Organism<T extends View = View> = Node<"organism"> & {
  viewName: T["name"];
  properties: {
    [Key in keyof T["members"]]?: T["members"][Key] extends Stream<infer Event>
      ? Action<Event>
      : T["members"][Key];
  };
};
