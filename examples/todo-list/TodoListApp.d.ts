import type {
  BooleanModel,
  Control,
  Field,
  Let,
  Model,
  Produce,
  Render,
  StringModel,
  Take,
  View
} from "../../runtime/lib";

type TodoItemModel = Model<
  "TodoItemModel",
  {
    text: Take<StringModel>;
    completed: Let<BooleanModel, false>;
    complete: Control<Field<TodoItemModel, "completed">, "enable">;
  }
>;

type TodoItemView = View<
  "TodoItemView",
  {
    model: Take<TodoItemModel>;
  },
  Render<
    "li",
    {
      click: Control<Field<TodoItemView, "model">, "complete">;
      content: Render<
        "label",
        {
          content: [
            Render<
              "input",
              {
                type: "checkbox";
                checked: Produce<Field<TodoItemView, "model">, "completed">;
              }
            >,
            Render<
              "span",
              {
                content: Produce<Field<TodoItemView, "model">, "text">;
              }
            >
          ]
        }
      >
    }
  >
>;

/*

# ViewScript implementation:

# curly braces denote procedural code, which is...
# either 1) the declaration of a type
# or     2) the execution of actions

# instantiating a type simply requires
# the type name followed by
# an indented property list

# views are autonomous...
# you can't use references to them
# you can just instantiate them, and then
# either: 1) set them as children in a view type declaration
# or:     2) pass them into a property list

# models are manual...
# you can use references to them
# you can instantiate them and pass them around pretty freely

Model TodoItemModel {
  String text

  Boolean completed = false

  Action complete {
    completed.enable
  }
}


View TodoItemView {
  TodoItemModel model

  <li>
    click {
      model.complete
    }
    content = <label>
      content =
      - <input>
          type = "checkbox"
          checked = model.completed
      - <span>
          content = model.text
}


*/
