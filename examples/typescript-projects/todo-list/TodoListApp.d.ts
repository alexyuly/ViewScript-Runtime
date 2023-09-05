import type {
  BooleanModel,
  Dispatching,
  EachOf,
  Event,
  Get,
  Handle,
  Let,
  ListOf,
  MapList,
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
  complete(): Handle<Dispatching<TodoItem, "completed", "enable">>
}

interface TodoItemView extends View {
  properties: {
    model: TodoItem
  }
  components: [
    Tag<"li", {
      click: Handle<
        Dispatching<TodoItemView, "model", "complete">
      >
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
    model: Let<ListOf<TodoItem>, []>
  }
  components: [
    Tag<"main", {
      content: [
        Tag<"form", {
          submit: Handle<
            SubmitModel,
            Dispatching<TodoListApp, "model", "push", {
              text: Get<Get<Event<SubmitModel>, "data">, "text">
            }>
          >
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
          content: MapList<TodoListApp, "model", Tag<TodoItemView, {
            model: EachOf<TodoListApp, "model">
          }>
        }>
      ]
    }>
  ]
}

/*
{
  "__name": "Model",
  "__extension": "TodoItem",
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
