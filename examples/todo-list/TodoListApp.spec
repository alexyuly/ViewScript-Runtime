# ViewScript implementation:

# curly braces denote procedural code, which is...
# either 1) the declaration of a type
# or     2) the execution of actions

# instantiating a type simply requires
# the type name followed by
# an indented property list

# views are autonomous...
# you can't use references to them
# you can just instantiate them, and then
# either: 1) render them in a view type declaration
# or:     2) pass them into a property list

# models are manual...
# you can use references to them
# you can instantiate them and pass them around pretty freely


Model TodoItemModel {
  String text

  Boolean completed : false

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
