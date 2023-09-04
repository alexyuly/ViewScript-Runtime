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
