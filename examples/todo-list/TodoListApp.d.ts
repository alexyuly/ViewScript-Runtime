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
    completed: Let<BooleanModel, false>;
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


View TodoItemView {
  TodoItemModel model

  <li>
    click {
      model.complete
    }
    content = <label>
      content =
      - <input>
          type = "checkbox"
          checked = model.completed
      - <span>
          content = model.text
}


# to be continued...

*/
