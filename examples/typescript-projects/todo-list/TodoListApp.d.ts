import type {
  Call,
  Dispatch,
  Each,
  Event,
  Get,
  Let,
  Model,
  Render,
  Set,
  Take,
  View,
} from "typescript-markup";

interface TodoItem extends Model {
  text: string
  completed: Let<boolean, false>
  complete(): Set<TodoItem, "completed", true>
}

interface TodoItemView extends View {
  props: {
    model: Take<TodoItem>
  }
  components: [
    Render<"li", {
      click: Dispatch<TodoItem, "model", "complete">
      content: [
        Render<"label", {
          content: [
            Render<"input", { type: "checkbox" }>,
            Get<Get<TodoItemView, "model">, "text">
          ]
        }>
      ]
    }>
  ]
}

export interface TodoListApp extends View {
  props: {
    model: Let<Array<TodoItem>, []>
  }
  components: [
    Render<"main", {
      content: [
        Render<"form", {
          submit: Dispatch<TodoListApp, "model", "push", {
            text: Get<Get<Event<"submit">, "data">, "text">
          }>
          content: [
            Render<"label", {
              content: [
                "Add a new to-do:",
                Render<"input", { name: "text"; type: "text" }>
              ]
            }>,
            Render<"button", { type: "submit" }>
          ]
        }>,
        Render<"ul", {
          content: Call<
            TodoListApp,
            "model",
            "map",
            Render<TodoItemView, {
              model: Each<TodoListApp, "model">
            }>
          >
        }>
      ]
    }>
  ]
}
