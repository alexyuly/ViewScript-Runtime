export { BooleanModel, Dispatch, Let, Model, StringModel };

type Action<M extends Model | void = void> = (
  argument: M extends void ? never : M
) => void;

type BooleanModel = PrimitiveModel<
  "BooleanModel",
  {
    enable(): void;
  }
>;

type ComplexDataType<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Model
    ? DataType<M["properties"][K]>
    : M["properties"][K] extends Let<infer L extends Model>
    ? DataType<L>
    : never;
};

type DataType<M extends Model> = M extends BooleanModel
  ? boolean
  : M extends StringModel
  ? string
  : M extends Model
  ? ComplexDataType<M>
  : never;

type Dispatch<
  M extends Model,
  F extends {
    [K in keyof M["properties"]]: M["properties"][K] extends Field ? K : never;
  }[keyof M["properties"]],
  A extends {
    [K in keyof (M["properties"][F] extends Model
      ? M["properties"][F]["properties"]
      : M["properties"][F] extends Store
      ? M["properties"][F]["model"]["properties"]
      : never)]: (M["properties"][F] extends Model
      ? M["properties"][F]["properties"]
      : M["properties"][F] extends Store
      ? M["properties"][F]["model"]["properties"]
      : never)[K] extends Action
      ? K
      : never;
  }[keyof (M["properties"][F] extends Model
    ? M["properties"][F]["properties"]
    : M["properties"][F] extends Store
    ? M["properties"][F]["model"]["properties"]
    : never)],
> = Node<"Dispatch"> & {
  scope: Reference<M>;
  model: F;
  action: A;
};

type Field = Model | Store;

type Let<M extends Model, D extends DataType<M> | void = void> = Node<"Let"> & {
  model: M;
  value: D extends void ? never : D;
};

type Model<
  K extends string = string,
  P extends Record<string, Action | Field> = {},
> = NodeOfKind<"Model", K> & {
  properties: P;
};

type Node<N extends string> = {
  name: N;
};

type NodeOfKind<N extends string, K extends string> = Node<N> & {
  kind: K;
};

type PrimitiveModel<
  K extends string = string,
  P extends Record<string, Action> = {},
> = Model<K, P> & {
  properties: P;
};

type Reference<M extends Model> = Pick<M, "name" | "kind">;

type Store = Let<Model> | Let<Model, DataType<Model>>;

type StringModel = PrimitiveModel<"StringModel">;
