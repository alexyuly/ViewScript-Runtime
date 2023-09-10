export {
  ActionHandled,
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
  Properties extends ModelProperties = ModelProperties, // TODO Fix circular reference
> = NodeOfKind<"Model", Kind> & {
  properties: Properties;
};

type ModelProperties = Record<string, Action | Method>; // TODO Fix circular reference

type ModelReference<M extends Model> = NodeOfKind<"ModelReference", M["kind"]>;

type Nothing = Model<"Nothing">;

type Action<Input extends Model = Model> = Node<"Action"> & {
  input: ModelReference<Input>;
};

type ActionHandled<
  Input extends Model,
  Handler extends Array<Dispatch> = Array<Dispatch>,
> = Action<Input> & {
  handler: Handler;
};

type Method<
  Input extends Model = Model,
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

type ModelChild<
  M extends Model,
  F extends keyof M["properties"],
> = M["properties"][F] extends Field
  ? M["properties"][F]["type"] extends ModelReference<infer R extends Model>
    ? R
    : never
  : never;

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
    value: Method;
    enable: Action;
  }
>;

type StringModel = Model<"StringModel">;
