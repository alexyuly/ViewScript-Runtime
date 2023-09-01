# The Compendium

**Welcome to the Compendium!**

From here, you will embark on an enchanted journey, _building apps for web browsers_, in a magical garden of HTML and CSS sorcery.

🧙🪄✨💖🌺

## Motivation

HTML, CSS, and JavaScript are amazing tools, and web browsers are a viable platform for building and distributing apps worldwide.

_But the web has a problem. An elephant in the room, maybe._

That elephant is JavaScript. 🐘

For more than a decade, web app developers have embraced JavaScript increasingly as the cornerstone of their process, above HTML and CSS. It's natural, right? Apps use complex logic, take long actions, and have side effects. HTML and CSS fall far short of providing all the tools to build standalone apps for web browsers. They were designed for a world where frontend web apps were thin shells, fully controlled by servers. They were designed to present static content to a user, and to update only upon navigation or reload.

Now, JavaScript's gains in capability and performance have made HTML and CSS the stars of a dynamic runtime toolkit for app development. Technically, it's possible to build sprawling apps by manipulating the DOM and CSSOM with JavaScript. But elements and styles need continual maintenance to keep them updated when parameters change. Moreover, logic and requirements need similar care to keep them fresh as a business evolves. JavaScript provides insufficient assistance in these critical areas.

In fact, vanilla JavaScript fails resoundingly at the task of maintaining large web apps over long time periods by unstable development teams. Unfortunately, this is a common situation in software development. First Angular, then React, now Svelte, have stepped up somewhat to fill the gaps left by JavaScript. The advent of TypeScript has eased considerable pain. But, it all feels just a bit incoherent, stitched together, too chaotic, inefficient, and unproductive... Maybe you feel this, too?

**The Compendium** provides a potential path forward for web app development. It reinforces HTML, CSS, and JavaScript best practices, by bridging gaps and balancing concerns holistically across the web trinity. It is _NOT_ intended to replace HTML, CSS, or JavaScript as fundamental web browser technologies. Many or most web-based content will never need the Compendium. Only dynamic web apps will benefit from it, and even then probably only greenfield apps with limited external integrations.

The Compendium has three main goals:

🏃 **Reduce the bloat** of frontend web apps, in terms of dependency quality and quantity, bundle file sizes, and runtime performance.

⚙️ **Eliminate boilerplate code** for frontend web apps, by requiring consistent, predictable design patterns for components and systems.

🙌 **Elevate ubiquitous technical terminology** in apps and products, shared across R&D by frontend engineers, designers, and managers.

_TODO ✏️ Finish this section..._

- HTML and CSS are almost entirely user-facing; JavaScript is not, mostly
- striving for parity between GUI and code development experiences within an IDE

## Compendium Studio

_TODO Write this section as studio is developed..._

## Compendium Code Spec

_TODO expand this section as the core is developed..._

### Identifiers

Each identifier, represented as `[id]` in the examples below, is delimited by whitespace, case insensitive, and:

- if enclosed by backticks, then any characters except line breaks, angle brackets, and backticks;
- else, a case-insensitive sequence of characters including a-z and hyphens.

### Concepts 📚

Concepts are the building blocks of data in apps.

The first line in a .concept.spec file should declare a concept with an `id` that matches the file name, excluding its extensions.
```
Concept [id]
```

For example:

`Example.concept.spec`

```
Concept Example

# to be continued...
```

Although Compendium code is case insensitive, conventionally, the first line is written in title case.

Each concept spec file contains declarations that determine its behavior.

#### 🔻 **Parameters**

A parameter is a reference for a concept to receive a field from the object that created it.

A concept may update its own parameters, by calling actions on them from within its own actions.

Any object may read the values of a concept's parameters.

To declare a parameter named `id` holding a field of the given `concept`:
```
Take [id] of [concept]
```

To allow the parameter's field to be empty:
```
Take [id] of optional [concept]
```

#### 🟨 **Stores**

- `Let [identifier] be [value]`

#### ⚡ **Actions**

- `Can [identifier] -> [side effects]`
- `Can [identifier] [concept] -> [side effects]`
- `Can [identifier] optional [concept] -> [side effects]`

#### 🧪 **Methods**

- `Makes [identifier] from [expression]`
- `Makes [identifier] [concept] from [expression]`
- `Makes [identifier] optional [concept] from [expression]`

- `Renders [identifier] from [unit]`
- `Renders [identifier] [concept] from [unit]`
- `Renders [identifier] optional [concept] from [unit]`

### ⛳️ Fields

A field is an instance of a concept. It is an object that holds data, which units can read, update, or use to produce new objects.

Moreover, each time its data changes, a field notifies the objects that reference it. This leads to efficient, reactive behavior in apps.

### 🧱 Components 

Components are the building blocks of apps.

The first line in a .component.spec file should declare a component with an `id` that matches the file name, excluding its extensions.

```
Component [id]
```

For example:

`Example.component.spec`

