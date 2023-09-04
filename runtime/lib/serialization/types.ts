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

  export type ContentField = AbstractField<
    "content",
    ContentValue | Array<ContentValue>
  >;

  export type Content = {
    type: "view-instance" | "element";
    name: string;
    handlers?: Record<string, Handler>;
    properties?: Record<string, Expression | Content>;
  };

  export type ContentValue = number | string | Content | ReferenceValue;

  export type Expression =
    | ConditionalYield
    | Field
    | MethodPipe
    | Method
    | ReferenceValue;

  export type Field =
    | BooleanField
    | ComplexField
    | ContentField
    | ListField
    | NumberField
    | StringField;

  export type Handler = Action | Array<Action | ConditionalCatch>;

  export type ListFieldItem =
    | BooleanField
    | ComplexField
    | NumberField
    | StringField;

  export type ListField<T extends ListFieldItem = ListFieldItem> =
    AbstractField<"list", Array<T>> & { of: T["name"] };

  export type MethodChain = {
    type: "method-chain";
    name: string;
  };

  export type MethodPipe = {
    type: "method-pipe";
    name: string;
    methods: Array<Method>;
  };

  export type Method = {
    type: "method";
    name: string;
    operator: string;
    operand: Expression | MethodChain;
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

  export type TaskInstance = {
    type: "task-instance";
    name: string;
    handlers?: Record<string, Handler>;
    properties?: Record<string, Expression>;
  };

  export type Task = {
    type: "task";
    name: string;
    streams?: Record<string, Stream>;
    references?: Record<string, Reference>;
    components: Array<TaskInstance>;
  };

  export type View = {
    type: "view";
    name: string;
    streams?: Record<string, Stream>;
    references?: Record<string, Reference>;
    components: Array<Content | TaskInstance>;
  };
}
