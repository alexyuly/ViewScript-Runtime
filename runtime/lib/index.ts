export { BooleanModel, Dispatch, Let, Model, StringModel, Take };

type Action<M extends Model | void = void> = (
  parameter: M extends void ? never : M
) => void;

type BooleanModel = PrimitiveModel<
  "BooleanModel",
  {
    enable(): void;
  }
>;

type ComplexDataType<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Field
    ? DataType<
        M["properties"][K]["reference"] extends Reference<infer R extends Model>
          ? R
          : never
      >
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
    [K in keyof ModelChild<M, F>["properties"]]: ModelChild<
      M,
      F
    >["properties"][K] extends Action
      ? K
      : never;
  }[keyof ModelChild<M, F>["properties"]],
> = Node<"Dispatch"> &
  Field & {
    field: F;
    action: A;
  };

type Field<M extends Model = Model> = {
  reference: Reference<M>;
};

type Let<M extends Model, D extends DataType<M> | void = void> = Node<"Let"> &
  Field<M> & {
    value: D extends void ? never : D;
  };

type Model<
  K extends string = string,
  P extends Record<string, Action | Field> = {},
> = NodeOfKind<"Model", K> & {
  properties: P;
};

type ModelChild<
  M extends Model,
  F extends keyof M["properties"],
> = M["properties"][F] extends Field
  ? M["properties"][F]["reference"] extends Reference<infer R extends Model>
    ? R
    : never
  : never;

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

type StringModel = PrimitiveModel<"StringModel">;

type Take<M extends Model> = Node<"Take"> & Field<M>;
