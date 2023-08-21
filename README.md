# Compendium

## Explorer

The explorer shows your open files, plus a summary of the elements within each one.

Select `File -> Open...` to add a file.

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

  - Has form:
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
        Let `new to-do item content` = event
          | `Get form data`
          | Get "content"
        Let `new to-do item` = new `to-do item`:
          Content = `new to-do item content`
        List of `to-do item`
        | Push `new to-do item`

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

- 📋 Component instance parameters
- 📢 Event handler implementations
- 💎 Source code

## Viewer

Viewer shows a preview of the items selected in Explorer.

Viewer has three modes:

1. 🫳 Selection
2. 🔎 Refinement
3. 🛠️ Testing
