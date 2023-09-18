# ViewScript

**ViewScript** is a modern programming language for building browser-based web applications.

🧙 Render a paragraph with text content:

```
View HelloWorld {
    <p>
        content = "Hello, world!"
}
```

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

🧑‍🏭 Render a widget that shows and controls aspects of a data model:

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
