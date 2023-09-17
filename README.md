# Compendium

Compendium is an opinionated toolkit for building web apps. Enter the walled garden, and enjoy the fruits of knowledge! 🏡🍎💡

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

### Model-View-Task Architecture

ViewScript supports a familiar but evolved paradigm for building user interface applications: Model-View-_Task_. Note the replacement of our traditional "controller" with _task_. In legacy UI application codebases, controllers tend to become bloated behemoths, juggling responsibilities of preparing data for views, synchronizing views and models, managing data retrieval and storage, and anything else that doesn't fall neatly into the "view" and "model" paradigms.
