# The Compendium

Welcome to the Compendium! From here, you will embark on a magical journey, building apps for web browsers, in an integrated tool with everything you need for victory. 

🪄✨💖🌺

## Motivation

TODO

## High-Level

### Identifiers

Each `[identifier]` is delimited by whitespace, case insensitive, and:
- if enclosed by backticks, then any characters except line breaks and backticks;
- else, a case-insensitive sequence of characters including a-z and hyphens.

## Components 🧱

Components are the building blocks of apps.

- `Component [identifier]`

Each component may have these declarations:

- Data (input and storage)
  - 🔻 **Parameters**
  - 🟨 **Stores**
- Operation (execution and output)
  - 🔵 **Units**
  - 🔺 **Events**

## Concepts 📚

Concepts are the building blocks of data in apps.

- `Concept [identifier]`
- `Concept [identifier] extends [concept]`

Each concept may have these declarations:

- Data (input and storage)
  - 🔻 **Parameters**
  - 🟨 **Stores**
- Manipulation (transformation and production)
  - ⚡ **Actions**
  - 🧪 **Methods**

## Environments 🌎

Environments hold sets of variables you can pass down to apps when you build and deploy.

- `Environment [identifier]`

Each environment may have these declarations:

- 📦 **Builds**

## Finder

**Finder** shows a searchable tree of your open files, with a summary of the elements within each one.

## Editor

**Editor** shows editable content for the items selected in Finder.

## Viewer

**Viewer** shows a preview of the items selected in Finder, which may be edited and manipulated.

## Code Examples

### "Hello, World!"

```
Component `Hello World`

Let hovered be false

Create <main>
  content = <p>
    content = "Hello, world!"
    border = "1px dashed gray"
    color = if hovered then "blue"
    cursor = "pointer"
    font = "24px sans-serif bold"
    padding = "48px"
    On pointerenter
      Hovered: enable
    On pointerleave
      Hovered: disable
  align-items = "center"
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

### To-do List (Rudimentary)

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

Can view
  Return create `to-do item`
    Model = this

```

### Build These Apps!

```
Environment Local

App `Hello World`

App Counter

App `To-do List`

```
