import type {
  ActionHandled,
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
    methods: {
      text: Field<StringModel>;
      completed: Let<BooleanModel, false>;
    };
    actions: {
      complete: ActionHandled<
        Nothing,
        [Dispatch<TodoItemModel, "completed", "enable">]
      >;
    };
  }
>;
