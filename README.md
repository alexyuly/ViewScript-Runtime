# ViewScript

_See what web apps are missing._

## Start

```
npm install viewscript --global
&&
viewscript create YourProjectName
&&
cd YourProjectName
&&
npm start
```

### Alternative: Use ViewScript-Bridge

Target the ViewScript-Runtime using an ergonomic TypeScript API.

📙 [**ViewScript-Bridge: Start**](https://github.com/alexyuly/ViewScript-Bridge#readme)

## Examples

### HelloWorld

```
View HelloWorld {
   <p>
      content = "Hello, world!"
      font = "18px cursive"
      margin = "0 0 24px"
}
```

### Log when button clicked

```
View `Log when button clicked` {
   <button>
      background = "whitesmoke"
      border = "1px solid gainsboro"
      border-radius = "4px"
      click = browser.console.log "You clicked the button."
      content = "Click me!"
      cursor = "pointer"
      font-size = "18px"
      margin = "0 0 24px"
      padding = "12px"
}
```

### Update section while hovered

```
View `Update section while hovered` {
   Condition hovered = false

   <section>
      background = if hovered then "black" else "white"
      border = "1px solid black",
      color = if hovered then "white" else "black"
      content = if hovered then "I am hovered." else "Hover me!"
      font = "bold 24px serif"
      margin = "0 0 24px"
      padding = "24px"
      pointerleave = hovered.disable
      pointerover = hovered.enable
}
```
