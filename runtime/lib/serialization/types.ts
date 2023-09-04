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
    operand: Expression;
  };

  export type BooleanField = AbstractField<"boolean", boolean>;

  export type ComplexField<
    Name extends string = string,
    Value extends {} = {},
  > = AbstractField<Name, Value>;

  export type ConditionalCatch = {
    type: "catch";
    condition: Expression;
    handler?: Handler;
  };

  export type ConditionalYield = {
    type: "yield";
    condition: Expression;
    result: Expression;
    inverse?: Expression;
  };

  export type Content = number | string | ReferenceValue | ViewInstance;

  export type ContentField = AbstractField<"content", Content | Array<Content>>;

  export type Expression =
    | ConditionalYield
    | Field
    | Method
    | MethodPipe
    | ReferenceValue;

  export type Field =
    | BooleanField
    | ComplexField
    | ContentField
    | ListField
    | NumberField
    | StringField;

  export type Handler = Action | Array<Action | ConditionalCatch>;

  export type ListField<
    T extends ListFieldItemRecursive = ListFieldItemRecursive,
  > = AbstractField<"list", Array<T>> & {
    of: ListFieldItemName<T>;
  };

  export type ListFieldItem =
    | BooleanField
    | ComplexField
    | NumberField
    | StringField;

  export type ListFieldItemName<T> = T extends Array<ListFieldItem>
    ? { name: "list"; of: ListFieldItemName<T> }
    : T extends ListFieldItem
    ? T["name"]
    : never;

  export type ListFieldItemRecursive =
    | ListFieldItem
    | Array<ListFieldItemRecursive>;

  export type Method = {
    type: "method";
    name: string;
    operator: string;
    operand: Expression | MethodChain;
  };

  export type MethodChain = {
    type: "method-chain";
    name: string;
  };

  export type MethodPipe = {
    type: "method-pipe";
    name: string;
    methods: Array<Method>;
  };

  export type NumberField = AbstractField<"number", number>;

  export type Port = {
    type: "port";
    field: Omit<Field, "value">;
  };

  export type Reference = Field | Port;

  export type ReferenceValue = {
    type: "reference-value";
    name: string;
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
    references?: Record<string, Reference>;
    components: Array<TaskInstance>;
  };

  export type TaskInstance = {
    type: "task-instance";
    name: string;
    handlers?: Record<string, Handler>;
    properties?: Record<string, Expression>;
  };

  export type View = {
    type: "view";
    name: string;
    streams?: Record<string, Stream>;
    references?: Record<string, Reference>;
    components: Array<Content | TaskInstance>;
  };

  export type ViewInstance = {
    type: "view-instance";
    element?: true;
    name: string;
    handlers?: Record<string, Handler>;
    properties?: Record<string, Expression | ViewInstance>;
  };
}
