export type Node<Kind extends string> = {
  kind: Kind;
};

export type Named<Name extends string = string> = {
  name: Name;
};

export type Modeled<T extends Model> = {
  modelName?: T["name"];
};

export type Value<T extends Model = Model> = T["name"] extends "Boolean"
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
    data: {
      [Key in keyof T["members"]]?: T["members"][Key] extends Field
        ? T["members"][Key]
        : never;
    };
  };

export type Element = Node<"element">;

export type Atom = Element & {
  tagName: string;
  properties: Record<string, EventHandler | Field>;
};

export type Molecule<T extends View> = Element & {
  viewName: T["name"];
  properties: {
    [Key in keyof T["terrain"]]?: T["terrain"][Key] extends Stream<
      infer FieldModel
    >
      ? EventHandler<FieldModel>
      : T["terrain"][Key];
  };
};

export type Field<T extends Model = Model> = Node<"field"> &
  Modeled<T> & {
    publisher?: Value<T> | FieldPointer<T> | MethodPointer<T> | Option<T>;
  };

export type NamedField<T extends Model = Model> = Field<T> & Named;

export type FieldPointer<T extends Model> = Node<"fieldPointer"> &
  Modeled<T> & {
    pathToField: Array<string>;
  };

export type Method<T extends Model, Parameter extends Model> = Node<"method"> &
  Modeled<T> & {
    parameter?: NamedField<Parameter>;
    result: Field<T>;
  };

export type NamedMethod<
  T extends Model = Model,
  Parameter extends Model = Model,
> = Method<T, Parameter> & Named;

export type MethodPointer<
  T extends Model,
  Parameter extends Model = Model,
> = Node<"methodPointer"> &
  Modeled<T> & {
    pathToMethod: Array<string>;
    argument?: Field<Parameter>;
    result?: FieldPointer<T> | MethodPointer<T>;
  };

export type Option<T extends Model> = Node<"option"> &
  Modeled<T> & {
    condition: Field<Model<"Boolean">>;
    result: Field<T>;
    resultOtherwise: Field<T>;
  };

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
  condition: Field<Model<"Boolean">>;
  steps?: Array<ActionStep>;
};

export type View<Name extends string = string> = Node<"view"> &
  Named<Name> & {
    element: Element;
    terrain: Record<string, Stream | NamedField>;
  };

export type Model<Name extends string = string> = Node<"model"> &
  Named<Name> & {
    members: Record<string, NamedField | NamedMethod | NamedAction>;
  };

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  root: View;
  branches: Record<string, View | Model>;
};
