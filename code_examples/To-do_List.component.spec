Component `To-do List`

Let to-dos be new list of `to-do item`

Create <form> of `to-do item`
  content =
  - <label>
      content =
      - "New To-do:"
      - <input>
          name = "text"
          type = "text"
  - <button>
      content = "Add to list"
      type = "submit"
  On submit
    To-dos: push new `to-do item`
      text = it.data.text

Create <ul>
  content = to-dos: map to view
