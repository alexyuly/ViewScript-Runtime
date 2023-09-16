export { BooleanModel, Control, Let, Model, Of, StringModel, Take };

type Action<Input extends Model = Nothing> = Node<"Action"> & {
  actionInput: ModelReference<Input>;
};

type BooleanModel = Model<
  "BooleanModel",
  {
    value: Field<Primitive>;
    disable: Action;
    enable: Action;
    toggle: Action;
  }
>;

type Control<
  M extends Model,
  K extends {
    [K2 in keyof M["properties"]]: M["properties"][K2] extends Action
      ? K2
      : never;
  }[keyof M["properties"]],
> = M["properties"][K] extends Action ? M["properties"][K] : never;

type DataType<M extends Model> = M extends BooleanModel
  ? boolean
  : M extends StringModel
  ? string
  : never;

type Field<M extends Model> = Take<M> | Let<M> | Let<M, DataType<M>>;

type Let<M extends Model, D extends DataType<M> | void = void> = Node<"Let"> & {
  methodInput: ModelReference<Nothing>;
  methodOutput: ModelReference<M>;
  value: D;
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

type Node<N extends string> = {
  name: N;
};

type NodeOfKind<N extends string, Kind extends string> = Node<N> & {
  kind: Kind;
};

type Nothing = Model<"Nothing">;

type Of<
  M extends Model,
  K extends {
    [K2 in keyof M["properties"]]: M["properties"][K2] extends Field<Model>
      ? K2
      : never;
  }[keyof M["properties"]],
> = M["properties"][K] extends Field<infer N extends Model> ? N : never;

type Primitive = Model<"Primitive">;

type StringModel = Model<
  "StringModel",
  {
    value: Field<Primitive>;
  }
>;

type Take<M extends Model> = Node<"Take"> & {
  methodInput: ModelReference<Nothing>;
  methodOutput: ModelReference<M>;
};
