# Compendium

Welcome to Compendium! From here, you will embark on a magical journey, building apps for web browsers, in an integrated tool with everything you need for victory.

Compendium Studio is your one stop shop for building apps that run in a web browser.

🪄✨💖🌺

## Finder

**Finder** shows a searchable tree of your open files, with a summary of the elements within each one.

### Components 🧱

Components are the building blocks of apps.

- `Component [identifier]`

Each `[identifier]` is a case-insensitive sequence of characters including a-z and hyphens, or else any characters except line breaks and backticks, if enclosed by backticks.

Each component may have these declarations:

- When an unknown concept should be specified later:
  - Zero or more declarations
  - `Knows [identifier]`
  - `Knows [identifier] extends [concept]`
- 🔻 **Parameters**
  - Zero or more declarations
  - `Handles [component]`
  - `Handles optional [component]`
  - `Handles [identifier] [component]`
  - `Handles optional [identifier] [component]`
  - `Takes [concept]`
  - `Takes optional [concept]`
  - `Takes [identifier] [concept]`
  - `Takes optional [identifier] [concept]`
- 🟨 **Stores**
  - Zero or more declarations
  - `Has [concept]`
  - `Has optional [concept]`
  - `Has [identifier] [concept]`
  - `Has optional [identifier] [concept]`
- 🔺 **Events**
  - Zero or more declarations
  - `Will [identifier]`
  - `Will [identifier] [concept]`
  - `Will [identifier] optional [concept]`
- 🔵 **Units**
  - One or more declarations
  - `New [component]`

### Concepts 📚

Concepts are data types that include specification of how to create and update related objects.

- `Concept [identifier]`
- `Concept [identifier] extends [concept]`

Each concept may have these declarations:

- When an unknown concept should be specified later:
  - Zero or one declaration
  - `Knows [identifier]`
  - `Knows [identifier] extends [concept]`
- 🔶 **Properties**
  - One or more declarations
  - `Has [concept]`
  - `Has optional [concept]`
  - `Has [identifier] [concept]`
  - `Has optional [identifier] [concept]`
- ⚡️ **Methods**
  - Zero or more declarations
  - `Can [identifier]`
  - `Can [identifier] [concept]`
  - `Can [identifier] optional [concept]`

### Environments 🌎

Environments hold sets of variables you can pass down to apps when you build and deploy.

- `Environment [identifier]`

Each environment may have these declarations:

- 📦 **Builds**
  - One or more declarations
  - `App [component]`

## Editor

**Editor** shows editable content for the items selected in Finder.

- 📋 Create, update, and delete items, in a detailed property editor.
- 💎 View and edit the source code of spec files, and parts of files.

## Viewer

**Viewer** shows a preview of the items selected in Finder.

Viewer has three modes:

1. 🧩 Arrangement:

- Click units to select them.
- Drag units to reorder and reposition them.

2. 🎨 Refinement:

- Click units to select them.
- Drag areas around and between units to adjust sizing and spacing.

3. 🚘 Testing:

- Interact with the app as if it were running in a browser.

## Code Examples

```
Component `Hello World`

Let hovered be false

Create <main>
  Content = <p>
    Content = "Hello, world!"
    border = "1px dashed gray"
    color = if hovered then "blue"
    cursor = "pointer"
    font = "24px sans-serif bold"
    padding = "48px"
    On pointerenter
      Set hovered to true
    On pointerleave
      Set hovered to false
  align-items = "center"
  display = "flex"
  height = "100%"
  justify-content = "center"
  position = "fixed"
  width = "100%"

```

```
Component Counter

Let count be 0

Create <p>
  Content = "The count is {count}."

Create <button>
  Content = "Click me!"
  On click
    Count add 1

Create timer
  Loops = true
  Paused = count `is less than` 100
  Period = 1000
  On time
    Count add 1

```

```
Component `To-do List`

Let to-dos be new list of `to-do item`

Create <form> of `to-do item`
  Content =
  - <label>
      Content =
      - "New To-do:"
      - <input>
          name = "text"
          type = "text"
  - <button>
      Content = "Add to list"
      type = "submit"
  On submit
    To-dos push new `to-do item`
      Text = it.data.text

Create <ul>
  Content = to-dos map for view

```

```
Component `To-do Item`

Take model of `to-do item`

Create <li>
  Content = <label>
    Content =
    - <input>
        checked = model.completed
        type = "checkbox"
    - Model.text
    On click
      Model complete

```

```
Concept `To-do Item`

Take text of string

Let completed be false

Can complete
  Set completed to true

Can view
  Return create `to-do item`
    Model = this

```

```
Environment Local

App `Hello World`

App Counter

App `To-do List`

```
