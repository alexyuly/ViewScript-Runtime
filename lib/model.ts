import * as Abstract from "./abstract";
import { Store } from "./base";

export const boolean = (
  store: Store<"Boolean">
): Abstract.Model<"Boolean"> => ({
  kind: "model",
  name: "Boolean",
  members: {
    and: {
      kind: "method",
      modelName: "Boolean",
      delegate: (arg) => store.read() && (arg as boolean),
    },
    not: {
      kind: "method",
      modelName: "Boolean",
      delegate: () => !store.read(),
    },
    disable: {
      kind: "action",
      delegate: () => store.take(false),
    },
    enable: {
      kind: "action",
      delegate: () => store.take(true),
    },
    toggle: {
      kind: "action",
      delegate: () => store.take(!store.read()),
    },
  },
});

export const number = (store: Store<"Number">): Abstract.Model<"Number"> => ({
  kind: "model",
  name: "Number",
  members: {
    equals: {
      kind: "method",
      modelName: "Boolean",
      delegate: (arg) => store.read() === (arg as number),
    },
    isAtLeast: {
      kind: "method",
      modelName: "Boolean",
      delegate: (arg) => store.read() >= (arg as number),
    },
    add: {
      kind: "action",
      delegate: (arg) => store.take(store.read() + (arg as number)),
    },
    multiplyBy: {
      kind: "action",
      delegate: (arg) => store.take(store.read() * (arg as number)),
    },
  },
});

export const string = (): Abstract.Model<"String"> => ({
  kind: "model",
  name: "String",
  members: {},
});

export const renderable = (): Abstract.Model<"Renderable"> => ({
  kind: "model",
  name: "Renderable",
  members: {},
});

// TODO How to handle generic vs specific arrays?
// class ArrayField extends Field<"Array"> {
//   constructor(field: Abstract.ArrayField) {
//     super(field);

//     this.defineAction(
//       "push",
//       (item) =>
//         (this.getValue() || []).concat?.(
//           item instanceof Array ? [item] : item
//         ) || [item]
//     );
//   }
// }

// class StructureField<ModelKey extends string = string> extends Field<
//   ModelKey,
//   Abstract.Structure
// > {
//   constructor(field: Abstract.StructureField<ModelKey>) {
//     super(field);
//   }
// }

// class Console extends Field {
//   constructor() {
//     super({ kind: "field", key: "console", modelKey: "Console" });

//     this.defineAction("log", window.console.log);
//   }
// }

// class Browser extends Field {
//   constructor() {
//     super({ kind: "field", key: "browser", modelKey: "Browser" });

//     this.defineField("console", new Console());
//   }
// }
