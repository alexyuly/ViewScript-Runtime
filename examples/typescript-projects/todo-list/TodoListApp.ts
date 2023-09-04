import {
  action,
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
  model,
  prop,
  renders,
  store,
  string,
  valueOf,
  view,
  viewOf,
} from "compendium";

view(
  "To-do List",
  store("to-dos", listOf(instanceOf("To-do Item"))),
  form({
    onSubmit: action("to-dos").push(
      fieldOf("To-do Item", {
        text: event().get("data", "text"),
      })
    ),
    content: [],
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
  can("complete", action("completed").enable()),
  renders(
    "view",
    viewOf("To-do Item", {
      model: instance(),
    })
  )
);
