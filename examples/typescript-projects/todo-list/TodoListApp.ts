import { Model } from "../../../runtime/lib/Model";
import {
  button,
  event,
  field,
  form,
  input,
  label,
  li,
  main,
  model,
  set,
  take,
  ul,
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

const TodoItemViewModel = take<TodoItem>();

const TodoItemView = view(
  TodoItemViewModel,
  li(
    label(
      {
        onClick: TodoItemViewModel.complete(),
      },
      [
        input({
          type: "checkbox",
          checked: TodoItemViewModel.completed(),
        }),
        TodoItemViewModel.text(),
      ]
    )
  )
);

const TodoListAppModels = field<Array<TodoItem>>([]);

export const TodoListApp = view(
  TodoListAppModels,
  main([
    form(
      {
        onSubmit: TodoListAppModels.push(
          new TodoItemModel({
            text: event().data().text(),
          })
        ),
      },
      [
        label([
          "Add a new to-do:",
          input({
            name: "text",
            type: "text",
          }),
        ]),
        button({
          type: "submit",
        }),
      ]
    ),
    ul(TodoListAppModels.map().to().view()),
  ])
);
