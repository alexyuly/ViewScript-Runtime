import type {
  Call,
  Dispatch,
  Each,
  Event,
  Get,
  Let,
  Model,
  Set,
  Take,
  V,
  ValueOf,
  View,
} from "compendium-ts";

interface TodoItem extends Model {
  text: string;
  completed: Let<boolean, false>;
  complete(): Set<TodoItem, "completed", true>;
}

interface TodoItemView extends View {
  props: {
    model: Take<TodoItem>;
  };
  components: [
    V<"li", {
      click: Dispatch<TodoItem, "model", "complete">;
      content: [
        V<"label", {
          content: [
            V<"input", { type: "checkbox" }>,
            Get<ValueOf<TodoItemView, "model">, "text">,
          ];
        }>,
      ];
    }>,
  ];
}

export interface TodoListApp extends View {
  props: {
    model: Let<Array<TodoItem>, []>;
  };
  components: [
    V<"main", {
      content: [
        V<"form", {
          submit: Dispatch<TodoListApp, "model", "push", {
            text: Get<Get<Event<"submit">, "data">, "text">;
          };
          content: [
            V<"label", {
              content: [
                "Add a new to-do:",
                V<"input", { name: "text"; type: "text" }>,
              ];
            }>,
            V<"button", { type: "submit" }>,
          ];
        }>,
        V<"ul", {
          content: Call<
            TodoListApp,
            "model",
            "map",
            V<TodoListItem, {
              model: Each<TodoListApp, "model">;
            }>,
          >;
        }>,
      ];
    }>,
  ];
}
