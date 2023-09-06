type Action<T extends Model | void = void> = (argument: T extends void ? never : T) => void

type BooleanModel = PrimitiveModel<"BooleanModel", {
  enable(): void
}>

type ComplexDataType<T extends Model> = {
  [K in keyof T["properties"]]:
    T["properties"][K] extends Model ? DataType<T["properties"][K]> :
    T["properties"][K] extends Let<infer U extends Model> ? DataType<U> :
    never
}

type DataType<T extends Model> =
  T extends BooleanModel ? boolean : 
  T extends NumberModel ? number :
  T extends StringModel ? string :
  T extends Model ? ComplexDataType<T> :
  never

interface Dispatch<
  Scope extends Model,
  ModelName extends {
    [K in keyof (Scope["properties"])]: (Scope["properties"])[K] extends Field ? K : never
  }[keyof (Scope["properties"])],
  ActionName extends {
    [K in keyof (Scope["properties"][ModelName]["properties"])]: (Scope["properties"][ModelName]["properties"])[K] extends Action ? K : never
  }[keyof (Scope["properties"][ModelName]["properties"])]
  // TODO fix ActionName ^
> extends Node<"Dispatch"> {
  scope: Scope
  modelName: ModelName
  actionName: ActionName
}

type Field = Let<Model> | Let<Model, DataType<Model>> | Model

interface Let<T extends Model, V extends DataType<T> | void = void> extends Node<"Let"> {
  model: T
  value: V extends void ? never : V
}

interface Model<
  Kind extends string = string,
  Properties extends { [x: string]: Action | Field } = {}
> extends NodeOfKind<"Model", Kind> {
  properties: Properties
} 

interface Node<Name extends string> {
  name: Name
}

interface NodeOfKind<Name extends string, Kind extends string> extends Node<Name> {
  kind: Kind
}

type NumberModel = PrimitiveModel<"NumberModel">

// TODO Support other primitive types, like bigint and symbol?
interface PrimitiveModel<
  Kind extends string = string,
  Properties extends { [x: string]: Action } = {}
> extends Model<Kind, Properties> {
  properties: Properties
} 

type StringModel = PrimitiveModel<"StringModel">

export {
  BooleanModel,
  Dispatch,
  Let,
  Model,
  NumberModel,
  StringModel,
}
