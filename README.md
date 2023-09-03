# 📗 The Compendium

## End-to-end flow for Compendium source code

1. Entry Point (`[NAME].component.spec`)
1. Source Code (`[NAME.TYPE].spec`)
1. Parsed Tokens _(in memory)_
1. Compiled Object (`[NAME.TYPE].json`)
1. Dependency Resolution
   1. For each dependency, repeat steps 2-5
1. Linked App Object (`[NAME].app.json`)

_Where and how does type checking happen?_

## Compilation drip for the Hello-World app

💧 Source Code (`Hello-World.component.spec`)

```
View Component Hello-World

<main>
  content = "Hello, world!"

```

💧 Parsed Tokens

```
[
  [
    "View",
    "Component",
    "Hello-World"
  ],
  [
    "<main>"
  ],
  [
    {
      "indent": 1
    },
    "content",
    "=",
    "\"Hello, world!\""
  ]
]

```

💧 Compiled Object / Linked App Object

```
{
  "type": "view-unit",
  "name": "Hello-World",
  "units": [
    {
      "type": "element-unit",
      "tagName": "main",
      "parameters": {
        "content": {
          "type": "string-field",
          "value": "Hello, world!"
        }
      }
    }
  ]
}

```

💧 Created Objects At Runtime

```
new ViewUnit({
  name: "Hello-World",
  units: [
    {
      type: "element-unit",
      tagName: "main",
      parameters: {
        content: {
          type: "string-field",
          value: "Hello, world!",
        },
      },
    },
  ],
})

new ElementUnit({
  tagName: "main",
  parameters: {
    content: {
      type: "string-field",
      value: "Hello, world!",
    },
  },
})

new StringField("Hello, world!")

// Here's the equivalent Ergonomic API call:

view("Hello-World")(main({
  content: "Hello, world!",
}))

```
