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
    complete: Control<Field<TodoItemModel, "completed">, "enable">;
  }
>;

/*

# ViewScript implementation:

Model TodoItemModel {
  String text
  Boolean completed = false
  
  Action complete {
    completed.enable
  }
}

*/
