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

**HelloWorld** is a view, with one paragraph element, with content of "Hello, world!".

`<p>` is a paragraph element. It has one input named `content`, bound to a text field.

## Click a button to log

```
View `Click a button to log` {
   <button>
      content = "Click me!"
      click = window.console.log "You clicked the button."
}
```

**"Click a button to log"** is a view, with one button element, with content of "Click me!" and click handled by console logging "You clicked the button.".
