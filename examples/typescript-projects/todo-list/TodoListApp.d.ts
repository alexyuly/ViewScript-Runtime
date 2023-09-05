import type {
  BooleanModel,
  Dispatching,
  EachOf,
  Event,
  Get,
  Handle,
  Let,
  ListOf,
  Model,
  Reduce,
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
      click: Handle<Dispatching<TodoItem, "model", "complete">>
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
          content: Reduce<
            TodoListApp,
            "model",
            Let<ListOf<Tag<TodoItemView>>, []>,
            Dispatching<
              Result<ListOf<Tag<TodoItemView>>>,
              "push",
              Tag<TodoItemView, {
                model: EachOf<TodoListApp, "model">
              }>
            >
          >
        }>
      ]
    }>
  ]
}

/*
{
  "__name": "TodoItem",
  "__extends": "Model",
  "text": {
    "__type": "StringModel"
  },
  "completed": {
    "__type": "Let",
    "model": {
      "__type": "BooleanModel"
    },
    "value": false
  },
  "complete": {
    "__type": "Handle",
    "update": {
      "__type": "Dispatching",
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
