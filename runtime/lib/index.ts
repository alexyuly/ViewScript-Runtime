export {
  Action,
  BooleanModel,
  Dispatch,
  Field,
  Let,
  Model,
  Nothing,
  StringModel,
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
> = NodeOfKind<"Model", Kind> & Properties;

type ModelChild<
  M extends Model,
  F extends keyof M["properties"],
> = M["properties"][F] extends Field
  ? M["properties"][F]["type"] extends ModelReference<infer R extends Model>
    ? R
    : never
  : never;

type ModelProperties = {
  properties: Record<string, Action | Method>;
};

type ModelReference<M extends Model> = NodeOfKind<"ModelReference", M["kind"]>;

type Nothing = Model<"Nothing">;

type Optional<M extends Model> = M | Nothing;

type Action<
  Input extends Optional<Model> = Optional<Model>,
  Handler extends Array<Dispatch> = [],
> = Node<"Action"> & {
  input: ModelReference<Input>;
};

type Method<
  Input extends Optional<Model> = Optional<Model>,
  Output extends Model = Model,
> = Node<"Method"> & {
  input: ModelReference<Input>;
  output: ModelReference<Output>;
};

type Take<M extends Model> = Node<"Take"> & {
  type: ModelReference<M>;
};

type Field<M extends Model = Model> = Take<M> & Method<Nothing, M>;

type Let<M extends Model, D extends DataType<M> | void = void> = Node<"Let"> &
  Field<M> & {
    value: D extends void ? never : D;
  };

type DataType<M extends Model> = M extends BooleanModel
  ? boolean
  : M extends StringModel
  ? string
  : never;

type FieldKey<M extends Model = Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Field ? K : never;
}[keyof M["properties"]];

type ActionKey<M extends Model = Model, F extends FieldKey<M> = FieldKey<M>> = {
  [K in keyof ModelChild<M, F>["properties"]]: ModelChild<
    M,
    F
  >["properties"][K] extends Action
    ? K
    : never;
}[keyof ModelChild<M, F>["properties"]];

type Dispatch<
  M extends Model = Model,
  F extends FieldKey<M> = FieldKey<M>,
  A extends ActionKey<M, F> = ActionKey<M, F>,
> = Node<"Dispatch"> & {
  scope: ModelReference<M>;
  fieldKey: F;
  actionKey: A;
};

type BooleanModel = Model<
  "BooleanModel",
  {
    properties: {
      enable: Action;
    };
  }
>;

type StringModel = Model<"StringModel">;
