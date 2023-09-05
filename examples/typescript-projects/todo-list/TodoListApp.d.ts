import type { Dispatch, Let, Model, Set, Take, V, ValueOf, View } from "compendium-ts";

interface TodoItem extends Model {
  text: string;
  completed: Let<boolean, false>;
  complete(): Set<TodoItem["completed"], true>;
}

interface TodoItemView extends View {
  properties: {
    model: Take<TodoItem>;
  };
  components: [
    V<"li", {
      click: Dispatch<TodoItem["complete"]>,
      content: [
        V<"label", {
          content: [
            V<"input", { type: "checkbox" }>,
            ValueOf<TodoItemView["model"]>,
          ];
        }>,
      ];
    }>,
  ];
}

export interface TodoListApp extends View {
  properies: {
    model: Let<Array<TodoItem>, []>;
  };
  components: [
    V<"main", {}, {
      content: [
        V<"form">,
        V<"ul">,
        // TODO...
      ],
    }>,
  ];
}
