# 📗 The Compendium

## Compilation Drip for the Hello-World app

💧 Source Code (`Hello-World.component.spec`)
```
Component Hello-World

<main>
  content = "Hello, world!"

```
💧 Parsed Tokens
```
[
  [
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
💧 Compiled Object At Buildtime
```
{
  "type": "component",
  "name": "Hello-World",
  "units": [
    {
      "type": "unit",
      "class": "element",
      "tagName": "main",
      "parameters": {
        "content": {
          "type": "data",
          "class": "string",
          "value": "Hello, world!"
        }
      }
    }
  ]
}

```
💧 Created Object At Runtime
```
new Component({
  name: "Hello-World",
  units: [
    {
      ElementComponent.unit({
        tagName: "main",
        parameters: {
          content: StringValue.data({
            value: "Hello, world!"
          })
        }
      })
    }
  ]
})

```

