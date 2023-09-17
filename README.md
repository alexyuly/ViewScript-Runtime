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
         }ke 
         pointerleave {
            hovered.disable
         }
}
```
🙌 Easy peasy!

### Model-View-Task Architecture

ViewScript supports a familiar but evolved paradigm for building user interface applications: Model-View-_Task_. Here, we reject traditional controllers in favor of focused _tasks_.

In legacy UI application codebases, controllers tend to become sprawling, bloated behemoths. They juggle responsibilities of preparing data for views, synchronizing views and models, managing data retrieval and storage, and anything else that doesn't fall neatly into the "view" and "model" paradigms.

In ViewScript code, models prepare the data, the framework synchronizes it with views (which render it), and tasks take charge of async behavior beyond the core model-view relationship. Procedural code is embraced where useful but strictly limited, and typing is rock solid: it flows beyond data, into views and tasks, and throughout your apps. So much setup is moved from runtime to compile time, which boosts efficiency and stability.
