export namespace Abstract {
  export type Entity<Kind extends string> = {
    kind: Kind;
  };

  export type App = Entity<"app"> & {
    properties: Array<Prop | Constant | Variable>;
  };

  export type Prop = Entity<"prop"> & {
    parameter: Parameter;
  };

  export type Constant = Entity<"constant"> & {
    parameter: Parameter;
    field: Field;
  };

  export type Variable = Entity<"variable"> & {
    parameter: Parameter;
    field: Field;
  };

  export type Parameter = Entity<"parameter"> & {
    name: string;
  };

  export type Field = Entity<"field"> & {
    binding: Ref | Call | Quest | Raw | List | Struct | Action | View | Component;
  };

  export type Ref = Entity<"ref"> & {
    scope?: Field;
    name: string;
  };

  export type Call = Entity<"call"> & {
    ref: Ref;
    args: Array<Field>;
  };

  export type Quest = Entity<"quest"> & {
    call: Call;
  };

  export type Raw = Entity<"raw"> & {
    value: unknown;
  };

  export type List = Entity<"list"> & {
    args: Array<Field>;
  };

  export type Struct = Entity<"struct"> & {
    attributes: Array<Attribute>;
  };

  export type Action = Entity<"action"> & {
    parameters: Array<Parameter>;
    statements: Array<Constant | Variable | Assignment | Field>;
  };

  export type View = Entity<"view"> & {
    properties: Array<Prop | Constant | Variable>;
    component: Component;
  };

  export type Component = Entity<"component"> & {
    name: string;
    attributes: Array<Attribute>;
  };

  export type Attribute = Entity<"attribute"> & {
    name: string;
    field: Field;
  };

  export type Assignment = Entity<"assignment"> & {
    ref: Ref;
    field: Field;
  };
}
