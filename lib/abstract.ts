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
  : T["name"] extends "Renderable"
  ? Renderable
  : T["name"] extends "Array"
  ? Array<Field>
  : T["name"] extends `Array of ${infer InnerModelName}`
  ? Array<Field<Model<InnerModelName>>>
  : Structure<Model>;

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

export type Structure<T extends Model> = Node<"structure"> &
  Modeled<T> & {
    data: {
      [Key in keyof T["members"]]?: T["members"][Key] extends Field
        ? T["members"][Key]
        : never;
    };
  };

export type Field<T extends Model = Model> = Node<"field"> &
  Modeled<T> & {
    publisher?: Value<T> | FieldPointer<T> | MethodPointer<T> | Option<T>;
  };

export type NamedField<T extends Model = Model> = Named & Field<T>;

export type Method<
  T extends Model = Model,
  Parameter extends Model = Model,
> = Node<"method"> &
  Modeled<T> & {
    parameter?: NamedField<Parameter>;
    result: Field<T>;
  };

export type FieldPointer<T extends Model> = Node<"fieldPointer"> &
  Modeled<T> & {
    leader?: FieldPointer<T> | MethodPointer<T>;
    fieldPath: Array<string>;
  };

export type MethodPointer<
  T extends Model,
  Parameter extends Model = Model,
> = Node<"methodPointer"> &
  Modeled<T> & {
    leader?: FieldPointer<T> | MethodPointer<T>;
    methodPath: Array<string>;
    argument?: Field<Parameter>;
  };

export type Option<T extends Model> = Node<"option"> &
  Modeled<T> & {
    condition: Field<Model<"Boolean">>;
    result: Field<T>;
    opposite: Field<T>;
  };

export type Action<Event extends Model = Model> = Node<"action"> & {
  parameter?: NamedField<Event>;
  steps: Array<ActionPointer | StreamPointer | Exception>;
};

export type Stream<Event extends Model = Model> = Node<"stream"> &
  Named &
  Modeled<Event>;

export type ActionPointer<Event extends Model = Model> =
  Node<"actionPointer"> & {
    actionPath: Array<string>;
    argument?: Field<Event>;
  };

export type StreamPointer<Event extends Model = Model> = Node<"streamPointer"> &
  Modeled<Event> & {
    streamName: string;
  };

export type Exception = Node<"exception"> & {
  condition: Field<Model<"Boolean">>;
  steps?: Array<ActionPointer | StreamPointer | Exception>;
};

export type View<Name extends string = string> = Node<"view"> &
  Named<Name> & {
    renders: Renderable;
    members: Record<string, Stream | NamedField>;
  };

export type Model<Name extends string = string> = Node<"model"> &
  Named<Name> & {
    members: Record<string, NamedField | (Named & Method) | (Named & Action)>;
  };

export type App = Node<"app"> & {
  version: "ViewScript v0.4.0";
  renders: Renderable;
  members: Record<string, View | Model>;
};
