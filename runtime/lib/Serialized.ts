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

interface ComplexFieldSerialized extends AbstractFieldSerialized {
  value: {};
}

interface ListFieldSerialized<T extends FieldSerialized = FieldSerialized>
  extends AbstractFieldSerialized {
  name: "list";
  of: T;
  value: Array<T>;
}

export type FieldSerialized =
  | AbstractFieldSerialized
  | BooleanFieldSerialized
  | NumberFieldSerialized
  | StringFieldSerialized
  | ComplexFieldSerialized
  | ListFieldSerialized;

interface MethodSerialized {
  type: "method";
  name: string;
  operator: string;
  operand: ExpressionSerialized;
}

interface ConditionalSerialized {
  type: "conditional";
  condition: ExpressionSerialized;
  result: ExpressionSerialized;
  inverse?: ExpressionSerialized;
}

type ExpressionSerialized =
  | FieldSerialized
  | MethodSerialized
  | ConditionalSerialized;

interface ActionSerialized {
  type: "action";
  name: string;
  operator: string;
  operand: ExpressionSerialized;
}

interface CatchSerialized {
  type: "catch";
  expression: ExpressionSerialized;
  handler?: HandlerSerialized;
}

type HandlerSerialized =
  | ActionSerialized
  | Array<ActionSerialized | CatchSerialized>;

interface StreamSerialized {
  type: "stream";
  name: string;
}

interface AbstractUnitSerialized {
  type: "unit";
  name: string;
  references?: Record<string, FieldSerialized>;
  streams?: Record<string, StreamSerialized>;
  units: Array<{
    type: "unit";
    name: string;
    handlers?: Record<string, HandlerSerialized>;
    properties?: Record<string, ExpressionSerialized>;
  }>;
}

interface ViewUnitSerialized {
  type: "view";
  name: string;
  references?: Record<string, FieldSerialized>;
  streams?: Record<string, StreamSerialized>;
  units: Array<{
    type: "element" | "unit" | "view";
    name: string;
    handlers?: Record<string, HandlerSerialized>;
    properties?: Record<string, ExpressionSerialized>;
  }>;
}

export type UnitSerialized = AbstractUnitSerialized | ViewUnitSerialized;
