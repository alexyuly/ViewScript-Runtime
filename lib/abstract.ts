export namespace Abstract {
  export type Node<T extends string = string> = {
    kind: T;
  };

  export type App = Node<"app"> & {
    properties: Array<Param | Val | Var>;
  };

  export type Param = Node<"param"> & {
    key: string;
  };

  export type Val = Node<"val"> & {
    key: string;
    binding: Field;
  };

  export type Var = Node<"var"> & {
    key: string;
    binding: Field;
  };

  export type Field = Node<"field"> & {
    binding: Raw | Ref | Call | Quest | List | Structure | Component | Action | View;
  };

  export type Raw = Node<"raw"> & {
    value: any;
  };

  export type Ref = Node<"ref"> & {
    scope?: Ref | Call | Quest;
    key: string;
  };

  export type Call = Node<"call"> & {
    callee: Ref;
    args: Array<Field>;
  };

  export type Quest = Node<"quest"> & {
    question: Raw | Ref | Call;
  };

  export type List = Node<"list"> & {
    args: Array<Field>;
  };

  export type Structure = Node<"structure"> & {
    attributes: Array<Var | Ref>;
  };

  export type Component = Node<"component"> & {
    template: Ref;
    attributes: Array<Val | Ref>;
  };

  export type Action = Node<"action"> & {
    params: Array<Param>;
    steps: Array<Val | Field>;
  };

  export type View = Node<"view"> & {
    properties: Array<Param | Val | Var>;
    binding: Component;
  };
}
