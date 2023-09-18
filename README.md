# ViewScript

**ViewScript** is a modern programming language for building browser-based web applications.

🧙 Render a paragraph with text content:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

> 💡
> Curly braces enclose a unit of functionality defined by an ordered sequence of steps. In this case, it's the definition of a view.
> 
> Render an HTML element in a snap by putting its tag name inside angle brackets, like `<p>`, for a paragraph.
> 
> The equals sign denotes a binding of a field to a property. In this case, it binds the constant text value `"Hello, world!"` to the paragraph element's `content` property.

💁 Show an alert when a button is clicked:

```
View HelloWorld {
   <button>
      content = "Please click me"

      click {
         window.alert "You clicked me!"
      }
}
```

> 💡
> Handle events by binding them to actions. In this case, an action that controls the built-in JavaScript `window.alert` function is bound to the button's `click` event.
> 
> You don't need parentheses to pass an argument to an action. Just put a value after an action's name. Actions never accept more than one argument, so don't worry about commas.

🧑‍🔬 Show different text content conditionally, while an element is hovered:

```
View HelloWorld {
   Condition hovered : false

   <div>
      content = if hovered then "You hovered me!" else "Hover me"

      pointerover {
         hovered.enable
      }

      pointerleave {
         hovered.disable
      }
}
```

🧑‍🎨 Style two elements, and nest one inside another:

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

👷 Model complex data types and their behaviors:

```
Model TodoItem {
   Text content
   Condition completed : false

   Action complete {
      completed.enable
   }
}
```

🧑‍🏭 Define a view that renders and controls aspects of a data model:

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

      click {
         data.complete
      }
}
```
