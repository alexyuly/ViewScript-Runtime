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

```json
[
  ["View", "Component", "Hello-World"],
  ["<main>"],
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

```json
{
  "type": "view-unit",
  "name": "Hello-World",
  "units": [
    {
      "type": "element-unit",
      "name": "main",
      "parameters": {
        "content": "Hello, world!"
      }
    }
  ]
}
```

💧 Created Objects At Runtime

```ts
new ViewUnit({
  name: "Hello-World",
  units: [
    {
      type: "element-unit",
      name: "main",
      parameters: {
        content: "Hello, world!",
      },
    },
  ],
});

new ElementUnit({
  name: "main",
  parameters: {
    content: "Hello, world!",
  },
});

new StringField("Hello, world!");

// Here's the equivalent Ergonomic API:

view(
  "Hello-World",
  main({
    content: "Hello, world!",
  })
);
```

## Examples of Compendium Code versus the Compendium Ergonomic TypeScript API (CEnTAPIde)

```
View Component Counter

Let count be 0

<main>
  padding = "24px"

  content =
  - <button>
      on click -> count: add 1

      content = "Click me to add 1"

  - <p>
      content = "Count is {count}!"

```

versus

```ts
view(
  "Counter",
  field("count", 0),
  main({
    padding: "24px",
    content: [
      button({
        onClick: action("count", "add", 1),
        content: "Click me to add 1",
      }),
      p({
        content: ["Count is ", valueOf("count"), "!"],
      }),
    ],
  })
);
```

or, as JSON:

```json
{
  "type": "view-unit",
  "name": "Count",
  "stores": {
    "type": "store",
    "name": "count",
    "binding": {
      "type": "field",
      "name": "number",
      "value": 0
    }
  },
  "units": [
    {
      "type": "element-unit",
      "name": "main",
      "parameters": {
        "padding": "24px",
        "content": [
          {
            "type": "element-unit",
            "name": "button",
            "handlers": {
              "onClick": {
                "type": "action",
                "name": "count",
                "operator": "add",
                "operand": 1
              }
            },
            "parameters": {
              "content": "Click me to add 1"
            }
          },
          {
            "type": "element-unit",
            "name": "p",
            "parameters": {
              "content": [
                "Count is ",
                {
                  "type": "value",
                  "name": "count"
                },
                "!"
              ]
            }
          }
        ]
      }
    }
  ]
}
```
