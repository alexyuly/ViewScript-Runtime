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

🧑‍🔬 Show different text content conditionally, while a paragraph is hovered:

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

🧑‍🎨 Style elements and nest one inside another:

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
