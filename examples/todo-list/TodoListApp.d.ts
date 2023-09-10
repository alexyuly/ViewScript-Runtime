import type {
  ActionHandled,
  BooleanModel,
  Dispatch,
  Field,
  Let,
  Model,
  Nothing,
  StringModel,
} from "../../runtime/lib";

type TodoItemModel = Model<
  "TodoItemModel",
  {
    text: Field<StringModel>;
    completed: Let<BooleanModel, false>;
    complete: ActionHandled<
      Nothing,
      [Dispatch<TodoItemModel, "completed", "enable">]
    >;
  }
>;
