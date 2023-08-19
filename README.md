# compendium.dev

upend development

## Working with the Compendium IDE

### 🧭 Explorer

#### 🧱 Components Tab

The Components Tab lists your open components. Components are the visible building blocks of your apps (including your apps themselves).

🧪 Components are inert prototypes, but component instances do things! 🧙🪄✨

A component instance can...

🎁 Accept **properties**: immutable data passed down by its parent.

_Use these to..._

- Provide environment variables to an app deployment (which is like a component instance)
- Pass custom traits and elements to a reusable design component or a part of your app

🗄️ Maintain **storage**: mutable data that only the component instance can read and write.

_Use this to..._

- Keep state while a component is active
- Have context while an app is running
- Save and load data from persistent storage

🐣 Have **children**, by creating component instances and passing properties to them.

📣 Report **events** to its parent, by responding when its children report events.

#### 📚 Concepts Tab

The Concepts Tab lists your open concepts. Concepts are the types of data that your components can read and write.

💡 Concepts don't do anything. They are recipes that your components use to create data.

A concept has two elements...

📦 **Properties** are named references to other concepts within a concept. Use them to create hierarchies and graphs!

🛠️ **Methods** are pure functions that work with a particular type of data to produce more data. They can also accept parameters!

### 🔎 Inspector

The Inspector shows detail for items selected in the Explorer.

### 👀 Viewer

The Viewer shows a preview of items selected in the Explorer.
