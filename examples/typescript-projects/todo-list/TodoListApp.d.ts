import type {
  BooleanModel,
  Dispatch,
  Each,
  Event,
  Get,
  Let,
  List,
  Model,
  Retrieve,
  StringModel,
  Tag,
  View,
} from "typescript-markup";


/*
Model TodoItem

Take text of string
Let completed be false
Can complete -> completed: enable
*/

/*
{
  "__name": "TodoItem",
  "__extends": "Model",
  "text": {
    "__type": "StringModel"
  },
  "completed": {
    "__type": "Let",
    "type": "BooleanModel",
    "value": false
  },
  "complete": {
    "__type": "Dispatch",
    "property": "completed",
    "operator": "enable"
  }
}
*/

interface TodoItem extends Model {
  text: StringModel
  completed: Let<BooleanModel, false>
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
        border = "1px solid gray"
        border-radius = "4px"
        font = "24px sans-serif"
        margin-bottom = "8px"
        padding = "8px"
        type = "checkbox"

    - model.text
*/

interface TodoItemView extends View {
  properties: {
    model: TodoItem
  }
  components: [
    Tag<"li", {
      click: Dispatch<TodoItem, "model", "complete">
      content: Tag<"label", {
        content: [
          Tag<"input", {
            border: "1px solid gray"
            "border-radius": "4px"
            font: "24px sans-serif"
            "margin-bottom": "8px"
            padding: "8px"
            type: "checkbox"
          }>,
          Get<Get<TodoItemView, "model">, "text">
        ]
      }>
    }>
  ]
}


export interface TodoListApp extends View {
  properties: {
    model: Let<List<TodoItem>, []>
  }
  components: [
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
                Tag<"input", {
                  name: "text"
                  type: "text"
                }>
              ]
            }>,
            Tag<"button", {
              type: "submit"
            }>
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
