import * as Abstract from "./abstract";
import { Store } from "./base";

export const boolean = (
  store: Store<"Boolean">
): Abstract.Model<"Boolean"> => ({
  kind: "model",
  name: "Boolean",
  members: {
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
    and: {
      kind: "method",
      delegate: (arg: boolean): boolean => store.read() && arg,
    },
  },
});

// class BooleanField extends Field<"Boolean"> {
//   constructor(field: Abstract.BooleanField) {
//     super(field);

//     this.defineAction("disable", () => false);
//     this.defineAction("enable", () => true);
//     this.defineAction("toggle", () => !this.getValue());

//     this.defineMethod(
//       "and",
//       (argument) => Boolean(this.getValue()) && Boolean(argument)
//     );
//     this.defineMethod("not", () => !this.getValue());
//   }
// }

// class NumberField extends Field<"Number"> {
//   constructor(field: Abstract.NumberField) {
//     super(field);

//     this.defineAction(
//       "add",
//       (argument) => Number(this.getValue() || 0) + Number(argument || 0)
//     );
//     this.defineAction(
//       "multiplyBy",
//       (argument) => Number(this.getValue() || 0) * Number(argument || 0)
//     );

//     this.defineMethod(
//       "isAtLeast",
//       (argument) =>
//         !Number.isNaN(Number(argument)) &&
//         Number(this.getValue() || 0) >= Number(argument || 0)
//     );
//     this.defineMethod(
//       "isExactly",
//       (argument) =>
//         !Number.isNaN(Number(argument)) &&
//         Number(this.getValue() || 0) === Number(argument || 0)
//     );
//   }
// }

// class StringField extends Field<"String"> {
//   constructor(field: Abstract.StringField) {
//     super(field);
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

// class ElementField extends Field<"Renderable"> {
//   constructor(field: Abstract.ElementField) {
//     super(field);
//   }
// }

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
