import type {
  BooleanModel,
  Dispatch,
  Let,
  Model,
  StringModel,
} from "../../runtime/lib";

type TodoItem = Model<
  "TodoItem",
  {
    text: StringModel;
    completed: Let<BooleanModel, false>;
    complete(): Dispatch<TodoItem, "completed", "enable">;
  }
>;

// type TodoItemView

// export type TodoListApp
