# Compendium

## Explorer

### Components 🧱

```
Component `Hello World`

Has p:
  Content = "Hello, world!"
```

```
Component `To-do List`

Store list(`to-do item`)

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

Take `to-do item` data

# TODO implement children
```

#### Interface



#### Storage

#### Children

#### Events

### Concepts

```
Concept `To-do Item`

Has text
Has condition completed

Can edit text:
    This text = text

Can complete:
    This condition = true
```

#### Properties

#### Methods

## Inspector

## Viewer
