interface AbstractModel<Kind extends string = string> extends NodeOfKind<"Model", Kind> {}

type BooleanModel = AbstractModel<"BooleanModel">

type ComplexDataType<T extends ComplexModel> = {
  [K in keyof T["properties"]]:
    T["properties"][K] extends Model ? DataType<T["properties"][K]> :
    T["properties"][K] extends Let<infer U extends Model> ? DataType<U> :
    never
}

interface ComplexModel extends AbstractModel<"ComplexModel"> {
  properties: {
    [x: string]: Model;
  }
}

type DataType<T extends AbstractModel> =
  T extends BooleanModel ? boolean : 
  T extends NumberModel ? number :
  T extends StringModel ? string :
  T extends ComplexModel ? ComplexDataType<T> :
  never

// interface Dispatch<Scope extends AbstractModel, Path extends Array<string>> extends Node<"Dispatch"> {
//   scope: ;
//   path: ;
// }

interface Let<T extends AbstractModel, V extends DataType<T> | void = void> extends Node<"Let"> {
  model: T
  value: V extends DataType<T> ? V : never
}

type Model = BooleanModel | ComplexModel | StringModel

interface Node<Name extends string> {
  name: Name
}

interface NodeOfKind<Name extends string, Kind extends string> extends Node<Name> {
  kind: Kind
}

type NumberModel = AbstractModel<"NumberModel">

type StringModel = AbstractModel<"StringModel">

export {
  BooleanModel,
  ComplexModel,
  Let,
  NumberModel,
  StringModel,
}

// TODO Support bigint?
