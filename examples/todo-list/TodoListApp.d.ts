import type {
  ActionHandler,
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
    complete: ActionHandler<
      Nothing,
      [Dispatch<TodoItemModel, "completed", "enable">]
    >;
  }
>;
