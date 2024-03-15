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
    binding: Data | Ref | Call | Quest | List | Structure | Action | View | Component;
  };

  export type Variable = Node<"variable"> & {
    parameter: Parameter;
    binding: Data | Ref | Call | Quest | List | Structure | Action | View | Component;
  };

  export type Parameter = Node<"parameter"> & {
    name: string;
  };

  export type Data = Node<"data"> & {
    value: any;
  };

  export type Ref = Node<"ref"> & {
    scope: Data | Ref | Call | Quest | List | Structure | Action | View | Component;
    name: string;
  };

  export type Call = Node<"call"> & {
    method: Ref;
    args: Array<Data | Ref | Call | Quest | List | Structure | Action | View | Component>;
  };

  export type Quest = Node<"quest"> & {
    target: Data | Ref | Call;
  };

  export type List = Node<"list"> & {
    args: Array<Data | Ref | Call | Quest | List | Structure | Action | View | Component>;
  };

  export type Structure = Node<"structure"> & {
    attributes: Array<Attribute>;
  };

  export type Action = Node<"action"> & {
    parameters: Array<Parameter>;
    statements: Array<Constant | Variable | Assignment | Quest>;
    result: Data | Ref | Call | Quest | List | Structure | Action | View | Component;
  };

  export type View = Node<"view"> & {
    members: Array<Property | Constant | Variable>;
    render: Component;
  };

  export type Component = Node<"component"> & {
    tagName: string;
    attributes: Array<Attribute>;
  };

  export type Attribute = Node<"attribute"> & {
    name: string;
    binding: Data | Ref | Call | Quest | List | Structure | Action | View | Component;
  };

  export type Assignment = Node<"assignment"> & {
    name: string;
    binding: Data | Ref | Call | Quest | List | Structure | Action | View | Component;
  };
}
