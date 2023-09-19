# ViewScript

**ViewScript** is a modern language for building browser-based web apps.

### Examples

#### 🧙 Show a paragraph with text content:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

##### 💡 Tips

Curly braces surround a procedure, which is a sequence of steps to perform in order. In this example, there is just one step, to construct an HTML paragraph element.

To construct an HTML element, use `<tag-name>`, followed by an indented list of properties.

A property binds the given field or action to an object's input or output:

- A parent object sends data from a field, down through a child's input, to control the child's behavior.
- Conversely, a child object sends data up through its own output, into an action, to notify its parent of an event.

#### 💁 Show an alert when a button is clicked:

```
View ClickMe {
   <button>
      content = "Please click me"
      click = window.alert "You clicked me!"
}
```

#### 🧑‍🔬 Show different text content conditionally, while an element is hovered:

```
View HoverMe {
   Condition hovered = false

   <div>
      content = if hovered then "You hovered me!" else "Hover me"
      pointerover = hovered.enable
      pointerleave = hovered.disable
}
```

#### 🧑‍🎨 Style two elements, and nest one inside another:

```
View StylishHello {
   <main>
      content = <p>
         content = "Hello, world!"
         font = "24px serif bold"
         padding = "24px"

      align-items = "center"
      display = "flex"
      height = "100%"
      justify-content = "center"
      padding = "24px"
      position = "fixed"
      width = "100%"
}
```

##### 💡 Tips

Pass styles as properties to HTML elements. Skip the classes and selectors, and directly specify CSS properties for each element.

#### 👷 Model complex data types and their behaviors:

```
Model TodoItem {
   Text content
   Condition completed = false
   Action complete = completed.enable
}
```

#### 🧑‍🏭 Use a data model to render an interactive view:

_Or, "Data? Tada!"_

```
View TodoItemView {
   TodoItem data

   <li>
      content = <label>
         content =
         -- <input>
               checked = data.completed
               type = "checkbox"

         -- data.content

      click = data.complete
}
```

#### 🧑‍🍳 Conjure a simple to-do list app, using TodoItem and TodoItemView:

```
View TodoListForm {
   Output submit TodoItem

   <form>
      content =
      -- <input>
            name = "content"
            placeholder = "Add a new to-do..."
            type = "text"

      -- <button>
            type = "submit"

      display = "flex"
      align-items = "center"

      submit = for event:
         submit TodoItem
            content = event.values.content
}


View TodoListApp {
   List TodoItem data

   <main>
      content =
      -- TodoListForm
            submit = for todo-item:
               data.unshift todo-item

      -- <ul>
            content = data.map for todo-item:
               TodoItemView
                  data = todo-item

      display = "flex"
      flex-direction = "column"
      gap = "24px"
}
```
