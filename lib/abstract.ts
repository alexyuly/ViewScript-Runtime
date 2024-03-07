export namespace Abstract {
  export type Node<T extends string = string> = {
    kind: T;
  };

  export type App = Node<"app"> & {
    properties: Array<Param | Fun | Val | Var | View>;
  };

  export type Param = Node<"param"> & {
    key: string;
  };

  export type Fun = Node<"fun"> & {
    key: string;
    binding: Action;
  };

  export type Val = Node<"val"> & {
    key: string;
    binding: Field;
  };

  export type Var = Node<"var"> & {
    key: string;
    binding: Field;
  };

  export type View = Node<"view"> & {
    key: string;
    properties: Array<Param | Fun | Val | Var>;
    binding: Component;
  };

  export type Field = Node<"field"> & {
    binding: Raw | Ref | Call | List | Structure | Component | Quest;
  };

  export type Action = Node<"action"> & {
    params: Array<Param>;
    steps: Array<Val | Call>;
  };

  export type Raw = Node<"raw"> & {
    value: any;
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

  export type List = Node<"list"> & {
    args: Array<Field | Action>;
  };

  export type Structure = Node<"structure"> & {
    attributes: Array<Fun | Var>;
  };

  export type Component = Node<"component"> & {
    key: string;
    attributes: Array<Fun | Val>;
  };

  export type Quest = Node<"quest"> & {
    binding: Raw | Ref | Call;
  };
}
