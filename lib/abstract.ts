export namespace Abstract {
  export type Node<T extends string = string> = {
    kind: T;
  };

  export type App = Node<"app"> & {
    members: Array<Val>;
  };

  export type Val = Node<"val"> & {
    key: string;
    binding: Field | Action;
  };

  export type Field = Node<"field"> & {
    binding: Raw | List | Structure | Ref | Call | Component;
  };

  export type Action = Node<"action"> & {
    props: Array<Prop>;
    steps: Array<Val | Call>;
  };

  export type Raw = Node<"raw"> & {
    value: any;
  };

  export type List = Node<"list"> & {
    args: Array<Field | Action>;
  };

  export type Structure = Node<"structure"> & {
    args: Array<Val | Var>;
  };

  export type Ref = Node<"ref"> & {
    scope?: Field;
    key: string;
  };

  export type Call = Node<"call"> & {
    scope?: Field;
    key: string;
    args: Array<Field | Action>;
  };

  export type Component = Node<"component"> & {
    key: string;
    args: Array<Val | Var>;
  };

  export type Prop = Node<"prop"> & {
    key: string;
  };

  export type Var = Node<"var"> & {
    key: string;
    binding: Field;
  };
}
