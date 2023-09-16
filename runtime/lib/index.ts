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
  Key extends ControlKeys<M>,
> = M["properties"][Key] extends Action ? M["properties"][Key] : never;

type ControlKeys<M extends Model> = {
  [Key in keyof M["properties"]]: M["properties"][Key] extends Action
    ? Key
    : never;
}[keyof M["properties"]];

type DataType<M extends Model> = M extends BooleanModel
  ? boolean
  : M extends StringModel
  ? string
  : never;

type Field<
  M extends Model,
  Key extends FieldKeys<M>,
> = M["properties"][Key] extends LetOrTake<infer Inner extends Model>
  ? Inner & {
      reference: ModelReference<M>;
      referenceField: Key;
    }
  : never;

type FieldKeys<M extends Model> = {
  [Key in keyof M["properties"]]: M["properties"][Key] extends LetOrTake<Model>
    ? Key
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
  [Key in string]: Action<Model> | LetOrTake<Model>;
};

type ModelReference<M extends Model> = NodeOfKind<"ModelReference", M["kind"]>;

type Node<Name extends string> = {
  name: Name;
};

type NodeOfKind<Name extends string, Kind extends string> = Node<Name> & {
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
