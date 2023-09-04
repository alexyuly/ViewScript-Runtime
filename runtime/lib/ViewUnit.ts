import Field from "./Field";
import type FieldSerialized from "./FieldSerialized";
import type { UnitSerialized } from "./UnitSerialized";

// TODO Should this extend Unit?
export default class ViewUnit {
  readonly name: string;

  private readonly parameters: Record<string, Field>;

  private readonly stores: Record<string, Field> = {};

  constructor({
    name,
    parameters,
    stores,
    units,
  }: {
    name: string;
    parameters: Record<string, Field>;
    stores: Record<string, FieldSerialized>;
    units: Array<UnitSerialized>;
  }) {
    this.name = name;
    this.parameters = parameters;

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
