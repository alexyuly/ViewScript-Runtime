export {
  Action,
  ActionHandler,
  ActionRef,
  BooleanModel,
  Dispatch,
  Field,
  FieldRef,
  Let,
  Model,
  Nothing,
  StringModel,
  Take,
};

type Node<N extends string> = {
  name: N;
};

type NodeOfKind<N extends string, Kind extends string> = Node<N> & {
  kind: Kind;
};

type Model<
  Kind extends string = string,
  Properties extends ModelProperties = ModelProperties,
> = NodeOfKind<"Model", Kind> & {
  properties: Properties;
};

type ModelProperties = {
  [K in string]: Action<Model> | Field<Model>;
};

type ModelReference<M extends Model> = NodeOfKind<"ModelReference", M["kind"]>;

type Action<Input extends Model> = Node<"Action"> & {
  actionInput: ModelReference<Input>;
};

type Dispatch<A extends Action<Model>> = Node<"Dispatch"> & {
  action: A;
};

type ActionHandler<
  Input extends Model,
  Handler extends Array<Dispatch<Action<Model>>> = Array<
    Dispatch<Action<Model>>
  >,
> = Action<Input> & {
  handler: Handler;
};

// TODO methods (should include fields + so-called "generators")
// type Method

type Take<M extends Model> = Node<"Take"> & {
  methodInput: ModelReference<Nothing>;
  methodOutput: ModelReference<M>;
};

type Let<M extends Model, D extends DataType<M> | void = void> = Node<"Let"> & {
  methodInput: ModelReference<Nothing>;
  methodOutput: ModelReference<M>;
  value: D extends void ? never : D;
};

type Field<M extends Model> = Take<M> | Let<M> | Let<M, DataType<M>>;

type DataType<M extends Model> = M extends BooleanModel
  ? boolean
  : M extends StringModel
  ? string
  : never;

type ActionKeys<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Action<Model>
    ? K
    : never;
}[keyof M["properties"]];

type ActionRef<
  M extends Model,
  K extends ActionKeys<M>,
> = M["properties"][K] extends Action<Model> ? M["properties"][K] : never;

type FieldKeys<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Field<Model>
    ? K
    : never;
}[keyof M["properties"]];

type FieldRef<
  M extends Model,
  K extends FieldKeys<M>,
> = M["properties"][K] extends Field<infer N extends Model> ? N : never;

type Nothing = Model<"Nothing">;

type Primitive = Model<"Primitive">;

type BooleanModel = Model<
  "BooleanModel",
  {
    value: Field<Primitive>;
    enable: Action<Model>;
  }
>;

type StringModel = Model<
  "StringModel",
  {
    value: Field<Primitive>;
  }
>;
