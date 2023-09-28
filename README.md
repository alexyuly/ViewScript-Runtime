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

## Examples

### HelloWorld

ViewScript:
```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

ViewScript-Bridge:
```ts
view("HelloWorld", [
    element("p", {
        content: "Hello, world!"
    })
])
```

`<p>` is a paragraph element. It has an input named `content`, bound to a text field.

### Log when button clicked

ViewScript:
```
View `Log when button clicked` {
   <button>
      content = "Click me!"
      click = window.console.log "You clicked the button."
}
```

ViewScript-Bridge:
```ts
view("Log when button clicked", [
    element("button", {
        content: "Click me!",
        click: $("window.console.log", "You clicked the button.")
    })
])
```

`<button>` is a button element. It has an output named `click`, bound to an action.

### Update section while hovered

ViewScript:
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

ViewScript-Bridge:
```ts
view("Update section while hovered", [
    condition("hovered", false),
    element("section", {
        background: conditional($('hovered'), "black", "white"),
        color: conditional($('hovered'), "white", "black"),
        content: conditional($('hovered'), "I am hovered.", "Hover me!"),
        font: "24px serif bold",
        padding: "24px",
        pointerleave: $("hovered.disable"),
        pointerover: $("hovered.enable")
    })
])
```

`hovered` is a condition field with a name, which allows it to be referenced repeatedly.

## Architecture

### ViewScript-Runtime

`ViewScript-Runtime` is the core runtime executable for web browsers, with zero dependencies.

### ViewScript-Bridge

`ViewScript-Bridge` is an ergonomic TypeScript API for using ViewScript incrementally in your existing projects.

_It depends on ViewScript-Runtime._

### ViewScript

`ViewScript` is the Node.js developer interface for creating new purely ViewScript projects.

_It depends on ViewScript-Runtime._
