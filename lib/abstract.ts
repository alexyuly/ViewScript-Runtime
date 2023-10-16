/* Nodes */

export type Node<Kind extends string> = {
  kind: Kind;
};

export type Named<Name extends string = string> = {
  name: Name;
};

export type Modeled<T extends Model> = {
  modelName?: T["name"];
};

/** Values */

export type Value<T extends Model> = T["name"] extends "Boolean"
  ? boolean
  : T["name"] extends "Number"
  ? number
  : T["name"] extends "String"
  ? string
  : T["name"] extends "Element"
  ? Element
  : T["name"] extends "Array"
  ? Array<Field>
  : T["name"] extends `Array of ${infer InnerModelName}`
  ? Array<Field<Model<InnerModelName>>>
  : Structure<Model>;

export type Structure<T extends Model> = Node<"structure"> &
  Modeled<T> & {
    data: StructuredData<T>;
  };

export type StructuredData<T extends Model> = {
  [Key in keyof T["members"]]: T["members"][Key] extends Field
    ? T["members"][Key]
    : never;
};

export interface Element extends Node<"element"> {
  properties: Record<string, EventHandler | Field>;
}

export interface Atom extends Element {
  tagName: string;
}

export interface Molecule<T extends View> extends Element {
  viewName: T["name"];
  properties: {
    [Key in keyof T["terrain"]]: T["terrain"][Key] extends Stream<
      infer FieldModel
    >
      ? EventHandler<FieldModel>
      : T["terrain"][Key] extends PublicField<infer FieldModel>
      ? Field<FieldModel>
      : never;
  };
}

/* Fields */

export type Field<T extends Model = Model> = Node<"field"> &
  Modeled<T> & {
    publisher: Value<T> | FieldPointer<T> | MethodPointer<T> | Condition<T>;
  };

export type NamedField<T extends Model = Model> = Field<T> & Named;

export type PublicField<T extends Model> = NamedField<T> & {
  public: true;
};

/** Methods */

export type Method<T extends Model, Parameter extends Model> = Node<"method"> &
  Modeled<T> & {
    parameter?: NamedField<Parameter>;
    result: Field<T>;
  };

export type NamedMethod<
  T extends Model = Model,
  Parameter extends Model = Model,
> = Method<T, Parameter> & Named;

/** Pointers */

export type FieldPointer<T extends Model> = Node<"fieldPointer"> &
  Modeled<T> & {
    pathToField: Array<string>;
  };

export type MethodPointer<
  T extends Model,
  Parameter extends Model = Model,
> = Node<"methodPointer"> &
  Modeled<T> & {
    pathToMethod: Array<string>;
    argument?: Field<Parameter>;
    chainedResult?: FieldPointer<T> | MethodPointer<T>;
  };

export type Condition<T extends Model> = Node<"condition"> &
  Modeled<T> & {
    yieldIf: Field<Model<"Boolean">>;
    resultOfYield: Field<T>;
    resultOtherwise?: Field<T>;
  };

/* Events */

export type EventHandler<Event extends Model = Model> =
  | Action<Event>
  | ActionStep;

export type Action<Event extends Model> = Node<"action"> & {
  parameter?: NamedField<Event>;
  steps: Array<ActionStep>;
};

export type NamedAction<Event extends Model = Model> = Action<Event> & Named;

export type ActionStep = ActionPointer | StreamPointer | Fork;

export type ActionPointer<Event extends Model = Model> =
  Node<"actionPointer"> & {
    pathToAction: Array<string>;
    argument?: Field<Event>;
  };

export type StreamPointer<Event extends Model = Model> = Node<"streamPointer"> &
  Modeled<Event> & {
    streamName: string;
  };

export type Stream<Event extends Model = Model> = Node<"stream"> &
  Named &
  Modeled<Event>;

export type Fork = Node<"fork"> & {
  breakIf: Field<Model<"Boolean">>;
  stepsBeforeBreak?: Array<ActionStep>;
};

/* Views */

export type View<Name extends string = string> = Node<"view"> &
  Named<Name> & {
    element: Element;
    terrain: Record<string, Stream | NamedField>;
  };

/* Models */

export type Model<Name extends string = string> = Node<"model"> &
  Named<Name> & {
    members: Record<string, NamedField | NamedMethod | NamedAction>;
  };

/* Apps */

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  root: View;
  branches: Record<string, View | Model>;
};
