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
  Methods extends ModelMethods = ModelMethods,
  Actions extends ModelActions = ModelActions,
> = NodeOfKind<"Model", Kind> & Methods & Actions;

type ModelActions = {
  actions: Record<string, Action>;
};

type ModelMethods = {
  methods: Record<string, Method>;
};

type ModelReference<M extends Model> = NodeOfKind<"ModelReference", M["kind"]>;

type Nothing = Model<"Nothing">;

type Action<Input extends Model | Nothing = Model | Nothing> =
  Node<"Action"> & {
    input: ModelReference<Input>;
  };

type ActionHandled<
  Input extends Model | Nothing = Model | Nothing,
  Handler extends Array<Dispatch> = Array<Dispatch>,
> = Action<Input> & {
  handler: Handler;
};

type Method<
  Input extends Model | Nothing = Model | Nothing,
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
  [K in keyof M["methods"]]: M["methods"][K] extends Field ? K : never;
}[keyof M["methods"]];

type ActionKey<M extends Model = Model, F extends FieldKey<M> = FieldKey<M>> = {
  [K in keyof ModelChild<M, F>["actions"]]: ModelChild<
    M,
    F
  >["actions"][K] extends Action
    ? K
    : never;
}[keyof ModelChild<M, F>["actions"]];

type ModelChild<
  M extends Model,
  F extends keyof M["methods"],
> = M["methods"][F] extends Field
  ? M["methods"][F]["type"] extends ModelReference<infer R extends Model>
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
    methods: {
      value: Method;
    };
  },
  {
    actions: {
      enable: Action;
    };
  }
>;

type StringModel = Model<"StringModel">;
