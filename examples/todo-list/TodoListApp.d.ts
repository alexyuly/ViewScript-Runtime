import type {
  ActionRef,
  ActionHandler,
  BooleanModel,
  Dispatch,
  FieldRef,
  Let,
  Model,
  Nothing,
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
    complete: ActionHandler<
      Nothing,
      [Dispatch<ActionRef<FieldRef<TodoItemModel, "completed">, "enable">>]
    >;
  }
>;
