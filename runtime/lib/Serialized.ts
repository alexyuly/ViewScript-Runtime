interface AbstractFieldSerialized {
  type: "field";
  name: string;
  optional?: true;
}

interface BooleanFieldSerialized extends AbstractFieldSerialized {
  name: "boolean";
  value: boolean;
}

export const isBooleanFieldSerialized = (
  x: FieldSerialized
): x is BooleanFieldSerialized => x.name === "boolean";

interface NumberFieldSerialized extends AbstractFieldSerialized {
  name: "number";
  value: number;
}

export const isNumberFieldSerialized = (
  x: FieldSerialized
): x is NumberFieldSerialized => x.name === "number";

interface StringFieldSerialized extends AbstractFieldSerialized {
  name: "string";
  value: string;
}

export const isStringFieldSerialized = (
  x: FieldSerialized
): x is StringFieldSerialized => x.name === "string";

interface ListFieldSerialized<T extends FieldSerialized = FieldSerialized>
  extends AbstractFieldSerialized {
  name: "list";
  of: T;
  value: Array<T>;
}

interface ComplexFieldSerialized extends AbstractFieldSerialized {
  value: {};
}

interface ContentSerialized {
  type: "element" | "view-instance";
  name: string;
  handlers?: Record<string, HandlerSerialized>;
  properties?: Record<string, ExpressionSerialized | ContentSerialized>;
}

interface ContentFieldSerialized extends AbstractFieldSerialized {
  name: "content";
  value:
    | NumberFieldSerialized
    | StringFieldSerialized
    | ContentSerialized
    | Array<ContentFieldSerialized>;
}

export type FieldSerialized =
  | AbstractFieldSerialized
  | BooleanFieldSerialized
  | NumberFieldSerialized
  | StringFieldSerialized
  | ListFieldSerialized
  | ComplexFieldSerialized
  | ContentFieldSerialized;

interface PortSerialized<T extends FieldSerialized = FieldSerialized> {
  type: "port";
  field: Omit<T, "value">;
}

interface MethodSerialized {
  type: "method";
  name: string;
  operator: string;
  operand: ExpressionSerialized;
}

interface ConditionalYieldSerialized {
  type: "yield";
  condition: ExpressionSerialized;
  result: ExpressionSerialized;
  inverse?: ExpressionSerialized;
}

type ExpressionSerialized =
  | FieldSerialized
  | MethodSerialized
  | ConditionalYieldSerialized;

interface ActionSerialized {
  type: "action";
  name: string;
  operator: string;
  operand: ExpressionSerialized;
}

interface ConditionalCatchSerialized {
  type: "catch";
  condition: ExpressionSerialized;
  handler?: HandlerSerialized;
}

type HandlerSerialized =
  | ActionSerialized
  | Array<ActionSerialized | ConditionalCatchSerialized>;

interface StreamSerialized {
  type: "stream";
  name: string;
}

type ReferenceSerialized = PortSerialized | FieldSerialized;

interface UnitInstanceSerialized {
  type: "unit-instance";
  name: string;
  handlers?: Record<string, HandlerSerialized>;
  properties?: Record<string, ExpressionSerialized>;
}

interface AbstractUnitSerialized {
  type: "unit";
  name: string;
  streams?: Record<string, StreamSerialized>;
  references?: Record<string, ReferenceSerialized>;
  units: Array<UnitInstanceSerialized>;
}

interface ViewUnitSerialized {
  type: "view";
  name: string;
  streams?: Record<string, StreamSerialized>;
  references?: Record<string, ReferenceSerialized>;
  units: Array<UnitInstanceSerialized | ContentSerialized>;
}

export type UnitSerialized = AbstractUnitSerialized | ViewUnitSerialized;
