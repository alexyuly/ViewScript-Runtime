export type Model = Record<string, ModelField | ModelAction | ModelMethod>;

export type ModelAction = (operand: ModelField) => void;

export type ModelField<T extends Model = {}> =
  | boolean
  | number
  | string
  | T
  | Array<ModelField>;

export type ModelMethod = (operand: ModelField) => ModelField;
