import * as Abstract from "./abstract";

export const booleanModel: Abstract.Model<"Boolean"> = {
  kind: "model",
  name: "Boolean",
  members: {
    disable: {
      kind: "action",
      handler: {
        kind: "atomicAction",
        effect: () => false,
      },
    },
    enable: {
      kind: "action",
      handler: {
        kind: "atomicAction",
        effect: () => true,
      },
    },
    // toggle: {
    //   kind: "action",
    //   handler: {
    //     kind: "atomicAction",
    //     parameter: {
    //       modelName: "Boolean",
    //     },
    //     effect: (base, arg) => !base,
    //   },
    // },
  },
};
