# ViewScript

🏗️ **ViewScript** is a modern language for web apps that compiles into HTML and JavaScript.

ℹ️ Please install [Node.js 18](https://nodejs.org) to use ViewScript.

## Start

1. Install ViewScript

```
npm install viewscript --global
```

2. Create a new project

```
viewscript project HelloWorld
```

3. Run your app

```
cd HelloWorld && npm start
```

## HelloWorld

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

`<p>` is a paragraph element. It has an input named `content`, bound to a text field.

## Log when button clicked

```
View `Log when button clicked` {
   <button>
      content = "Click me!"
      click = window.console.log "You clicked the button."
}
```

`<button>` is a button element. It has an output named `click`, bound to an action.

## Update section while hovered

```
View `Update section while hovered` {
   Condition hovered = false

   <section>
      background = if hovered then "black" else "white"
      color = if hovered then "white" else "black"
      content = if hovered then "I am hovered." else "Hover me!"
      font = "24px serif bold"
      padding = "24px"
      pointerleave = hovered.disable
      pointerover = hovered.enable
}
```

`hovered` is a condition field with a name, which allows it to be referenced repeatedly.
