export interface AbstractFieldSerialized {
  type: "field";
  name: string;
  optional?: true;
}

export interface BooleanFieldSerialized extends AbstractFieldSerialized {
  name: "boolean";
  value: boolean;
}

export interface NumberFieldSerialized extends AbstractFieldSerialized {
  name: "number";
  value: number;
}

export interface StringFieldSerialized extends AbstractFieldSerialized {
  name: "string";
  value: string;
}

export interface ListFieldSerialized<
  T extends FieldSerialized = FieldSerialized,
> extends AbstractFieldSerialized {
  name: "list";
  of: T;
  value: Array<T>;
}

export interface ComplexFieldSerialized extends AbstractFieldSerialized {
  value: {};
}

export type ContentValue =
  | number
  | string
  | ReferenceValueSerialized
  | ContentSerialized;

export interface ContentFieldSerialized extends AbstractFieldSerialized {
  name: "content";
  value: ContentValue | Array<ContentValue>;
}

export type FieldSerialized =
  | AbstractFieldSerialized
  | BooleanFieldSerialized
  | NumberFieldSerialized
  | StringFieldSerialized
  | ListFieldSerialized
  | ComplexFieldSerialized
  | ContentFieldSerialized;

export interface PortSerialized<T extends FieldSerialized = FieldSerialized> {
  type: "port";
  field: Omit<T, "value">;
}

export type ReferenceSerialized = PortSerialized | FieldSerialized;

interface ReferenceValueSerialized {
  type: "reference-value";
  name: string;
}

export interface MethodSerialized {
  type: "method";
  name: string;
  operator: string;
  operand: ExpressionSerialized;
}

export interface ConditionalYieldSerialized {
  type: "yield";
  condition: ExpressionSerialized;
  result: ExpressionSerialized;
  inverse?: ExpressionSerialized;
}

export type ExpressionSerialized =
  | FieldSerialized
  | ReferenceValueSerialized
  | MethodSerialized
  | ConditionalYieldSerialized;

export interface ActionSerialized {
  type: "action";
  name: string;
  operator: string;
  operand: ExpressionSerialized;
}

export interface ConditionalCatchSerialized {
  type: "catch";
  condition: ExpressionSerialized;
  handler?: HandlerSerialized;
}

export type HandlerSerialized =
  | ActionSerialized
  | Array<ActionSerialized | ConditionalCatchSerialized>;

export interface StreamSerialized {
  type: "stream";
  name: string;
}

export interface UnitInstanceSerialized {
  type: "unit-instance";
  name: string;
  handlers?: Record<string, HandlerSerialized>;
  properties?: Record<string, ExpressionSerialized>;
}

export interface ContentSerialized {
  type: "view-instance" | "element";
  name: string;
  handlers?: Record<string, HandlerSerialized>;
  properties?: Record<string, ExpressionSerialized | ContentSerialized>;
}

export interface AbstractUnitSerialized {
  type: "unit";
  name: string;
  streams?: Record<string, StreamSerialized>;
  references?: Record<string, ReferenceSerialized>;
  units: Array<UnitInstanceSerialized>;
}

export interface ViewUnitSerialized {
  type: "view";
  name: string;
  streams?: Record<string, StreamSerialized>;
  references?: Record<string, ReferenceSerialized>;
  units: Array<UnitInstanceSerialized | ContentSerialized>;
}

export type UnitSerialized = AbstractUnitSerialized | ViewUnitSerialized;
