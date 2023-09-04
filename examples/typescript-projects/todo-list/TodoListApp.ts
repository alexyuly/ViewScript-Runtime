import { Model } from "../../../runtime/lib/Model";
import {
  action,
  button,
  chain,
  form,
  input,
  label,
  li,
  main,
  method,
  model,
  set,
  store,
  take,
  ul,
  valueOf,
  view,
} from "../../../runtime/lib/ergonomic";

interface TodoItem extends Model {
  text: string;
  completed: boolean;
  complete(): void;
  view(): typeof TodoItemView;
}

const TodoItemModel = model<TodoItem>({
  completed: false,
  complete: set<TodoItem["completed"]>(true),
});

const TodoItemView = view(
  take<TodoItem>("model"),
  li({
    content: label({
      content: [
        input({
          type: "checkbox",
          checked: valueOf("model"),
        }),
        valueOf("model", "text"),
      ],
    }),
  })
);

export const TodoListApp = view(
  store<Array<TodoItem>>("to-dos"),
  main({
    content: [
      form({
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
          button({
            onClick: action(
              "to-dos",
              "push",
              TodoItemModel.new({
                text: valueOf("event", "data", "text"),
              })
            ),
            type: "submit",
          }),
        ],
      }),
      ul({
        content: method("to-dos", "map", chain("view")),
      }),
    ],
  })
);
