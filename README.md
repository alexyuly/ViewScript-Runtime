# 📗 The Compendium

## End-to-end flow for Compendium source code

1. **Entry point** (`[NAME].component.spec`)
1. Source code (`[NAME.TYPE].spec`)
1. Source tokens _(in memory)_
1. **Compiled object** (`[NAME.TYPE].json`)
1. Dependency resolution
    1. For each dependency, repeat steps 2-5
1. **Linked app** (`[NAME].app.json`)

_Where and how does type checking happen?_

## Compilation drip for the Hello-World app

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
          "type": "field",
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
new class extends Component {
  name = "Hello-World";

  units() {
    return [
      ElementComponent.unit({
        tagName: "main",
        parameters: {
          content: StringValue.field({
            value: "Hello, world!"
          })
        }
      })
    ]
  }
}

```

