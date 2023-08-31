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

_TODO anything else to say? ✏️_

- HTML and CSS are almost entirely user-facing; JavaScript is not, mostly
- striving for parity between GUI and code development experiences within an IDE

## Compendium Studio

_TODO expand this section as studio is developed..._

### Finder

**Finder** shows a searchable tree of your open files, with a summary of the items within each one.

### Editor

**Editor** shows editable content for the items selected in Finder.

### Viewer

**Viewer** shows a preview of the items selected in Finder, which may be edited and manipulated.

## Compendium Core Spec

_TODO expand this section as the core is developed..._

### Identifiers

Each `[identifier]` is delimited by whitespace, case insensitive, and:

- if enclosed by backticks, then any characters except line breaks and backticks;
- else, a case-insensitive sequence of characters including a-z and hyphens.

### Components 🧱

Components are the building blocks of apps.

- `Component [identifier]`

Each component may declare these items:

#### Data (input and storage)

🔻 **Parameters**

- `Take [identifier] of [concept]`
- `Take optional [identifier] of [concept]`
- `Handle [identifier] of [component]`
- `Handle optional [identifier] of [component]`

🟨 **Stores**

- `Let [identifier] be [expression]`

#### Operation (execution and output)

🔵 **Units**

- `Create [identifier]`

🔺 **Events**

- `Will [identifier]`
- `Will [identifier] [concept]`
- `Will [identifier] optional [concept]`

### Concepts 📚

Concepts are the building blocks of data in apps.

- `Concept [identifier]`
- `Concept [identifier] extends [concept]`

Each concept may have these declarations:

#### Data (input and storage)

🔻 **Parameters**

- `Take [identifier] of [concept]`
- `Take optional [identifier] of [concept]`

🟨 **Stores**

- `Let [identifier] be [value]`

#### Manipulation (transformation and production)

⚡ **Actions**

- `Can [identifier]`
- `Can [identifier] [concept]`
- `Can [identifier] optional [concept]`

🧪 **Methods**

- `Makes [identifier] from [expression]`
- `Makes [identifier] [concept] from [expression]`
- `Makes [identifier] optional [concept] from [expression]`

### Environments 🌎

Environments pass down variables to apps when they build.

- `Environment [identifier]`

Each environment may have these declarations:

📦 **Builds**

- `App [component]`

## Compendium Code Examples

### "Hello, World!" (Stylish Version)

```
Component `Hello World`

Let hovered be false

Create <main>
  content = <p>
    content = "Hello, world!"
    background = if hovered "white" else "black"
    border-color = "currentcolor"
    border-style = "solid"
    border-width = "1px"
    color = if hovered "black" else "white"
    cursor = "pointer"
    font = "24px sans-serif bold"
    padding = "48px"
    On pointerenter
      Hovered: enable
    On pointerleave
      Hovered: disable
  align-items = "center"
  background = "white"
  display = "flex"
  height = "100%"
  justify-content = "center"
  position = "fixed"
  width = "100%"

```

### Counter With Button And Timer

```
Component Counter

Let count be 0

Create <p>
  content = "The count is {count}."

Create <button>
  content = "Click me!"
  On click
    Count: add 1

Create timer
  loops = true
  paused = count: `is less than` 100
  period = 1000
  On time
    Count: add 1

```

### To-do List (Rudimentary Version)

```
Component `To-do List`

Let to-dos be new list of `to-do item`

Create <form> of `to-do item`
  content =
  - <label>
      content =
      - "New To-do:"
      - <input>
          name = "text"
          type = "text"
  - <button>
      content = "Add to list"
      type = "submit"
  On submit
    To-dos: push new `to-do item`
      text = it.data.text

Create <ul>
  content = to-dos: map to view

```

```
Component `To-do Item`

Take model of `to-do item`

Create <li>
  content = <label>
    content =
    - <input>
        checked = model.completed
        type = "checkbox"
    - Model.text
    On click
      Model: complete

```

```
Concept `To-do Item`

Take text of string

Let completed be false

Can complete
  Completed: enable

Makes view from creating `to-do item`
  Model = this

```

### Build These Apps!

```
Environment Local

App `Hello World`

App Counter

App `To-do List`

```
