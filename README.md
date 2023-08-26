# Compendium

Welcome to Compendium! From here, you will embark on a magical journey, building apps for web browsers, in an integrated tool with everything you need for victory.

🪄✨💖🌺

Compendium Studio is your one stop shop for building apps that run in a web browser.

## Finder

**Finder** shows a searchable tree of your open files, with a summary of the elements within each one.

### Components 🧱

Components are the building blocks of apps.

- `Component [identifier]`
- `Component [identifier] of [concept]`

Each `[identifier]` is a case-insensitive sequence of characters including a-z and hyphens, or else any characters except line breaks and backticks, if enclosed by backticks.

Each component may have these declarations:

- 🔻 **Parameters**
  - `Takes [concept]`
  - `Takes optional [concept]`
  - `Takes [identifier] [concept]`
  - `Takes optional [identifier] [concept]`
  - `Shows [component]`
  - `Shows optional [component]`
  - `Shows [identifier] [component]`
  - `Shows optional [identifier] [component]`
- 🟨 **Stores**
  - `Has [concept]`
  - `Has optional [concept]`
  - `Has [identifier] [concept]`
  - `Has optional [identifier] [concept]`
- 🔺 **Events**
  - `Will [identifier]`
  - `Will [identifier] [concept]`
  - `Will [identifier] optional [concept]`
- 🔵 **Units**
  - `New [component]`

### Concepts 📚

Concepts are data types that include specification of how to create and update related objects.

- `Concept [identifier]`
- `Concept [identifier] of [concept]`

Each concept may have these declarations:

- 🔶 **Properties**
  - `Has [concept]`
  - `Has optional [concept]`
  - `Has [identifier] [concept]`
  - `Has optional [identifier] [concept]`
- ⚡️ **Methods**
  - `Can [identifier]`
  - `Can [identifier] [concept]`
  - `Can [identifier] optional [concept]`

### Environments 🌎

Environments hold sets of variables you can pass down to apps when you build and deploy.

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

Has hovered condition

New main
  Content = new paragraph
    Content = "Hello, world!"
    Border = "1px dashed gray"
    Color = if hovered then "blue"
    Cursor = "pointer"
    Font-size = "24px"
    Font-weight = "bold"
    Padding = "48px"
    Pointer-enter => hovered.set true
    Pointer-leave => hovered.set false
  Align-items = "center"
  Display = "flex"
  Height = "100%"
  Justify-content = "center"
  Position = "fixed"
  Width = "100%"

```

```
Component Counter

Has count

New paragraph
  Content = "The count is {count}."

New button
  Content = "Click me!"
  Click => count.add 1

New timer
  Loops = true
  Paused = count.`is at least` 100
  Period = 1000
  Time => count.add 1

```

```
Component `To-do List`

Has list of `to-do item`

New form of `to-do item`
  Content =
  - New label
      Content =
      - "New To-do:"
      - New input
          Name = "text"
  - New button
      Content = "Add to list"
      Type = "submit"
  Submit => list.push data `to-do item`
    Text = event.values.text

New list
  Content = list.map to view

```

```
Component `To-do Item`

Takes model `to-do item`

New `list item`
  Content = new label
    Content =
    - New input
        Type = "checkbox"
        Checked = model.completed
    - Model.text
    Click => model.complete

```

```
Concept `To-do Item`

Has text

Has completed condition

Can complete -> completed.set true

Can view -> new `to-do item`
  Model = this

```
