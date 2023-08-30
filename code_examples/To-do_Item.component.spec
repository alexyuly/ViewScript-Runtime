Component `To-do Item`

Take model of `to-do item`

Create <li>
  content = <label>
    content =
    - <input>
        checked = model.completed
        type = "checkbox"
    - Model.text
    On click
      Model: complete
