# Compendium

## Explorer

### Components 🧱

```
Component `Hello World`

# children

Has paragraph:
  Content = "Hello, world!"
```

```
Component `To-do List`

# storage

Keeps list of `to-do item`

# children

Has section:
  Content =

  - Has form:
      Content =
      - Has label:
          Content =
          - "New To-do:"
          - Has input:
              Name = "text"
      - Has button:
          Type = "submit"
          Content = "Add to list"

      Submit ->
        @`New to-do item text` = event
          | `Get form data`
          | Get "text"
        @`New to-do item` = new `to-do item`:
          Text = @`new to-do item text`
        List of `to-do item`
        | Push @`new to-do item`

  - Has list:
      Content = `to-do item`
      | `For each in` list(`to-do item`)
```

```
Component `To-do Item`

# interface

Takes `to-do item`

# children

Has `list item`:
  Content = has label:
    Content =

    - Has input:
        Type = "checkbox"
        Checked = data.completed

    - `To-do item`.text

    Click -> `to-do item`
    | Complete
```

### Concepts 📚

```
Concept `To-do Item`

# properties

Has text
Has condition completed

# methods

Can complete:
  completed = true
```

## Inspector

## Viewer
