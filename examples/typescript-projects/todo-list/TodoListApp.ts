interface TodoItem extends Contract.Model {
  text: string;
  completed: boolean;
  complete(): Contract.ModelSetState<TodoItem["completed"], true>;
}

interface TodoItemView extends Contract.View {
  parameters: {
    model: TodoItem;
  };
}
