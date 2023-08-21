# Compendium

## Explorer

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
  completed = true

```

## Inspector

## Viewer
