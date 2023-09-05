import type {
  Dispatch,
  Each,
  Event,
  Get,
  Let,
  Model,
  Retrieve,
  Tag,
  View,
} from "typescript-markup";


/*
Model TodoItem

Take text of string
Let completed be false
Can complete -> completed: enable
*/

interface TodoItem extends Model {
  text: string
  completed: Let<boolean, false>
  complete(): Dispatch<TodoItem, "completed", "enable">
}


/*
View TodoItemView

Take model of TodoItem

<li>
  click -> model: complete
  content = <label>
    content =
    - <input>
        type = "checkbox"
    - model.text
*/

interface TodoItemView extends View {
  head: {
    model: TodoItem
  }
  body: [
    Tag<"li", {
      click: Dispatch<TodoItem, "model", "complete">
      content: Tag<"label", {
        content: [
          Tag<"input", { type: "checkbox" }>,
          Get<Get<TodoItemView, "model">, "text">
        ]
      }>
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
          content: Retrieve<
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
