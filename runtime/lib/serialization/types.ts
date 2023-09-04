namespace Serialized {
  export type AbstractField<Name extends string, Value> = {
    type: "field";
    name: Name;
    optional?: true;
    value: Value;
  };

  export type Action = {
    type: "action";
    name: string;
    operator: string;
    operand: Expression<DataField>;
  };

  export type BooleanField = AbstractField<"boolean", boolean>;

  export type ComplexField<
    Name extends string = string,
    Value extends {} = {},
  > = AbstractField<Name, Value>;

  export type ConditionalCatch = {
    type: "conditional-catch";
    condition: Expression<DataField>;
    handler?: Handler;
  };

  export type ConditionalYield<T extends AbstractField> = {
    type: "conditional-yield";
    condition: Expression<DataField>;
    result: T;
    inverse?: T;
  };

  export type Content = number | string | ReferenceValue | ViewInstance;

  export type ContentField = AbstractField<"content", Content | Array<Content>>;

  export type DataField =
    | BooleanField
    | ComplexField
    | ListField
    | NumberField
    | StringField;

  export type Expression<T extends AbstractField = Field> =
    | ConditionalYield<T>
    | Method
    | ReferenceValue
    | T;

  export type Field = ContentField | DataField;

  export type Handler = Action | Array<Action | ConditionalCatch>;

  export type ListField<
    T extends ListFieldItem = ListFieldItem,
  > = AbstractField<"list", Array<T>> & {
    of: ListFieldItemName<T>;
  };

  export type ListFieldItem =
    | ListFieldItemLeaf
    | Array<ListFieldItem>;

  export type ListFieldItemLeaf =
    | BooleanField
    | ComplexField
    | NumberField
    | StringField;

  export type ListFieldItemName<T> = T extends Array<ListFieldItemLeaf>
    ? { name: "list"; of: ListFieldItemName<T[number]> }
    : T extends ListFieldItemLeaf
    ? T["name"]
    : never;

  export type Method = MethodCall | MethodPipe;

  export type MethodCall = {
    type: "method-call";
    name: string;
    operator: string;
    operand: Expression<DataField> | MethodChain;
  };

  export type MethodChain = {
    type: "method-chain";
    name: string;
  };

  export type MethodPipe = {
    type: "method-pipe";
    name: string;
    methods: Array<MethodCall>;
  };

  export type NumberField = AbstractField<"number", number>;

  export type Port<T extends AbstractField = Field> = {
    type: "port";
  } & Omit<T, "type" | "value">;

  export type Reference<T extends AbstractField = Field> = T | Port<T>;

  export type ReferenceValue = {
    type: "reference-value";
    name: string;
    path?: Array<string>;
  };

  export type Stream = {
    type: "stream";
    name: string;
  };

  export type StringField = AbstractField<"string", string>;

  export type Task = {
    type: "task";
    name: string;
    streams?: Record<string, Stream>;
    references?: Record<string, Reference<DataField>>;
    components: Array<TaskInstance>;
  };

  export type TaskInstance = {
    type: "task-instance";
    name: string;
    handlers?: Record<string, Handler>;
    properties?: Record<string, Expression<DataField>>;
  };

  export type View = {
    type: "view";
    name: string;
    streams?: Record<string, Stream>;
    references?: Record<string, Reference>;
    components: Array<TaskInstance | ViewInstance>;
  };

  export type ViewInstance = {
    type: "view-instance";
    name: string;
    element?: true;
    handlers?: Record<string, Handler>;
    properties?: Record<string, Expression>;
  };
}
