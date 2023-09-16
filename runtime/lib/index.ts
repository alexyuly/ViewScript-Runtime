export { BooleanModel, Control, Field, Let, Model, StringModel, Take };

type Action<Input extends Model = Nothing> = Node<"Action"> & {
  input: ModelReference<Input>;
};

type BooleanModel = Model<
  "BooleanModel",
  {
    value: Take<Primitive>;
    disable: Action;
    enable: Action;
    toggle: Action;
  }
>;

type Control<
  M extends Model,
  K extends ControlKeys<M>,
> = M["properties"][K] extends Action ? M["properties"][K] : never;

type ControlKeys<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends Action ? K : never;
}[keyof M["properties"]];

type DataType<M extends Model> = M extends BooleanModel
  ? boolean
  : M extends StringModel
  ? string
  : never;

type Field<
  M extends Model,
  K extends FieldKeys<M>,
> = M["properties"][K] extends LetOrTake<infer N extends Model>
  ? N & {
      reference: ModelReference<M>;
      referenceField: K;
    }
  : never;

type FieldKeys<M extends Model> = {
  [K in keyof M["properties"]]: M["properties"][K] extends LetOrTake<Model>
    ? K
    : never;
}[keyof M["properties"]];

type Let<M extends Model, D extends DataType<M> | void = void> = Node<"Let"> & {
  initialValue: D;
  output: ModelReference<M>;
};

type LetOrTake<M extends Model> = Take<M> | Let<M>;

type Model<
  Kind extends string = string,
  Properties extends ModelProperties = ModelProperties,
> = NodeOfKind<"Model", Kind> & {
  properties: Properties;
};

type ModelProperties = {
  [K in string]: Action<Model> | LetOrTake<Model>;
};

type ModelReference<M extends Model> = NodeOfKind<"ModelReference", M["kind"]>;

type Node<N extends string> = {
  name: N;
};

type NodeOfKind<N extends string, Kind extends string> = Node<N> & {
  kind: Kind;
};

type Nothing = Model<"Nothing">;

type Primitive = Model<"Primitive">;

type StringModel = Model<
  "StringModel",
  {
    value: Take<Primitive>;
  }
>;

type Take<M extends Model> = Node<"Take"> & {
  output: ModelReference<M>;
};
