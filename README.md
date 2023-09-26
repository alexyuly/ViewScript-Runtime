# ViewScript

🏗️ **ViewScript** is a modern language that compiles into HTML and JavaScript.

## Current State

🎉 **ViewScript v0.0.0** is the **first** and **latest version**, published September 30, 2023.

ViewScript is currently a limited proof of concept. The three examples below.

## Future Plans

New features in the upcoming version, _ViewScript v0.1.0_:

- Examples
  - Nested HTML elements (atoms)
  - Basic Todo List App
- Functionality
  - Atoms' `content` property accepts atoms and collections of text + atoms
  - Define models
    - Define properties (fields passed down)
    - Define state (fields made automatically)
  - Define properties in views
  - _[more, to be continued...]_

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

A field refers to an instance of a model. Each field has

- A model which determines the type of data it can hold
- A value which initializes the field

Input properties can be conditionally bound to fields, using `if`, `then`, `else` syntax:

```
if CONDITIONAL-FIELD then POSITIVE-FIELD else NEGATIVE-FIELD
```

## ViewScript Quirks

### ViewScript is case-insensitive

Keeping with the spirit of HTML and CSS, ViewScript code is case-insensitive. Certain cases are conventional in particular contexts. See the examples to get a feel for this. However, your code will compile regardless of case.

Case matters in preserving the actual characters of literal text, like `"Hello, world!"`.

### ViewScript uses 3 spaces for indentation

Four spaces feels wasteful of screen width, but two spaces is uncomfortable. While bucking web development norms, three spaces is an ideal compromise. We'll see if this proves to be a wise choice.

Spacing and indentation matter in ViewScript. Your spacing and indentation need to be correct, for your code to compile. If not, the compiler will let you know about it immediately.

## Reserved Words

Some words are off-limits from use for names in your own code. They form the foundation of ViewScript and have singular meanings.

- `Action`
- `Catch`
- `Collection`
- `Condition`
- `Else`
- `Empty`
- `False`
- `If`
- `Import`
- `Model`
- `Number`
- `Optional`
- `Output`
- `Task`
- `Text`
- `Then`
- `True`
- `View`
- `Window`
