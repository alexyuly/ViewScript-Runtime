export {
  BooleanModel,
  Dispatch,
  Let,
  Model,
  OfAction,
  OfField,
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

type Dispatch<A extends Action<Model>> = A & {
  dispatch: true;
};

// TODO a sequence of dispatch calls (and catches, too):
// type Chain

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

type Field<
  M extends Model,
  D extends DataType<M> | void = DataType<M> | void,
> = D extends DataType<M> ? Let<M, DataType<M>> : Take<M> | Let<M>;

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

type OfAction<
  M extends Model,
  K extends ActionKeys<M>,
> = M["properties"][K] extends Action<Model> ? M["properties"][K] : never;

type FieldKeys<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Field<Model>
    ? K
    : never;
}[keyof M["properties"]];

type OfField<
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
