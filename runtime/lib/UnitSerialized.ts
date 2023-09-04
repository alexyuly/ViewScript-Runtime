import type FieldSerialized from "./FieldSerialized";

interface BaseUnitSerialized {
  type: "unit";
  name: string;
  parameters: Record<string, FieldSerialized>;
  units: Array<BaseUnitSerialized>;
}

interface ElementUnitSerialized {
  type: "element-unit";
  name: string;
  parameters: Record<string, FieldSerialized>;
}

interface ViewUnitSerialized {
  type: "view-unit";
  name: string;
  parameters: Record<string, FieldSerialized>;
  units: Array<ViewUnitSerialized | ElementUnitSerialized>;
}

export type UnitSerialized =
  | BaseUnitSerialized
  | ElementUnitSerialized
  | ViewUnitSerialized;
