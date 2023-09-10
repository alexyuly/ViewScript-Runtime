import type {
  Action,
  BooleanModel,
  Dispatch,
  Let,
  Field,
  Model,
  Nothing,
  StringModel,
} from "../../runtime/lib";

type TodoItemModel = Model<
  "TodoItemModel",
  {
    properties: {
      text: Field<StringModel>;
      completed: Let<BooleanModel, false>;
      complete: Action<
        Nothing,
        [Dispatch<TodoItemModel, "completed", "enable">]
      >;
    };
  }
>;
