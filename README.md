# ViewScript

**ViewScript** is a modern programming language for building browser-based web applications.

🧙 Render a paragraph with text content:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

💁 Show an alert when a paragraph is clicked:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
      click {
         window.alert "You clicked me!"
      }
}
```

🧑‍🔬 Use conditional state to choose which content is rendered, and update the state when pointer events happen:

```
View HelloWorld {
   Condition hovered : false

   <p>
      content = if hovered then "You hovered me!" else "Hello, world!"
      pointerover {
         hovered.enable
      }
      pointerleave {
         hovered.disable
      }
}
```

🧑‍🎨 Style and nest elements:

```
View HelloWorld {
   <main>
      content = <p>
         content = "Hello, world!"
         padding = "24px"
         font = "24px serif bold"
      position = "fixed"
      width = "100%"
      height = "100%"
      display = "flex"
      justify-content = "center"
      align-items = "center"
      padding = "24px"
}
```
