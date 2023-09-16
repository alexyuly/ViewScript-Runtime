import type {
  BooleanModel,
  Control,
  Field,
  Let,
  Model,
  StringModel,
  Take,
} from "../../runtime/lib";

type TodoItemModel = Model<
  "TodoItemModel",
  {
    text: Take<StringModel>;
    completed: Let<BooleanModel>;
    // completed: Let<BooleanModel, false>;
    complete: Control<Field<TodoItemModel, "completed">, "enable">;
  }
>;
