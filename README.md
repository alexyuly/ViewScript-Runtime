# ViewScript

**ViewScript** is a modern programming language for building browser-based web applications.

### Examples

#### 🧙 Show a paragraph with text content:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

##### 💡 Tips

Curly braces surround an ordered sequence of steps. In this example, there is just one step, to construct an HTML paragraph element.

To construct an HTML element, use `<tag-name>`, followed by an indented list of properties.

A property binds the given field or action to an object's input or output:

- A parent object sends data from a field, down through a child's input, to control the child's behavior.
- Conversely, a child object sends data from a field, up through its own output, to notify its parent of an event.

#### 💁 Show an alert when a button is clicked:

```
View HelloWorld {
   <button>
      content = "Please click me"
      click = window.alert "You clicked me!"
}
```

#### 🧑‍🔬 Show different text content conditionally, while an element is hovered:

```
View HelloWorld {
   Condition hovered = false

   <div>
      content = if hovered then "You hovered me!" else "Hover me"
      pointerover = hovered.enable
      pointerleave = hovered.disable
}
```

#### 🧑‍🎨 Style two elements, and nest one inside another:

```
View HelloWorld {
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

#### 👷 Model complex data types and their behaviors:

```
Model TodoItem {
   Text content
   Condition completed = false
   Action complete = completed.enable
}
```

#### 🧑‍🏭 Use a data model to render a simple user interface:

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
