import type {
  BooleanModel,
  ComplexModel,
  Let,
  StringModel,
} from "../../runtime/lib/Runtime"

interface TodoItem extends ComplexModel {
  text: StringModel
  completed: Let<BooleanModel, false>
  // complete(): Dispatch<TodoItem, ["completed", "enable"]>
}

// interface TodoItemView extends View {
//   properties: {
//     model: TodoItem
//   }
//   components: [
//     Tag<"li", TodoItemView, {
//       click: Dispatch<TodoItemView, ["model", "complete"]>
//       content: Tag<"label", TodoItemView, {
//         content: [
//           Tag<"input", TodoItemView, {
//             border: "1px solid gray"
//             "border-radius": "4px"
//             font: "24px sans-serif"
//             "margin-bottom": "8px"
//             padding: "8px"
//             type: "checkbox"
//           }>,
//           Get<TodoItemView, ["model", "text"]>
//         ]
//       }>
//     }>
//   ]
// }

// export interface TodoListApp extends View {
//   properties: {
//     model: Let<ListOf<TodoItem>, []>
//   }
//   components: [
//     Tag<"main", TodoListApp, {
//       content: [
//         Tag<"form", TodoListApp, {
//           submit: Dispatch<TodoListApp | SubmitModel, ["model", "push"], {
//             text: Get<SubmitModel, ["event", "data", "text"]>
//           }>
//           content: [
//             Tag<"label", TodoListApp, {
//               content: [
//                 "Add a new to-do:",
//                 Tag<"input", TodoListApp, {
//                   name: "text"
//                   type: "text"
//                 }>
//               ]
//             }>,
//             Tag<"button", TodoListApp, {
//               type: "submit"
//             }>
//           ]
//         }>,
//         Tag<"ul", TodoListApp, {
//           content: ListFromMap<
//             TodoListApp | Iterator<TodoItem>,
//             "model",
//             Tag<TodoItemView, TodoListApp, {
//               model: Each<Iterator<TodoItem>>
//             }>
//           >
//         }>
//       ]
//     }>
//   ]
// }
