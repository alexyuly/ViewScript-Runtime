export interface Model {
  [property: string]: ModelAction | ModelField | ModelMethod;
}

type ModelAction<
  Update extends ModelUpdate = ModelUpdate,
  Operand extends ModelField = ModelField,
> = (operand: Operand) => Update;

interface ModelActionDispatch<
  Update extends ModelUpdate = ModelUpdate,
  Operand extends ModelField = ModelField,
  Method extends ModelAction<Update, Operand> = ModelAction<Update, Operand>,
  Argument extends Operand = Operand,
> {
  __type: "ModelActionDispatch";
  method: Method;
  operand: Argument;
}

interface ModelCatch<
  Condition extends boolean = false,
  Update extends ModelUpdate | null = null,
> {
  __type: "ModelCatch";
  condition: Condition;
  update: Update;
}

interface ModelConditional<
  Field extends ModelField = ModelField,
  Condition extends boolean = false,
> {
  __type: "ModelConditional";
  condition: Condition;
  positive: ModelExpression<Field>;
  negative?: ModelExpression<Field>;
}

type ModelContent = number | string | ViewInstance | Array<ModelContent>;

type ModelExpression<Field extends ModelField = ModelField> =
  | Field
  | ModelConditional<Field>
  | ModelMethodCall<Field>;

type ModelField<T extends ModelFieldRequired = ModelFieldRequired> = T | null;

type ModelFieldRequired = boolean | number | string | Model | Array<ModelField>;

// TODO type ModelList

type ModelMethod<
  Result extends ModelField = ModelField,
  Operand extends ModelField = ModelField,
> = (operand: Operand) => Result;

interface ModelMethodCall<
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

type ModelUpdate =
  | ModelActionDispatch
  | ModelCatch
  | ModelSetState
  | Array<ModelUpdate>;

export interface Task {
  __type: "Task";
  components: Array<TaskInstance>;
  references?: Record<string, ModelField>;
  streams?: Record<string, ModelField>;
}

export interface TaskInstance<
  TaskType extends Task = Task,
  Handlers extends Record<string, ModelUpdate> = {},
  Properties extends Record<string, ModelField> = {},
> {
  __type: "TaskInstance";
  handlers?: Handlers;
  properties?: Properties;
  task: TaskType;
}

export interface View {
  __type: "View";
  components: Array<TaskInstance | ViewInstance>;
  references?: Record<string, ModelField>;
  streams?: Record<string, ModelField>;
}

export interface ViewInstance<
  ViewType extends View | string = View | string,
  Handlers extends Record<string, ModelUpdate> = {},
  Properties extends Record<string, ModelContent | ModelField> = {},
> {
  __type: "ViewInstance";
  handlers?: Handlers;
  properties?: Properties;
  view: ViewType;
}
