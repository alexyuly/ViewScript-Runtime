import type {
  Action,
  BooleanModel,
  Dispatch,
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
    complete: Action<null, [Dispatch<TodoItemModel, "completed", "enable">]>;
  }
>;

// type TodoItemView = View<
//   "TodoItemView",
//   {
//     model: Take<TodoItemModel>;
//   },
//   Show<
//     "li",
//     TodoItemView,
//     {
//       click: Dispatch<TodoItemView, "model", "complete">;
//       padding: "8px 16px";
//       display: "flex";
//       "align-items": "center";
//     },
//     Show<
//       "label",
//       TodoItemView,
//       {},
//       [] // TODO
//     >
//   >
// >;

// export type TodoListApp = View<
//   "TodoListApp",
//   {
//     model: Let<Many<TodoItemModel>>;
//   },
//   Show<
//     "main",
//     TodoListApp,
//     {
//       position: "fixed";
//       width: "100%";
//       height: "100%";
//       padding: "32px";
//       font: "16px sans-serif";
//       display: "flex";
//       "flex-direction": "column";
//       "align-items": "center";
//     },
//     [] // TODO
//   >
// >;
