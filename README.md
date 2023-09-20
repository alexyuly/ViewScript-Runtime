# ViewScript

**ViewScript** is a modern language for building browser-based web apps.

🧙🪄✨💖🌺

ViewScript has three goals:

1. _Reduce the bloat_ of web apps, by improving dependency quality, bundle file sizes, and runtime performance.
2. _Eliminate boilerplate code_ for web apps, by providing consistent, predictable design patterns for components and systems.
3. _Elevate shared domain vocabulary_ and business logic in web app code, to better align with stakeholders across your organization.

### Code Examples

#### 🧑‍💻 Show a paragraph with text content:

```
View HelloWorld {
   <p>
      content = "Hello, world!"
}
```

##### 💡 Tips

Curly braces surround a procedure, which is a sequence of steps to perform in order. In this example, there is just one step, to construct an HTML paragraph element.

To construct an HTML element, use `<tag-name>`, followed by an indented list of properties.

A property binds the given field or action to an object's input or output:

- A parent object sends data from a field, falling down through a child's input, to control the child's behavior.
- Conversely, a child object sends data rising up through its own output, into an action, to notify its parent of an event.

#### 💁 Show an alert when a button is clicked:

```
View ClickMe {
   <button>
      content = "Please click me"
      click = window.alert "You clicked me!"
}
```

#### 🧑‍🔬 Show text conditionally while an element is hovered:

```
View HoverMe {
   Condition hovered = false

   <div>
      content = if hovered then "You hovered me!" else "Hover me"
      pointerover = hovered.enable
      pointerleave = hovered.disable
}
```

#### 🧑‍🎨 Show a styled paragraph centered inside a full-screen container:

```
View StylishHello {
   <main>
      content = <p>
         content = "Hello, world!"
         font = "24px serif bold"
         padding = "24px"

      align-items = "center"
      display = "flex"
      height = "100%"
      justify-content = "center"
      padding = "24px"
      position = "fixed"
      width = "100%"
}
```

##### 💡 Tips

Pass styles as properties to HTML elements. Skip the classes and selectors, and directly specify CSS properties for each element.

#### 👷 Build a very simple to-do list app, using many fundamental concepts:

```
Model TodoItem {
   Text content
   Condition completed = false
   Action complete = completed.enable
}


View TodoItemView {
   TodoItem data

   <li>
      content = <label>
         content =
         -- <input>
               checked = data.completed
               type = "checkbox"

         -- data.content

      click = data.complete
}


View TodoListForm {
   Output submit TodoItem

   <form>
      content =
      -- <input>
            name = "content"
            placeholder = "Add a new to-do..."
            type = "text"

      -- <button>
            type = "submit"

      display = "flex"
      align-items = "center"

      submit = (event) ->
         submit TodoItem
            content = event.values.content
}


View TodoListApp {
   TodoItem List data

   <main>
      content =
      -- TodoListForm
            submit = (todo-item) ->
               data.unshift todo-item

      -- <ul>
            content = data.map (todo-item) ->
               TodoItemView
                  data = todo-item

      display = "flex"
      flex-direction = "column"
      gap = "24px"
}
```

### Motivation

HTML, CSS, and JavaScript have matured into amazingly powerful tools, and web browsers are a viable, often ideal, platform for building and distributing apps worldwide.

But the web has a problem. An elephant in the room, maybe. That elephant is the role of JavaScript in app development.

For more than a decade, web app developers have embraced JavaScript as the cornerstone of their process. It's natural, right? Apps use complex logic, perform long-running actions, and have side effects. HTML and CSS fall far short of providing all the tools to build standalone apps for web browsers. They were designed for a world where frontend web apps were thin shells, fully controlled by servers. They were designed to present static content to a user, and to update only upon navigation or reload.

Now, JavaScript's gains in capability and performance have made HTML and CSS the stars of a dynamic runtime toolkit for app development. Technically, it's possible to build sprawling apps by manipulating the DOM with JavaScript. But elements and styles need continual maintenance at runtime, to keep them updated as parameters change. Moreover, terminology and logic need similar care over time, to keep them fresh as a business evolves. JavaScript provides insufficient assistance in both of these critical areas.

In fact, vanilla JavaScript fails resoundingly at the task of maintaining large web apps over long time periods by unstable development teams. Unfortunately, this is a common situation in software development. First Angular, then React, now Svelte, have stepped up significantly to fill the gaps left by JavaScript. The advent of TypeScript has eased considerable pain and continues to influence web development. But, it all feels just a bit incoherent, stitched together, too chaotic, inefficient, and unproductive... Maybe you feel this, too?

ViewScript provides a potential path forward for web app development. It reinforces HTML, CSS, and JavaScript best practices, by bridging gaps and balancing concerns holistically across the web trinity. It is NOT intended to replace HTML, CSS, or JavaScript as fundamental web browser technologies. Most web-based content may never need ViewScript. Dynamic web apps will benefit from it, and even then, perhaps only greenfield apps with limited integrations.

If this sounds promising, then please join us in building a better web for app developers.
