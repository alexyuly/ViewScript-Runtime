import type {
  Call,
  Dispatch,
  Each,
  Event,
  Get,
  Let,
  Model,
  Set,
  Tag,
  Take,
  View,
} from "typescript-markup";

interface TodoItem extends Model {
  text: string
  completed: Let<boolean, false>
  complete(): Set<TodoItem, "completed", true>
}

interface TodoItemView extends View {
  head: {
    model: Take<TodoItem>
  }
  body: [
    Tag<"li", {
      click: Dispatch<TodoItem, "model", "complete">
      content: [
        Tag<"label", {
          content: [
            Tag<"input", { type: "checkbox" }>,
            Get<Get<TodoItemView, "model">, "text">
          ]
        }>
      ]
    }>
  ]
}

export interface TodoListApp extends View {
  head: {
    model: Let<Array<TodoItem>, []>
  }
  body: [
    Tag<"main", {
      content: [
        Tag<"form", {
          submit: Dispatch<TodoListApp, "model", "push", {
            text: Get<Get<Event<"submit">, "data">, "text">
          }>
          content: [
            Tag<"label", {
              content: [
                "Add a new to-do:",
                Tag<"input", { name: "text"; type: "text" }>
              ]
            }>,
            Tag<"button", { type: "submit" }>
          ]
        }>,
        Tag<"ul", {
          content: Call<
            TodoListApp,
            "model",
            "map",
            Tag<TodoItemView, {
              model: Each<TodoListApp, "model">
            }>
          >
        }>
      ]
    }>
  ]
}
