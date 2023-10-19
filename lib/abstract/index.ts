import type { Node } from "./helpers";

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  members: Record<string, Model | View>;
  renders: Renderable;
};

export type Model<Name extends string = string> = Node<"model"> & {
  name: Name;
  members: Record<string, Field | Method | Action<Model<Name>>>;
};

// null == unknown/any model
// undefined == no model

export type Modeled<T extends Model | null = null> = {
  modelName: T extends Model<infer Name> ? Name : never;
};

export type Field<T extends Model | null = null> = Node<"field"> &
  Modeled<T> & {
    publisher: Store<T> | Option<T> | FieldPointer<T> | MethodPointer<T>;
  };

export type Store<T extends Model | null = null> = Node<"store"> & {
  value?: Value<T>;
};

export type Value<T extends Model | null = null> = T extends null
  ? unknown
  : T extends Model<infer Name>
  ? Name extends "Boolean"
    ? boolean
    : Name extends "Number"
    ? number
    : Name extends "String"
    ? string
    : Name extends "Renderable"
    ? Renderable
    : Name extends "Array"
    ? Array<Field>
    : Name extends `Array of ${infer InnerModelName}`
    ? Array<Field<Model<InnerModelName>>>
    : Structure<Model>
  : never;

export type Structure<T extends Model | null = null> = Node<"structure"> &
  Modeled<T> & {
    data: T extends Model
      ? {
          [Key in keyof T["members"]]?: T["members"][Key] extends Field
            ? T["members"][Key]
            : never;
        }
      : Record<string, Field>;
  };

export type Option<T extends Model | null = null> = Node<"option"> &
  Modeled<T> & {
    condition: Field<Model<"Boolean">>;
    result: Field<T>;
    opposite: Field<T>;
  };

export type FieldPointer<T extends Model | null = null> = Node<"fieldPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    fieldPath: Array<string>;
  };

export type MethodPointer<
  T extends Model | null = null,
  Param extends Model | null | undefined = null | undefined,
> = Node<"methodPointer"> &
  Modeled<T> & {
    leader?: MethodPointer;
    methodPath: Array<string>;
    argument: Param extends Model | null ? Field<Param> : never;
  };

export type Method<
  T extends Model | null = null,
  Param extends Model | null | undefined = null | undefined,
  Base extends Model | undefined = undefined,
> = Node<"method"> &
  Modeled<T> & {
    parameter?: Param extends Model ? Modeled<Param> : never;
    result:
      | Field<T>
      | ((
          base: Base extends Model ? Value<Base> : never,
          argument: Param extends Model | null ? Value<Param> : never
        ) => Value);
  };

export type Action<
  Base extends Model | null = Model | null,
  Input extends Model | null | undefined = Model | null | undefined,
> = Node<"action"> & {
  handler: AtomicAction<Base, Input> | OrganicAction<Input>;
};

export type AtomicAction<
  Base extends Model | null = Model | null,
  Input extends Model | null | undefined = null | undefined,
> = Node<"atomicAction"> & {
  parameter?: Input extends Model | null ? Modeled<Input> : never;
  effect: (
    base: Value<Base>,
    argument?: Input extends Model | null ? Value<Input> : never
  ) => Value<Base> | void;
};

export type OrganicAction<
  Input extends Model | null | undefined = Model | null | undefined,
> = Node<"organicAction"> & {
  parameter: Input extends Model ? Modeled<Input> : never;
  effect: ActionSteps;
};

export type ActionPointer<Input extends Model | null = null> =
  Node<"actionPointer"> & {
    actionPath: Array<string>;
    argument?: Field<Input>;
  };

export type ActionSteps = Array<ActionPointer | Exception | StreamPointer>;

export type Exception = Node<"exception"> & {
  condition: Field<Model<"Boolean">>;
  steps?: ActionSteps;
};

export type StreamPointer<
  Input extends Model | null | undefined = null | undefined,
> = Node<"streamPointer"> &
  (Input extends Model | null ? Modeled<Input> : never) & {
    streamName: string;
  };

export type Stream<Input extends Model | null | undefined = null | undefined> =
  Node<"stream"> & (Input extends Model | null ? Modeled<Input> : never);

export type View<Name extends string = string> = Node<"view"> & {
  name: Name;
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
    [Key in keyof T["members"]]?: T["members"][Key] extends Stream<infer Input>
      ? Action<Input>
      : T["members"][Key];
  };
};
