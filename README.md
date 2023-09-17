# ViewScript

**ViewScript** is a modern programming language for building user interface applications in web browsers.

It's simple to define a view that renders a paragraph:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

You can do something when it's clicked:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
      click {
         window.alert "You clicked me!"
      }
}
```

Conditionally control what users see, based on events:

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

Style and nest the elements in your view:

```
View HelloWorld {
   Condition hovered : false

   <main>
      position = "fixed"
      width = "100%"
      height = "100%"
      display = "flex"
      justify-content = "center"
      align-items = "center"
      content = <p>
         content = if hovered then "You hovered me!" else "Hello, world!"
         color = if hovered then "blue"
         font-weight = if hovered then "bold"
         pointerover {
            hovered.enable
         }
         pointerleave {
            hovered.disable
         }
}
```
