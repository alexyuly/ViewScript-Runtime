import type {
  BooleanModel,
  Dispatch,
  EachOf,
  Event,
  Get,
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
  complete(): Dispatch<TodoItem, "completed", "enable">
}

interface TodoItemView extends View {
  properties: {
    model: TodoItem
  }
  components: [
    Tag<"li", {
      click: Dispatch<TodoItemView, "model", "complete">
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
    Tag<"main", {
      content: [
        Tag<"form", {
          submit: Dispatch<TodoListApp & SubmitModel, ["model", "push"], {
            text: Get<SubmitModel, ["event", "data", "text"]>
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
          content: Map<
            TodoListApp,
            "model",
            Tag<TodoItemView, {
              model: EachOf<TodoListApp, "model">
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
    "__name": "Handle",
    "__args": [
      "Dispatching",
      ["TodoItem", "\"completed\"", "\"enable\""]
    ],
    "update": {
      "__name": "Dispatching",
      "__args": ["TodoItem", "\"completed\"", "\"enable\""],
      "property": "completed",
      "action": "enable"
    }
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
