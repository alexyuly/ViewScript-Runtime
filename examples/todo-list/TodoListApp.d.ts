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
