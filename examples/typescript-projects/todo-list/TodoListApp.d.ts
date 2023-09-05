import type {
  BooleanModel,
  Dispatch,
  Each,
  Event,
  Get,
  Iterator,
  Let,
  ListOf,
  Map,
  Model,
  Result,
  StringModel,
  SubmitModel,
  Tag,
  View,
} from "compendium-runtime"

interface TodoItem extends Model {
  text: StringModel
  completed: Let<BooleanModel, false>
  complete(): Dispatch<TodoItem, ["completed", "enable"]>
}

interface TodoItemView extends View {
  properties: {
    model: TodoItem
  }
  components: [
    Tag<"li", TodoItemView, {
      click: Dispatch<TodoItemView, ["model", "complete"]>
      content: Tag<"label", TodoItemView, {
        content: [
          Tag<"input", TodoItemView, {
            border: "1px solid gray"
            "border-radius": "4px"
            font: "24px sans-serif"
            "margin-bottom": "8px"
            padding: "8px"
            type: "checkbox"
          }>,
          Get<TodoItemView, ["model", "text"]>
        ]
      }>
    }>
  ]
}

export interface TodoListApp extends View {
  properties: {
    model: Let<ListOf<TodoItem>, []>
  }
  components: [
    Tag<"main", TodoListApp, {
      content: [
        Tag<"form", TodoListApp, {
          submit: Dispatch<TodoListApp | SubmitModel, ["model", "push"], {
            text: Get<SubmitModel, ["event", "data", "text"]>
          }>
          content: [
            Tag<"label", TodoListApp, {
              content: [
                "Add a new to-do:",
                Tag<"input", TodoListApp, {
                  name: "text"
                  type: "text"
                }>
              ]
            }>,
            Tag<"button", TodoListApp, {
              type: "submit"
            }>
          ]
        }>,
        Tag<"ul", TodoListApp, {
          content: Map<
            TodoListApp | Iterator<TodoItem>
            "model",
            Tag<TodoItemView, TodoListApp, {
              model: Each<Iterator<TodoItem>>
            }>
          >
        }>
      ]
    }>
  ]
}

/*
{
  "__name": "Model",
  "__kind": "TodoItem",
  "text": {
    "__name": "StringModel"
  },
  "completed": {
    "__name": "Let"
    "__args": ["BooleanModel", "false"],
    "model": {
      "__name": "BooleanModel"
    },
    "value": false
  },
  "complete": {
    "__name": "Dispatch",
    "__args": ["TodoItem", "[\"completed\"", "\"enable\"]"],
    "scope": {
      "__name": "Model",
      "__kind": "TodoItem"
    },
    "path": ["completed", "enable"]
  }
}
*/

/*
Model TodoItem

Take text of string
Let completed be false
Can complete -> completed: enable
*/

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
