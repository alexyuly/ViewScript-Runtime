# Compendium

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
Component `To-do List`

Keeps list of `to-do item`

Has section:
  Content =
  - Has form of `to-do item`
      Content =
      - Has label:
          Content =
          - "New To-do:"
          - Has input:
              Name = "content"
      - Has button:
          Type = "submit"
          Content = "Add to list"
      Submit -> List of `to-do item`
      | Push new `to-do item`:
          Content = event.`form data`.content
  - Has list:
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
    Click -> `to-do item`
    | Complete

```

### Concepts 📚

"Data types"

"Business logic"

```
Concept `To-do Item`

Has text content
Has condition completed

Can complete:
  Completed = true

```

## Inspector

Inspector shows detail for the items selected in Explorer.

- 📋 Interface parameter values
- 📢 Event handler and method implementations
- 💎 Source code

## Viewer

Viewer shows a preview of the items selected in Explorer.

Viewer has three modes:

1. 🫳 Arrangement
2. 🎨 Refinement
3. 🛠️ Testing
