/** A certain kind of abstract syntax tree node */
export type Node<Kind extends string> = {
  kind: Kind;
};
