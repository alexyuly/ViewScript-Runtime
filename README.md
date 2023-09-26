# ViewScript

🏗️ **ViewScript** is a modern language for building web apps.

## Code Examples

Here are some quick examples you can use right now to get started.

### 1. Show a paragraph of text

```
View `Show a paragraph of text` {
   <p>
      content = "Hello, world!"
}
```

#### 💡 Lesson 1

Views perform steps, like making elements.

Each view has one or more steps inside curly braces:

```
View NAME {
   STEP
   STEP
   STEP
   // and so on
}
```

Views make elements that render HTML, called atoms.

Each atom may take one or more uniquely named properties:

```
<TAG-NAME>
   PROPERTY-NAME-1 = VALUE
   PROPERTY-NAME-2 = VALUE
   PROPERTY-NAME-3 = VALUE
   // and so on
```

Some properties are inputs, like `content`.

An input is bound to a field. When an input's field is updated, then its element will update.

```
INPUT-PROPERTY-NAME = FIELD
```

### 2. Print logs when a button is clicked

```
View `Print logs when a button is clicked` {
   <button>
      content = "Please click me."
      click = window.console.log "You clicked the button."
}
```

#### 💡 Lesson 2

Some properties are outputs, like `click`.

An output is bound to a handler. When element activates its output, then its view will call the handler.

```
OUTPUT-PROPERTY-NAME = HANDLER
```

### 3. Change styles while a section is hovered

```
View `Change styles while a section is hovered` {
   Condition hovered = false

   <section>
      background = if hovered then "black" else "white"
      border = "1px solid black"
      color = if hovered then "white" else "black"
      content = if hovered then "You are hovering the section." else "Please hover me."
      font = "12px sans-serif bold"
      margin = "24px"
      padding = "24px"
      pointerleave = hovered.disable
      pointerover = hovered.enable
}
```

#### 💡 Lesson 3

Views can have state, like a "boolean" condition of _true_ or _false_.

```
MODEL-NAME FIELD-NAME = VALUE
```

A field refers to an instance of a model.

Each field has

- A model which determines the type of data it can hold
- A value which initializes the field, possibly `empty`

## ViewScript Quirks

### ViewScript is case-insensitive

### ViewScript uses 3 spaces for indentation

## Reserved Words

Some words are off-limits from use for names in your own code. They form the foundation of ViewScript and have singular meanings.

### `Action`

```
Action FIELD-NAME = HANDLER

Action FIELD-NAME = {
   HANDLERS
}

Action FIELD-NAME ARGUMENT-MODEL-NAME = (ARGUMENT-NAME) ->
   HANDLER

Action FIELD-NAME ARGUMENT-MODEL-NAME = (ARGUMENT-NAME) -> {
   HANDLERS
}
```

### `Catch`

```
Catch CONDITIONAL-FIELD

Catch CONDITIONAL-FIELD {
   HANDLERS
}
```

### `Collection`

```
MODEL-NAME collection FIELD-NAME

MODEL-NAME collection FIELD-NAME = VALUE

Optional MODEL-NAME collection FIELD-NAME = VALUE
```

### `Condition`

```
Condition FIELD-NAME

Condition FIELD-NAME = VALUE

Condition FIELD-NAME ARGUMENT-MODEL-NAME = (ARGUMENT-NAME) ->
   VALUE
```

### `Else`

```
If CONDITIONAL-FIELD then POSITIVE-FIELD else NEGATIVE-FIELD
```

### `Empty`

```
MODEL-NAME FIELD-NAME = empty
```

### `False`

```
PROPERTY-NAME = false

Condition FIELD-NAME = false
```

### `If`

```
If CONDITIONAL-FIELD then POSITIVE-FIELD

If CONDITIONAL-FIELD then POSITIVE-FIELD else NEGATIVE-FIELD
```

### `Import`

```
Import FILE-NAME
```

### `Model`

```
Model MODEL-NAME {
   STEPS
}
```

### `Number`

```
Number FIELD-NAME

Number FIELD-NAME = VALUE

Number FIELD-NAME ARGUMENT-MODEL-NAME = (ARGUMENT-NAME) ->
   VALUE
```

### `Optional`

```
Optional MODEL-NAME FIELD-NAME

Optional MODEL-NAME FIELD-NAME = VALUE
```

### `Output`

```
Output FIELD-NAME

Output FIELD-NAME ARGUMENT-MODEL-NAME

Output FIELD-NAME optional ARGUMENT-MODEL-NAME
```

### `Task`

```
Task TASK-NAME {
   STEPS
}
```

### `Text`

```
Text FIELD-NAME

Text FIELD-NAME = VALUE

Text FIELD-NAME ARGUMENT-MODEL-NAME = (ARGUMENT-NAME) ->
   VALUE
```

### `Then`

```
If CONDITIONAL-FIELD then POSITIVE-FIELD

If CONDITIONAL-FIELD then POSITIVE-FIELD else NEGATIVE-FIELD
```

### `True`

```
PROPERTY-NAME = true

Condition FIELD-NAME = true
```

### `View`

```
View VIEW-NAME {
   STEPS
}
```

### `Window`

```
Window
```
