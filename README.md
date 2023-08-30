# The Compendium

**Welcome to the Compendium!**

From here, you will embark on a magical journey, _building apps for web browsers_, in an integrated tool with everything you need for victory. 

🧙🪄✨💖🌺

## Motivation

HTML, CSS, and JavaScript are amazing tools, and web browsers are a viable platform for building and distributing apps worldwide.

_But the web has a problem. An elephant in the room, maybe._

That elephant is JavaScript. 🐘

For a decade or so, web app developers have increasingly embraced JavaScript as the cornerstone of their process, above HTML and CSS. It's natural, right? Apps may have really complex logic. Apps need to do things and have side effects. HTML and CSS, as languages, fall far short of providing the tools needed to build standalone apps for web browsers. HTML and CSS were designed for a world where all web apps were thin shells, fully controlled by servers. They were designed to present static content once to a user, and only to update upon navigation or reload.

Now, JavaScript's continual gains in capability and performance have made HTML and CSS tools in a dynamic runtime toolkit for web-based application development. Technically, the DOM, CSSOM, and JavaScript fit together like perfect puzzle pieces. But JavaScript, as a language, is unwieldly for wrangling the elements and styles of an app. These elements and styles need continual babysitting, to keep them updated when parameters change. Vanilla JavaScript fails resoundingly at the task of maintaining large web apps over long time periods by evolving development teams. It's where consistent business logic and fast performance go to die.

_TODO more... ✏️_

## High-Level

### Identifiers

Each `[identifier]` is delimited by whitespace, case insensitive, and:
- if enclosed by backticks, then any characters except line breaks and backticks;
- else, a case-insensitive sequence of characters including a-z and hyphens.

## Components 🧱

Components are the building blocks of apps.

- `Component [identifier]`

Each component may declare these items:

- Data (input and storage)
  - 🔻 **Parameters**
    - `Take [identifier] of [concept]`
    - `Take optional [identifier] of [concept]`
    - `Handle [identifier] of [component]`
    - `Handle optional [identifier] of [component]`
  - 🟨 **Stores**
    - `Let [identifier] be [expression]`
- Operation (execution and output)
  - 🔵 **Units**
    - `Create [identifier]`
  - 🔺 **Events**
    - `Will [identifier]`
    - `Will [identifier] [concept]`
    - `Will [identifier] optional [concept]`

## Concepts 📚

Concepts are the building blocks of data in apps.

- `Concept [identifier]`
- `Concept [identifier] extends [concept]`

Each concept may have these declarations:

- Data (input and storage)
  - 🔻 **Parameters**
    - `Take [identifier] of [concept]`
    - `Take optional [identifier] of [concept]`
  - 🟨 **Stores**
    - `Let [identifier] be [value]`
- Manipulation (transformation and production)
  - ⚡ **Actions**
    - `Can [identifier]`
    - `Can [identifier] [concept]`
    - `Can [identifier] optional [concept]`
  - 🧪 **Methods**
    - `Makes [identifier] from [expression]`
    - `Makes [identifier] of [concept] from [expression]`
    - `Makes [identifier] of optional [concept] from [expression]`

## Environments 🌎

Environments pass down variables to apps when they build.

- `Environment [identifier]`

Each environment may have these declarations:

- 📦 **Builds**

## Finder

**Finder** shows a searchable tree of your open files, with a summary of the items within each one.

## Editor

**Editor** shows editable content for the items selected in Finder.

## Viewer

**Viewer** shows a preview of the items selected in Finder, which may be edited and manipulated.

## Code Examples

### "Hello, World!" (Stylish Version)

```
Component `Hello World`

Let hovered be false

Create <main>
  content = <p>
    content = "Hello, world!"
    background = if hovered "white" else "black"
    border-color = "currentcolor"
    border-style = "solid"
    border-width = "1px"
    color = if hovered "black" else "white"
    cursor = "pointer"
    font = "24px sans-serif bold"
    padding = "48px"
    On pointerenter
      Hovered: enable
    On pointerleave
      Hovered: disable
  align-items = "center"
  background = "white"
  display = "flex"
  height = "100%"
  justify-content = "center"
  position = "fixed"
  width = "100%"

```

### Counter With Button And Timer

```
Component Counter

Let count be 0

Create <p>
  content = "The count is {count}."

Create <button>
  content = "Click me!"
  On click
    Count: add 1

Create timer
  loops = true
  paused = count: `is less than` 100
  period = 1000
  On time
    Count: add 1

```

### To-do List (Rudimentary Version)

```
Component `To-do List`

Let to-dos be new list of `to-do item`

Create <form> of `to-do item`
  content =
  - <label>
      content =
      - "New To-do:"
      - <input>
          name = "text"
          type = "text"
  - <button>
      content = "Add to list"
      type = "submit"
  On submit
    To-dos: push new `to-do item`
      text = it.data.text

Create <ul>
  content = to-dos: map to view

```

```
Component `To-do Item`

Take model of `to-do item`

Create <li>
  content = <label>
    content =
    - <input>
        checked = model.completed
        type = "checkbox"
    - Model.text
    On click
      Model: complete

```

```
Concept `To-do Item`

Take text of string

Let completed be false

Can complete
  Completed: enable

Makes view from creating `to-do item`
  Model = this

```

### Build These Apps!

```
Environment Local

App `Hello World`

App Counter

App `To-do List`

```
