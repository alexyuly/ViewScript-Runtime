import type {
  BooleanModel,
  Control,
  Let,
  Model,
  OfField,
  StringModel,
  Take,
} from "../../runtime/lib";

type TodoItemModel = Model<
  "TodoItemModel",
  {
    text: Take<StringModel>;
    completed: Let<BooleanModel>; // TODO How do I get the `, true` parameter working?
    complete: Control<OfField<TodoItemModel, "completed">, "enable">;
  }
>;
