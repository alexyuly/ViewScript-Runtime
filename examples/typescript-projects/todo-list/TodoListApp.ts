import {
  can,
  event,
  fieldOf,
  form,
  input,
  instance,
  instanceOf,
  label,
  li,
  listOf,
  main,
  methodOf,
  model,
  prop,
  renders,
  store,
  string,
  to,
  ul,
  update,
  valueOf,
  view,
  viewOf,
} from "compendium";

view(
  "To-do List",
  store("to-dos", listOf(instanceOf("To-do Item"))),
  main({
    content: [
      form({
        onSubmit: update("to-dos").push(
          fieldOf("To-do Item", {
            text: event().get("data", "text"),
          })
        ),
        content: [
          label({
            content: [
              "Add a new to-do:",
              input({
                name: "text",
                type: "text",
              }),
            ],
          }),
        ],
      }),
      ul({
        content: methodOf("to-dos").map(to("view")),
      }),
    ],
  })
);

view(
  "To-do Item",
  prop("model", instanceOf("To-do Item")),
  li({
    content: [
      label({
        content: [
          input({
            checked: valueOf("model").get("completed"),
            type: "checkbox",
          }),
          valueOf("model").get("text"),
        ],
      }),
    ],
  })
);

model(
  "To-do Item",
  prop("text", string()),
  store("completed", false),
  can("complete", update("completed").enable()),
  renders(
    "view",
    viewOf("To-do Item", {
      model: instance(),
    })
  )
);
