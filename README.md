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

## Hello, World!

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

HelloWorld is a view, with one paragraph element, with content of "Hello, world!"
