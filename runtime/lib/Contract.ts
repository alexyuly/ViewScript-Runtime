namespace Contract {
  export interface Model {
    [property: string]: ModelAction | ModelField | ModelMethod;
  }

  export type ModelAction = (operand: ModelField) => ModelUpdate;

  export interface ModelCatch<
    Update extends ModelUpdate | null = null,
    Condition extends boolean = false,
  > {
    __type: "ModelCatch";
    condition: Condition;
    update: Update;
  }

  export interface ModelConditional<
    Field extends ModelField = ModelField,
    Condition extends boolean = false,
  > {
    __type: "ModelConditional";
    condition: Condition;
    positive: ModelExpression<Field>;
    negative?: ModelExpression<Field>;
  }

  export type ModelExpression<Field extends ModelField = ModelField> =
    | Field
    | ModelConditional<Field>
    | ModelMethodCall<Field>;

  export type ModelField<T extends ModelFieldRequired = ModelFieldRequired> =
    T | null;

  export type ModelFieldRequired =
    | boolean
    | number
    | string
    | Model
    | Array<ModelField>;

  export type ModelMethod<
    Result extends ModelField = ModelField,
    Operand extends ModelField = ModelField,
  > = (operand: Operand) => Result;

  export interface ModelMethodCall<
    Result extends ModelField = ModelField,
    Operand extends ModelField = ModelField,
    Method extends ModelMethod<Result, Operand> = ModelMethod<Result, Operand>,
    Argument extends Operand = Operand,
  > {
    __type: "ModelMethodCall";
    method: Method;
    operand: Argument;
  }

  export interface ModelSetState<
    Field extends ModelField = ModelField,
    Value extends Field = Field,
  > {
    __type: "ModelSetState";
    field: Field;
    value: Value;
  }

  export type ModelUpdate = ModelCatch | ModelSetState | Array<ModelUpdate>;

  export interface Task {
    components: Record<string, TaskInstance>;
    parameters: Record<string, ModelField>;
    stores: Record<string, ModelField>;
    streams: Record<string, ModelField>;
  }

  export interface TaskInstance<T extends Task = Task> {
    // handlers:
    // properties:
    task: T;
  }

  export interface View {
    components: Record<string, TaskInstance | ViewInstance>;
    parameters: Record<string, ModelField>;
    stores: Record<string, ModelField>;
    streams: Record<string, ModelField>;
  }

  export interface ViewInstance<T extends string | View = View> {
    // handlers:
    // properties:
    view: T;
  }
}
