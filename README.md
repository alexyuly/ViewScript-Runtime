# Compendium

## Explorer

### Components 🧱

```
Component `Hello World`

# children
Has p:
  Content = "Hello, world!"
```

```
Component `To-do List`

# storage
Keeps list(`to-do item`)

# children
Has div:
  Content =
  - Has form:
      Content =
      - Has label:
          Content =
          - "New To-do:"
          - Render input:
              Name = "text"
      - Has button:
          Type = "submit"
          Content = "Add to list"
  - Has ul:
      Content = has `to-do item` `for each in` list(`to-do item`)
```

```
Component `To-do Item`

# inteface
Takes `to-do item` data

# events
Can click `to-do item`

# children
Has li:
  Content =
  - Has label:
      Content =
      - Has input:
          Type = "checkbox"
          Checked = data.completed
      - data.text
  - On click -> this click data
```

### Concepts

```
Concept `To-do Item`

# properties
Has text
Has condition completed

# methods
Can complete:
    This condition = true
```

## Inspector

## Viewer
