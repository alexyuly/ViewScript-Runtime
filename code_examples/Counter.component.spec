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
