/** A certain kind of abstract syntax tree node */
export type Node<Kind extends string> = {
  kind: Kind;
};

/** Anything with a certain name, or any name */
export type Named<Name extends string = string> = {
  name: Name;
};
