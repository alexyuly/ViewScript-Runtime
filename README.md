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

Hovered = false

Create <main>
  Content = <p>
    Content = "Hello, world!"
    Border = "1px dashed gray"
    Color = if hovered then "blue"
    Cursor = "pointer"
    Font = "24px sans-serif bold"
    Padding = "48px"
    Pointerenter => hovered = true
    Pointerleave => hovered = false
  Align-items = "center"
  Display = "flex"
  Height = "100%"
  Justify-content = "center"
  Position = "fixed"
  Width = "100%"

```

```
Component Counter

Store count = 0

Create <p>
  Content = "The count is {count}."

Create <button>
  Content = "Click me!"
  Click => count.add 1

Create timer
  Loops = true
  Paused = count.`is less than` 100
  Period = 1000
  Time => count.add 1

```

```
Component `To-do List`

Store list of `to-do item`

Create <form> of `to-do item`
  Content =
  - <label>
      Content =
      - "New To-do:"
      - <input>
          Name = "text"
          Type = "text"
  - <button>
      Content = "Add to list"
      Type = "submit"
  Submit => list.push new `to-do item`
    Text = it.values.text

Create <ul>
  content = list.map to view

```

```
Component `To-do Item`

Take model `to-do item`

Create <li>
  Content = <label>
    Content =
    - <input>
        Checked = model.completed
        Type = "checkbox"
    - Model.text
    Click => model.complete

```

```
Concept `To-do Item`

Has text

Has completed = false

Can complete -> completed = true

Can view -> create `to-do item`
  Model = this

```

```
Environment Local

App `Hello World`

App Counter

App `To-do List`

```
