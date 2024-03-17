export namespace Abstract {
  export type TreeNode<Kind extends string> = {
    kind: Kind;
  };

  export type App = TreeNode<"app"> & {
    properties: Array<Prop | Constant | Variable>;
  };

  export type Prop = TreeNode<"prop"> & {
    parameter: Parameter;
  };

  export type Constant = TreeNode<"constant"> & {
    parameter: Parameter;
    field: Field;
  };

  export type Variable = TreeNode<"variable"> & {
    parameter: Parameter;
    field: Field;
  };

  export type Parameter = TreeNode<"parameter"> & {
    name: string;
  };

  export type Field = TreeNode<"field"> & {
    binding: Ref | Call | Quest | Raw | List | Struct | Action | View | Component;
  };

  export type Ref = TreeNode<"ref"> & {
    scope?: Field;
    name: string;
  };

  export type Call = TreeNode<"call"> & {
    ref: Ref;
    args: Array<Field>;
  };

  export type Quest = TreeNode<"quest"> & {
    call: Call;
  };

  export type Raw = TreeNode<"raw"> & {
    value: unknown;
  };

  export type List = TreeNode<"list"> & {
    args: Array<Field>;
  };

  export type Struct = TreeNode<"struct"> & {
    attributes: Array<Attribute>;
  };

  export type Action = TreeNode<"action"> & {
    parameters: Array<Parameter>;
    statements: Array<Constant | Variable | Assignment | Field>;
  };

  export type View = TreeNode<"view"> & {
    properties: Array<Prop | Constant | Variable>;
    component: Component;
  };

  export type Component = TreeNode<"component"> & {
    name: string;
    attributes: Array<Attribute>;
  };

  export type Attribute = TreeNode<"attribute"> & {
    name: string;
    field: Field;
  };

  export type Assignment = TreeNode<"assignment"> & {
    ref: Ref;
    field: Field;
  };
}
