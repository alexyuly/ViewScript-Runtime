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
Keeps list(`to-do item`)

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
  - Has list:
      Content = `to-do item` `for each in` list(`to-do item`)
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
    - data.text
    Click ->
      Complete `to-do item`
```

### Concepts 📚

```
Concept `To-do Item`

# properties
Has text
Has condition completed

# methods
Can complete:
  condition = true
```

## Inspector

## Viewer
