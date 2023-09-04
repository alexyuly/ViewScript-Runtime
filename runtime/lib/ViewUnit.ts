import Field from "./Field";
import type { FieldSerialized, UnitSerialized } from "./serialization/types";

// TODO Should this extend Unit?
export default class ViewUnit {
  readonly name: string;

  private readonly properties: Record<string, Field>;

  private readonly stores: Record<string, Field> = {};

  constructor({
    name,
    properties,
    stores,
    units,
  }: {
    name: string;
    properties: Record<string, Field>;
    stores: Record<string, FieldSerialized>;
    units: Array<UnitSerialized>;
  }) {
    this.name = name;
    this.properties = properties;

    for (const name in stores) {
      const store = stores[name];
      const field = Field.deserialize(store);
      this.stores[name] = field;
    }

    for (const unit of units) {
      // TODO Deserialize each one
    }
  }
}
