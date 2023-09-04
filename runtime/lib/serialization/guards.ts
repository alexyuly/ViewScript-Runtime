import type {
  BooleanFieldSerialized,
  FieldSerialized,
  NumberFieldSerialized,
  StringFieldSerialized,
} from "./types";

export const isBooleanFieldSerialized = (
  x: FieldSerialized
): x is BooleanFieldSerialized => x.name === "boolean";

export const isNumberFieldSerialized = (
  x: FieldSerialized
): x is NumberFieldSerialized => x.name === "number";

export const isStringFieldSerialized = (
  x: FieldSerialized
): x is StringFieldSerialized => x.name === "string";
