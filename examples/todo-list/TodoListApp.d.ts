import type {
  ActionRef,
  BooleanModel,
  Dispatch,
  FieldRef,
  Let,
  Model,
  StringModel,
  Take,
} from "../../runtime/lib";

type TodoItemModel = Model<
  "TodoItemModel",
  {
    text: Take<StringModel>;
    // TODO get the initial value (2nd param) for Let working:
    // completed: Let<BooleanModel, false>;
    completed: Let<BooleanModel>;
    complete: Dispatch<
      ActionRef<FieldRef<TodoItemModel, "completed">, "enable">
    >;
  }
>;
