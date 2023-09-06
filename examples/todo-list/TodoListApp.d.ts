import type {
  BooleanModel,
  Dispatch,
  Let,
  Model,
  Show,
  StringModel,
  Take,
  View,
} from "../../runtime/lib";

type TodoItemModel = Model<
  "TodoItem",
  {
    text: Take<StringModel>;
    completed: Let<BooleanModel, false>;
    complete(): Dispatch<TodoItem, "completed", "enable">;
  }
>;

type TodoItemView = View<
  "TodoItem",
  {
    model: Take<TodoItemModel>;
  },
  Show<
    "main",
    TodoItemView,
    {
      position: "fixed";
      width: "100%";
      height: "100%";
      padding: "32px";
      font: "16px sans-serif";
      display: "flex";
      "flex-direction": "column";
      "align-items": "center";
    },
    [] // TODO
  >
>;

// export type TodoListApp
