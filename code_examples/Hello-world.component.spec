Component `Hello World`

Let hovered be false

Create <main>
  content = create <p>
    content = "Hello, world!"
    border-style = "solid"
    border-width = "2px"
    font = "12px sans-serif bold"
    padding = "16px"
    background = if hovered then "white" else "black"
    color = if hovered then "black" else "white"
    border-color = "currentcolor"
    On pointerenter
      Hovered: enable
    On pointerleave
      Hovered: disable
  background = "white"
  position = "fixed"
  width = "100%"
  height = "100%
  display = "flex"
  align-items = "center"
  justify-content = "center"
