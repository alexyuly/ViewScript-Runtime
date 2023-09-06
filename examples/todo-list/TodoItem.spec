Model TodoItemModel

Take text of string
Let completed be false
Can complete -> completed: enable


View TodoItemView

Take model of TodoItemModel
<li>
  click = model: complete
  padding = "8px 16px"
  display = "flex"
  align-items = "center"
  content = <label>
   content = "TO-DO"
