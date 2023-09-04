export const isBooleanFieldSerialized = (
  x: Serialized.Field
): x is Serialized.BooleanField => x.name === "boolean";

export const isNumberFieldSerialized = (
  x: Serialized.Field
): x is Serialized.NumberField => x.name === "number";

export const isStringFieldSerialized = (
  x: Serialized.Field
): x is Serialized.StringField => x.name === "string";
