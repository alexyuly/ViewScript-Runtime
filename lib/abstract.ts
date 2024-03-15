export namespace Abstract {
  export type Node<T extends string = string> = {
    kind: T;
  };

  export type App = Node<"app"> & {
    members: Array<Property | Constant | Variable>;
  };

  export type Property = Node<"property"> & {
    parameter: Parameter;
  };

  export type Constant = Node<"constant"> & {
    parameter: Parameter;
    binding: Entity;
  };

  export type Variable = Node<"variable"> & {
    parameter: Parameter;
    binding: Entity;
  };

  export type Parameter = Node<"parameter"> & {
    name: string;
  };

  export type Entity = Node<"entity"> & {
    binding: Ref | Call | Expression | Quest | Data | List | Structure | Action | View | Component;
  };

  export type Ref = Node<"ref"> & {
    scope: Entity;
    name: string;
  };

  export type Call = Node<"call"> & {
    method: Ref;
    args: Array<Entity>;
  };

  export type Expression = Node<"expression"> & {
    method: Ref;
    args: Array<Entity>;
  };

  export type Quest = Node<"quest"> & {
    target: Ref | Call | Expression;
  };

  export type Data = Node<"data"> & {
    value: any;
  };

  export type List = Node<"list"> & {
    args: Array<Entity>;
  };

  export type Structure = Node<"structure"> & {
    attributes: Array<Attribute>;
  };

  export type Action = Node<"action"> & {
    parameters: Array<Parameter>;
    statements: Array<Constant | Variable | Assignment | Entity>;
    result: Entity;
  };

  export type View = Node<"view"> & {
    members: Array<Property | Constant | Variable>;
    render: Component;
  };

  export type Component = Node<"component"> & {
    name: string;
    attributes: Array<Attribute>;
  };

  export type Attribute = Node<"attribute"> & {
    name: string;
    binding: Entity;
  };

  export type Assignment = Node<"assignment"> & {
    name: string;
    binding: Entity;
  };
}
