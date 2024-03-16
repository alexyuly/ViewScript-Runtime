export namespace Abstract {
  export type Entity<T extends string = string> = {
    kind: T;
  };

  export type App = Entity<"app"> & {
    members: Array<Prop | Constant | Variable>;
  };

  export type Prop = Entity<"prop"> & {
    parameter: Parameter;
  };

  export type Constant = Entity<"constant"> & {
    parameter: Parameter;
    binding: Field;
  };

  export type Variable = Entity<"variable"> & {
    parameter: Parameter;
    binding: Field;
  };

  export type Parameter = Entity<"parameter"> & {
    name: string;
  };

  export type Field = Entity<"field"> & {
    binding: Ref | Call | Quest | Raw | List | Structure | Action | View | Component;
  };

  export type Ref = Entity<"ref"> & {
    scope?: Field;
    name: string;
  };

  export type Call = Entity<"call"> & {
    method: Ref;
    args: Array<Field>;
  };

  export type Quest = Entity<"quest"> & {
    target: Ref | Call;
  };

  export type Raw = Entity<"raw"> & {
    value: unknown;
  };

  export type List = Entity<"list"> & {
    args: Array<Field>;
  };

  export type Structure = Entity<"structure"> & {
    attributes: Array<Attribute>;
  };

  export type Action = Entity<"action"> & {
    parameters: Array<Parameter>;
    statements: Array<Constant | Variable | Assignment | Field>;
    result: Field;
  };

  export type View = Entity<"view"> & {
    members: Array<Prop | Constant | Variable>;
    render: Component;
  };

  export type Component = Entity<"component"> & {
    name: string;
    attributes: Array<Attribute>;
  };

  export type Attribute = Entity<"attribute"> & {
    name: string;
    binding: Field;
  };

  export type Assignment = Entity<"assignment"> & {
    target: Ref;
    binding: Field;
  };
}
