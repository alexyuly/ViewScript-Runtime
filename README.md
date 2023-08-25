# Compendium

Welcome to Compendium! From here, you will embark on a magical journey, building apps for web browsers, in an integrated tool with everything you need for victory.

🪄✨💖🌺

Compendium Studio is your one stop shop for building apps that run in a web browser.

- ☑️ Create, open, and update `.spec` files containing Compendium code.
- ☑️ Explore a tree of open files and their inner elements.
- ☑️ Develop reactive components with two-way data bindings. _(Yes!)_
- ☑️ Define reusable concepts with data and business logic.
- ☑️ Drag, drop, adjust, and inspect your app using design tools.
- ☑️ Preview and test your app without compiling or refreshing.
- ☑️ Build and deploy production-ready HTML, CSS, and JavaScript.

Now, code _is_ your spec, and what you build _is_ your product!

## Finder

**Finder** shows a searchable tree of your open files, with a summary of the elements within each one.

Select `File -> New...` to create a new file, add it to Explorer, and select it.

Select `File -> Open...` to add a saved file to Explorer and select it.

Select `File -> Close...` to remove the selected files, after confirming.

### Components 🧱

Components are the building blocks of apps.

A component is declared in code by

```
Component [name]
```

The `[name]` can be a sequence of a-z case-insensitive characters, or a sequence of any characters except line breaks and backticks, enclosed by backticks.

Each component has

- 🔻 **Parameters**
  - A parameter is a writable value sent from an instance of one component to another that it created. It's useful in any component whose behavior depends on context.
  - It is declared by `Takes [concept] [identifier]`.
- 🟨 **Stores**
  - A store is a writable value created and updated privately, by the instance of a component that created it, and by any units that component creates.
  - It is declared by `Has [concept] [identifier]`.
- 🔵 **Units**
  - A unit is an instance of one component created by another. It does something for its creator, like painting a part of the UI, or running a timer.
  - It is declared by `New [component]`.
- 🔺 **Events**
  - An event is a read-only message sent from a unit to its creator. It's useful in broadly reusable components which don't update their own parameters.
  - It is declared by `Can [identifier] [concept]`.

Here are some examples.

```
Component `Hello World`

Has condition hovered

New main
  Content = new paragraph
    Content = "Hello, world!"

    Border = "1px dashed gray"
    Color = if hovered then "blue"
    Cursor = "pointer"
    Font-size = "24px"
    Font-weight = "bold"
    Padding = "48px"

    Pointer-enter ->
      Hovered.set true

    Pointer-leave ->
      Hovered.set false

  Align-items = "center"
  Display = "flex"
  Height = "100%"
  Justify-content = "center"
  Position = "fixed"
  Width = "100%"

```

```
Component `Counter`

Has count

New paragraph
  Content = "The count is {count}."

New button
  Content = "Click me!"

  Click ->
    Count.add 1

New timer
  Loops = true
  Paused = count.`is at least` 100
  Period = 1000

  Time ->
    Count.add 1

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
          Name = "content"
  - New button
      Type = "submit"
      Content = "Add to list"

  Submit ->
    List.push object `to-do item`
      Content = event.`form data`.content

New list
  Content = list.map -> view

```

```
Component `To-do Item`

Takes objective `to-do item` data

New `list item`
  Content = new label
    Content =
    - New input
        Type = "checkbox"
        Checked = data.completed
    - Data.content

    Click ->
      Data.complete

```

### Concepts 📚

Concepts are data types that include specification of how to create and update related objects.

TODO Explain Concept syntax in code

TODO Cover generic concepts and components

Each concept has

- 🔶 **Properties**
  - A property is an instance of one concept that is part of another. It stores data that can be read by anyone, written by its own methods, and used to construct a new instance of the concept.
  - It is declared by `Has [modifier] [concept] [identifier]`.
- ⚡️ **Methods**
  - A method is a routine which updates a concept instance or creates a new one based on it, with an optional argument.
  - It is declared by `Can [identifier] [concept] [concept identifier]`.

Here is an example.

```
Concept `To-do Item`

Has text content

Has condition completed

Can complete ->
  Completed.set true

Can view ->
  New `to-do item`
    Data = this

```

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
