# ViewScript

**ViewScript** is a modern programming language for building user interface applications in web browsers.

Render a paragraph with text content:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

Show an alert when a paragraph is clicked:

```
View HelloWorld {
   <p>
      click {
         window.alert "You clicked me!"
      }

      content = "Hello, world!"
}
```

Use conditional state to choose which content is rendered, and update the state when pointer events happen:

```
View HelloWorld {
   Condition hovered : false

   <p>
      pointerover {
         hovered.enable
      }

      pointerleave {
         hovered.disable
      }

      content = if hovered then "You hovered me!" else "Hello, world!"
}
```

Style and nest elements 

```
View HelloWorld {
   <main>
      position = "fixed"
      width = "100%"
      height = "100%"

      display = "flex"
      justify-content = "center"
      align-items = "center"
      padding = "24px"

      content = <p>
         padding = "24px"
         font = "24px serif bold"

         content = "Hello, world!"
}
```
