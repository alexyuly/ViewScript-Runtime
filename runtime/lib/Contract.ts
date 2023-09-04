namespace Contract {
  export interface Model {
    [property: string]: ModelField | ModelMethod | ModelAction;
  }

  export type ModelAction = (operand: ModelField) => ModelUpdate;

  export type ModelField<T extends Model = Model> =
    | ModelFieldOptional<T>
    | ModelFieldRequired<T>;

  export type ModelFieldOptional<T extends Model> =
    ModelFieldRequired<T> | null;

  export type ModelFieldRequired<T extends Model> =
    | boolean
    | number
    | string
    | T
    | Array<ModelField<T>>;

  export type ModelMethod = (operand: ModelField) => ModelField;

  export interface ModelSetState<
    T extends ModelField = ModelField,
    V extends T = T,
  > {
    __type: "ModelSetState";
    field: T;
    value: V;
  }

  export type ModelUpdate = ModelSetState | Array<ModelSetState>;

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
