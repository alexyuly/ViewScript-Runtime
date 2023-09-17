# Compendium

## ViewScript

**ViewScript** is a modern programming language for building user interface applications in web browsers.

🪄 It's simple to declare a view that renders a welcoming paragraph:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

✨ Let's make things interactive!

```
View HelloWorld {
   <p>
      content = "Hello, world!"
      click {
         window.alert "You clicked me!"
      }
}
```

🤔 What about stateful behavior?

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

💅 Nice! Let's add some razzle dazzle

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
🙌 Easy peasy!

## Compendium Core Language

## Compendium Runtime
