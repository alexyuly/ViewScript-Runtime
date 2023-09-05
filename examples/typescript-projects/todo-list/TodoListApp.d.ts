import type { Model, ModelSetState, View, ViewInstance } from "../../../runtime/lib/Contract";

interface TodoItem extends Model {
  text: string;
  completed: boolean;
  complete(): ModelSetState<TodoItem["completed"], true>;
}

interface TodoItemView extends View {
  references: { model: TodoItem };
  components: [
    ViewInstance<"li", {
      click: ReturnType<TodoItem["complete"]>,
    }, {
      content: [
        ViewInstance<"label", {}, {
          content: [
            ViewInstance<"input", {}, { type: "checkbox" }>,
            TodoItemView["references"]["model"]["text"],
          ];
        }>,
      ];
    }>,
  ];
}

export interface TodoListApp extends View {
  references: { model: TodoItem[] };
  components: [
    ViewInstance<"main", {}, {
      content: [
        ViewInstance<"form", {
          // submit: 
        }>,
        ViewInstance<"ul">
      ]
    }>
  ];
}
