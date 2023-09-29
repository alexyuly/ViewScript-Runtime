# ViewScript

⚡️ _Power Tools For Web Apps_

## Start

```
npm install viewscript-toolkit --global

viewscript create YourProjectName

cd YourProjectName

npm start
```

## Examples

[View Source...](https://github.com/alexyuly/ViewScript-Toolkit/tree/main/examples/bridge/src)

### HelloWorld

```ts
import { app, view, element } from "viewscript-bridge";

app(
  view(
    element("p", {
      content: "Hello, world!",
      font: "18px cursive",
      margin: "24px",
    })
  )
);
```

### Log when button clicked

```ts
import { app, view, element, browser } from "viewscript-bridge";

app(
  view(
    element("button", {
      background: "whitesmoke",
      border: "1px solid gainsboro",
      "border-radius": "4px",
      click: browser.console.log("You clicked the button."),
      content: "Click me!",
      cursor: "pointer",
      "font-size": "18px",
      margin: "24px",
      padding: "12px",
    })
  )
);
```

### Update section while hovered

```ts
import { app, view, condition, element, conditional } from "viewscript-bridge";

function UpdateSectionWhileHovered() {
  const hovered = condition(false);

  return view(
    hovered,
    element("section", {
      background: conditional(hovered, "black", "white"),
      border: "1px solid black",
      color: conditional(hovered, "white", "black"),
      content: conditional(hovered, "I am hovered.", "Hover me!"),
      font: "bold 24px serif",
      margin: "24px",
      padding: "24px",
      pointerleave: hovered.disable,
      pointerover: hovered.enable,
    })
  );
}

app(UpdateSectionWhileHovered());
```
