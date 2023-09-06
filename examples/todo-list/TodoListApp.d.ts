import type {
  BooleanModel,
  Dispatch,
  Let,
  Model,
  StringModel,
  Take,
} from "../../runtime/lib";

type TodoItem = Model<
  "TodoItem",
  {
    text: Take<StringModel>;
    completed: Let<BooleanModel, false>;
    complete(): Dispatch<TodoItem, "completed", "enable">;
  }
>;

// type TodoItemView

// export type TodoListApp
