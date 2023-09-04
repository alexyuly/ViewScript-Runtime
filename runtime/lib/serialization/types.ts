export interface AbstractFieldSerialized {
  type: "field";
  name: string;
  optional?: true;
}

export interface AbstractUnitSerialized {
  type: "unit";
  name: string;
  streams?: Record<string, StreamSerialized>;
  references?: Record<string, ReferenceSerialized>;
  units: Array<UnitInstanceSerialized>;
}

export interface ActionSerialized {
  type: "action";
  name: string;
  operator: string;
  operand: ExpressionSerialized;
}

export interface BooleanFieldSerialized extends AbstractFieldSerialized {
  name: "boolean";
  value: boolean;
}

export interface ComplexFieldSerialized extends AbstractFieldSerialized {
  value: {};
}

export interface ConditionalCatchSerialized {
  type: "catch";
  condition: ExpressionSerialized;
  handler?: HandlerSerialized;
}

export interface ConditionalYieldSerialized {
  type: "yield";
  condition: ExpressionSerialized;
  result: ExpressionSerialized;
  inverse?: ExpressionSerialized;
}

export interface ContentFieldSerialized extends AbstractFieldSerialized {
  name: "content";
  value: ContentValueSerialized | Array<ContentValueSerialized>;
}

export interface ContentSerialized {
  type: "view-instance" | "element";
  name: string;
  handlers?: Record<string, HandlerSerialized>;
  properties?: Record<string, ExpressionSerialized | ContentSerialized>;
}

export interface ListFieldSerialized<
  T extends FieldSerialized = FieldSerialized,
> extends AbstractFieldSerialized {
  name: "list";
  of: T;
  value: Array<T>;
}

export interface MethodChainSerialized {
  type: "method-chain";
  name: string;
}

export interface MethodPipeSerialized {
  type: "method-pipe";
  name: string;
  methods: Array<MethodSerialized>;
}

export interface MethodSerialized {
  type: "method";
  name: string;
  operator: string;
  operand: ExpressionSerialized | MethodChainSerialized;
}

export interface NumberFieldSerialized extends AbstractFieldSerialized {
  name: "number";
  value: number;
}

export interface PortSerialized<T extends FieldSerialized = FieldSerialized> {
  type: "port";
  field: Omit<T, "value">;
}

export interface ReferenceValueSerialized {
  type: "reference-value";
  name: string;
}

export interface StreamSerialized {
  type: "stream";
  name: string;
}

export interface StringFieldSerialized extends AbstractFieldSerialized {
  name: "string";
  value: string;
}

export interface UnitInstanceSerialized {
  type: "unit-instance";
  name: string;
  handlers?: Record<string, HandlerSerialized>;
  properties?: Record<string, ExpressionSerialized>;
}

export interface ViewUnitSerialized {
  type: "view";
  name: string;
  streams?: Record<string, StreamSerialized>;
  references?: Record<string, ReferenceSerialized>;
  units: Array<UnitInstanceSerialized | ContentSerialized>;
}

export type ContentValueSerialized =
  | number
  | string
  | ContentSerialized
  | ReferenceValueSerialized;

export type ExpressionSerialized =
  | ConditionalYieldSerialized
  | FieldSerialized
  | MethodPipeSerialized
  | MethodSerialized
  | ReferenceValueSerialized;

export type FieldSerialized =
  | AbstractFieldSerialized
  | BooleanFieldSerialized
  | ComplexFieldSerialized
  | ContentFieldSerialized
  | ListFieldSerialized
  | NumberFieldSerialized
  | StringFieldSerialized;

export type HandlerSerialized =
  | ActionSerialized
  | Array<ActionSerialized | ConditionalCatchSerialized>;

export type ReferenceSerialized = FieldSerialized | PortSerialized;

export type UnitSerialized = AbstractUnitSerialized | ViewUnitSerialized;
