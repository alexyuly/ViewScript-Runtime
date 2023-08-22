# Compendium

Welcome to Compendium! You will embark on a magical journey, building apps for the web, in an integrated tool with everything you need. 

🪄✨💖🌺

Compendium Studio is your one stop shop for building apps that run in a web browser.

- ☑️ Create, open, and save `.spec` files containing Compendium code.
- ☑️ Explore a tree of open files and their inner elements.
- ☑️ Develop reactive components with two-way data bindings. _(Yes!)_
- ☑️ Define reusable concepts with data and business logic.
- ☑️ Drag, drop, adjust, and inspect your app like it was Figma.
- ☑️ Preview and test your app without compiling or refreshing.
- ☑️ Build and deploy production-ready HTML, CSS, and JavaScript.

## Explorer

The explorer shows your open files, plus a summary of the elements within each one.

Select `File -> New...` to create a new file, add it to Explorer, and select it.

Select `File -> Open...` to add a saved file to Explorer and select it.

Select `File -> Close...` to remove the selected files, after confirming.

### Components 🧱

"Apps"

"Building blocks"

```
Component `Hello World`

Has paragraph:
  Content = "Hello, world!"

```

```
Component `Counter`

Keeps count

Has paragraph:
  Content = "The count is {count}."

Has button:
  Content = "Click me!"
  Click ->
    Count
    | Add 1

Has timer:
  Period = 1000
  Loops = true
  Paused = count
  | `Is at least` 100

  Time ->
    Count
    | Add 1

```

```
Component `To-do List`

Keeps list of `to-do item`

Has form of `to-do item`
  Content =
  - Has label:
      Content =
      - "New To-do:"
      - Has input:
          Name = "content"

  - Has button:
      Type = "submit"
      Content = "Add to list"

  Submit ->
    List of `to-do item`
    | Push new `to-do item`:
        Content = event.`form data`.content

Has list:
  Content = `to-do item`
  | `For each in` list of `to-do item`

```

```
Component `To-do Item`

Takes `to-do item`

Has `list item`:
  Content = has label:
    Content =
    - Has input:
        Type = "checkbox"
        Checked = `to-do item`.completed
    - `To-do item`.content

    Click ->
      `To-do item`
      | Complete

```

### Concepts 📚

"Data types"

"Business logic"

```
Concept `To-do Item`

Has text content

Has condition completed

Can complete ->
  Completed = true

```

### Environments 🌎

"Deployments"

"Databases"

"Servers"

_and all that good stuff_

An app is an instance of a component deployed to an environment.

## Inspector

Inspector shows detail for the items selected in Explorer.

- 📋 Interface parameter values
- 📢 Event handler and method implementations
- 💎 Source code

## Viewer

Viewer shows a preview of the items selected in Explorer.

Viewer has three modes:

1. 🧩 Arrangement
2. 🎨 Refinement
3. 🚘 Testing
