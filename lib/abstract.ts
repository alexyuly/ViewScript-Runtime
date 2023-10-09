export type RandomUniqueId = ReturnType<typeof window.crypto.randomUUID>;

export type Primitive = boolean | number | string;

export type Structure = {
  kind: "data";
  structure: Record<string, Data>;
};

export type Data = Primitive | Structure | Element | Array<Data>;

export type Field<
  ModelKey extends string = string,
  Value extends Data = Data,
> = {
  kind: "field";
  fieldKey: string;
  modelKey: ModelKey;
  value?: Value;
  name?: string;
};

export type Condition = Field<"Condition", boolean>;
export type Count = Field<"Count", number>;
export type Text = Field<"Text", string>;
export type StructureField = Field<"Structure", Structure>;
export type ElementField = Field<"Element", Element>;
export type Collection = Field<"Collection", Array<Data>>;

export type Conditional<ModelKey extends string = string> = {
  kind: "conditional";
  condition: Input<"Condition">;
  positive: Field<ModelKey>;
  negative: Field<ModelKey>;
};

export type Stream = {
  kind: "stream";
  streamKey: RandomUniqueId;
  name?: string;
};

export type Input<ModelKey extends string = string> = {
  kind: "input";
  modelKey: ModelKey;
  keyPath: Array<string>;
};

export type Output<ModelKey extends string = string> = {
  kind: "output";
  keyPath: Array<string>;
  argument?: Field<ModelKey>;
};

export type Inlet<ModelKey extends string = string> = {
  kind: "inlet";
  connection: Field<ModelKey> | Conditional<ModelKey> | Input<ModelKey>;
};

export type Outlet<ModelKey extends string = string> = {
  kind: "outlet";
  connection: Output<ModelKey>;
};

export type ElementProps = Record<string, Inlet | Outlet>;

export type Element<Properties extends ElementProps = ElementProps> = {
  kind: "element";
  viewKey: RandomUniqueId | `<${string}>`;
  properties: Properties;
};

export type ViewTerrain = Record<string, Field | Stream>;

export type View<Terrain extends ViewTerrain = ViewTerrain> = {
  kind: "view";
  viewKey: RandomUniqueId;
  element: Element;
  terrain: Terrain;
  name?: string;
};

export type App = {
  kind: "ViewScript v0.3.1 App";
  root: View;
  views: Record<string, View>;
};

export function isStructure(node: unknown): node is Structure {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "data" &&
    "structure" in node &&
    typeof node.structure === "object" &&
    node.structure !== null &&
    Object.values(node.structure).every(isData)
  );
}

export function isData(node: unknown): node is Data {
  return (
    typeof node === "boolean" ||
    typeof node === "number" ||
    typeof node === "string" ||
    isElement(node) ||
    isStructure(node) ||
    (node instanceof Array && node.every(isData))
  );
}

export function isField(node: unknown): node is Field {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "field"
  );
}

export function isCondition(field: Field): field is Condition {
  return field.modelKey === "Condition";
}

export function isCount(field: Field): field is Count {
  return field.modelKey === "Count";
}

export function isText(field: Field): field is Text {
  return field.modelKey === "Text";
}

export function isStructureField(field: Field): field is StructureField {
  return field.modelKey === "Structure";
}

export function isElementField(field: Field): field is ElementField {
  return field.modelKey === "Element";
}

export function isCollection(field: Field): field is Collection {
  return field.modelKey === "Collection";
}

export function isConditional(node: unknown): node is Conditional {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "conditional"
  );
}

export function isOutlet(node: unknown): node is Outlet {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "outlet"
  );
}

export function isElement(node: unknown): node is Element {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "element"
  );
}

export function isView(node: unknown): node is View {
  return (
    typeof node === "object" &&
    node !== null &&
    "kind" in node &&
    node.kind === "view"
  );
}
