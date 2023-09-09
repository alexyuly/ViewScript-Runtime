export {
  Action,
  BooleanModel,
  Dispatch,
  Generate,
  Let,
  Many,
  Model,
  NumberModel,
  StringModel,
  Take,
};

type Action<
  Parameter extends Model | null,
  H extends Handler,
> = Node<"Action"> & {
  parameter: Reference<Parameter>;
  handler: H;
};

type ActionKey<M extends Model = Model, F extends FieldKey<M> = FieldKey<M>> = {
  [K in keyof ModelChild<M, F>["properties"]]: ModelChild<
    M,
    F
  >["properties"][K] extends UnknownAction
    ? K
    : never;
}[keyof ModelChild<M, F>["properties"]];

type BooleanModel = PrimitiveModel<
  "BooleanModel",
  {
    enable: PrimitiveAction<BooleanModel>;
  }
>;

// TODO pass in Expression<BooleanModel> after making Expression generic
// type Catch

type ComplexDataType<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Field
    ? DataType<
        M["properties"][K]["type"] extends Reference<infer R extends Model>
          ? R
          : never
      >
    : M["properties"][K] extends Let<infer L extends Model>
    ? DataType<L>
    : never;
};

type DataType<M extends Model> = M extends BooleanModel
  ? boolean
  : M extends NumberModel
  ? number
  : M extends StringModel
  ? string
  : M extends Many<infer A extends Model>
  ? Array<A>
  : M extends Model
  ? ComplexDataType<M>
  : never;

type Dispatch<
  M extends Model,
  F extends FieldKey<M>,
  A extends ActionKey<M, F>,
> = Node<"Dispatch"> & {
  scope: Reference<M>;
  fieldKey: F;
  actionKey: A;
};

// TODO make generic
type Expression = Node<"Expression"> & {
  outlet: Generate<Model, FieldKey, MethodKey> | ValueOf<Model, FieldKey>;
};

type Field<M extends Model = Model> = {
  type: Reference<M>;
};

type FieldKey<M extends Model = Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Field ? K : never;
}[keyof M["properties"]];

type Generate<
  M extends Model,
  F extends FieldKey<M>,
  MK extends MethodKey<M, F>,
> = Node<"Generate"> & {
  scope: Reference<M>;
  fieldKey: F;
  methodKey: MK;
};

type Handler = Array<Dispatch<Model, FieldKey, ActionKey>>;

type Let<M extends Model, D extends DataType<M> | void = void> = Node<"Let"> &
  Field<M> & {
    value: D extends void ? never : D;
  };

type Many<M extends Model> = PrimitiveModel<
  "Many",
  {
    length: PrimitiveMethod<null, NumberModel>;
    push: PrimitiveAction<M>;
  }
> & {
  model: Reference<M>;
};

type Method<
  Parameter extends Model | null,
  Return extends Model,
  X extends Expression,
> = Node<"Method"> & {
  parameter: Reference<Parameter>;
  return: Reference<Return>;
  expression: X;
};

type MethodKey<M extends Model = Model, F extends FieldKey<M> = FieldKey<M>> = {
  [K in keyof ModelChild<M, F>["properties"]]: ModelChild<
    M,
    F
  >["properties"][K] extends UnknownMethod
    ? K
    : never;
}[keyof ModelChild<M, F>["properties"]];

type Model<
  Kind extends string = string,
  Properties extends ModelProperties = {},
> = NodeOfKind<"Model", Kind> & {
  properties: Properties;
};

type ModelChild<
  M extends Model,
  F extends keyof M["properties"],
> = M["properties"][F] extends Field
  ? M["properties"][F]["type"] extends Reference<infer R extends Model>
    ? R
    : never
  : never;

type ModelProperties = Record<string, Field | UnknownAction | UnknownMethod>;

type Node<N extends string> = {
  name: N;
};

type NodeOfKind<N extends string, Kind extends string> = Node<N> & {
  kind: Kind;
};

type NumberModel = PrimitiveModel<"NumberModel">;

type PrimitiveAction<Parameter extends PrimitiveModel | null> = Action<
  Parameter,
  never
>;

type PrimitiveMethod<
  Parameter extends PrimitiveModel | null,
  Return extends PrimitiveModel,
> = Method<Parameter, Return, never>;

type PrimitiveModel<
  Kind extends string = string,
  Properties extends PrimitiveModelProperties = {},
> = Model<Kind, Properties> & {
  properties: Properties;
};

type PrimitiveModelProperties = Record<
  string,
  | PrimitiveAction<PrimitiveModel | null>
  | PrimitiveMethod<PrimitiveModel | null, Model>
>;

type Reference<M extends Model | null> = M extends Model
  ? Pick<M, "name" | "kind">
  : M;

type StringModel = PrimitiveModel<"StringModel">;

type Take<M extends Model> = Node<"Take"> & Field<M>;

type UnknownAction = Action<Model | null, Handler>;

type UnknownMethod = Method<Model | null, Model, Expression>;

type ValueOf<M extends Model, F extends FieldKey<M>> = Node<"ValueOf"> & {
  scope: Reference<M>;
  fieldKey: F;
};
