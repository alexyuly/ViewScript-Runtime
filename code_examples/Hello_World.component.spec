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
