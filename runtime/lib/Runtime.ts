type Action<T extends Model | void = void> = (argument: T extends void ? never : T) => void

// type BigIntModel

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

type Dispatch<
  Scope extends Model,
  ModelName extends {
    [K in keyof (Scope["properties"])]: (Scope["properties"])[K] extends Field ? K : never
  }[keyof (Scope["properties"])],
  ActionName extends {
    [K in keyof (
      Scope["properties"][ModelName] extends Model ? Scope["properties"][ModelName]["properties"] :
      Scope["properties"][ModelName] extends Store ? Scope["properties"][ModelName]["model"]["properties"] :
      never
    )]: (
      Scope["properties"][ModelName] extends Model ? Scope["properties"][ModelName]["properties"] :
      Scope["properties"][ModelName] extends Store ? Scope["properties"][ModelName]["model"]["properties"] :
      never
    )[K] extends Action ? K : never
  }[keyof (
    Scope["properties"][ModelName] extends Model ? Scope["properties"][ModelName]["properties"] :
    Scope["properties"][ModelName] extends Store ? Scope["properties"][ModelName]["model"]["properties"] :
    never
  )]
> = Node<"Dispatch"> & {
  scope: Reference<Scope>
  model: ModelName
  action: ActionName
}

type Field =
  | Model
  | Store

type Let<
  T extends Model,
  V extends DataType<T> | void = void
> = Node<"Let"> & {
  model: T
  value: V extends void ? never : V
}

type Model<
  Kind extends string = string,
  Properties extends { [x: string]: Action | Field } = {}
> = NodeOfKind<"Model", Kind> & {
  properties: Properties
} 

type Node<Name extends string> = {
  name: Name
}

type NodeOfKind<
  Name extends string,
  Kind extends string
> = Node<Name> & {
  kind: Kind
}

type NumberModel = PrimitiveModel<"NumberModel">

type PrimitiveModel<
  Kind extends string = string,
  Properties extends { [x: string]: Action } = {}
> = Model<Kind, Properties> & {
  properties: Properties
}

type Reference<Scope extends Model> = Pick<Scope, "name" | "kind">

type Store =
  | Let<Model>
  | Let<Model, DataType<Model>>

type StringModel = PrimitiveModel<"StringModel">

export {
  BooleanModel,
  Dispatch,
  Let,
  Model,
  NumberModel,
  StringModel,
}