```
Component Example

# to be continued...
```

A component may share an identical `id` as a concept in its same directory. A component and a concept with the same name are identified in code by how they are used.

Each component spec file contains declarations that determine its behavior.

#### 🔻 **Parameters**

Like concepts, components have parameters.

A parameter is a reference for a component to receive a field from its parent, which it can pass to its children.

To declare a parameter named `id` holding a field of the given `concept`:
```
Take [id] of [concept]
```

To allow the parameter's field to be empty:
```
Take [id] of optional [concept]
```

#### 🟨 **Stores**

A store is a reference for a component to save a field, which it can pass to its children.

```
Let [id] be [field]
```

To allow the store's binding to be empty:
```
Let [id] be optional [field]
```

#### 🔵 **Units**

A unit is an instance of a component (a "child") created by another (its "parent").

To create an element in the Document Object Model with the given `tag` name:
```
<tag>
```

To create an instance of a component that is outside the DOM:
```
New [component]
```

This may be
- either a natural component that is part of the Compendium API,
- or a custom component that you or someone else has built with Compendium code.

Each unit also has

**Listeners**: event handlers for the unit's streams

```
<div>
  on click => window: alert "You clicked!"
  on contextmenu => {
    event: prevent-default
    console: log "Context menu prevented!"
  }
  on keydown => {
    prevent event.key: is "Escape"
    prevent event.key: is "Enter" => console: log "You pressed Enter!"
    prevent event.key: is "Shift" => {
      console: log "You pressed Shift!"
      console: log "Time to shift into gear."
    }
    window: alert "You pressed an unsupported key. Sorry."
  }

Use geolocation
  on change => console: log "{event.coords.lat}, {event.coords.lon}"
```

**Properties**: fields assigned to the unit's parameters

```
<ul>
  font = "2rem serif"
  content =
  - <li>
      content = "1"
  - <li>
      content = "2"
```

#### 💧 **Streams**

A stream is a channel which broadcasts events, which may contain fields, from a component to its parent.

To declare a stream named `id` which broadcasts just empty events:
```
Will [id]
```

To declare a stream which broadcasts events with fields of the given `concept`:
```
Will [id] [concept]
```

To allow the stream to optionally broadcast empty fields of the given `concept`:
```
Will [id] optional [concept]
```

### Environments 🌎

Environments pass down variables to apps when they build.

- `Environment [identifier]`

Each environment may have these declarations:

📦 **Builds**

- `App [component]`

### Other Syntax

#### Conditional expressions

- `if [expression] then [expression]`
- `if [expression] then [expression] else [expression]`

#### Creating a new data object

- `new [concept]`

#### Handling an event

- `on [event] => [action call]`

```
on [event] => {
  [action call]
  [action call]
  [action call]
}

[and so on...]
```

#### Calling one action or method

- `[Value]: [action]`
- `[Value]: [action] [expression]`
- `[value]: [method]`
- `[value]: [method] [expression]`

#### Calling multiple chained methods

```
[value] (
  [method]
  [method] [expression]
  [method] [value2]: [method2]
  [method] (
    [method]
    [method] [expression]
    [method] [value2]: [method2]
  )
)

[and so on...]
```

## Compendium Code Examples

### "Hello, World!" (Simple Version)

```
Component `Hello World`

Let hovered be false

<main>
  align-items = "center"
  background = "navy"
  display = "flex"
  height = "100%"
  justify-content = "center"
  position = "fixed"
  width = "100%"

  content = <p>
    on pointerenter => hovered: enable
    on pointerleave => hovered: disable

    background = if hovered then "olive" else "navy"
    border = "24px solid currentcolor"
    color = if hovered then "navy" else "olive"
    cursor = "pointer"
    font = "24px sans-serif bold"
    padding = "48px"

    content = "Hello, world!"

```

### Counter With Button And Timer

```
Component Counter

Let count be 0

<p>
  content = "The count is {count}."

<button>
  on click => count: add 1

  content = "Click me!"

New timer
  on time => count: add 1

  loops = true
  paused = count: `is less than` 100
  period = 1000

```

### To-do List (Rudimentary Version)

```
Component `To-do List`

Let to-dos be new list of `to-do item`

<form>
  on submit => to-dos: push new `to-do item`
    text = event.data: get "text"

  content =
  - <label>
      content =
      - "New To-do:"
      - <input>
          name = "text"
          type = "text"

  - <button>
      type = "submit"

      content = "Add to list"

<ul>
  content = to-dos: map to view

```

```
Component `To-do Item`

Take model of `to-do item`

<li>
  content = <label>
    content =
    - <input>
        checked = model.completed
        type = "checkbox"

    - model.text

  on click => model: complete

```

```
Concept `To-do Item`

Take text of string

Let completed be false

Can complete -> completed: enable

Renders view from new `to-do item`
  model = this

```

### Build Those Apps!

```
Environment Local

App `Hello World`

App Counter

App `To-do List`

```
