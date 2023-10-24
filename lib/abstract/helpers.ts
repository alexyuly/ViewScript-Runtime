/** A certain kind of abstract syntax tree node */
export type Node<Kind extends string> = {
  kind: Kind;
};

/** Anything called a certain name, or any name */
export type Called<Name extends string = string> = {
  name: Name;
};

/** The name of something */
export type Name<T extends Called> = T["name"];
