# compendium.dev

upend development

## Working with the Compendium IDE

### 🧭 Explorer

#### 🧱 Components Tab

The Components Tab lists your open components. Components are the visible building blocks of your apps (including your apps themselves).

Each component has **properties**, **storage**, **children**, and **events**.

🧪 Components are inert prototypes, but component instances do things! 🧙🪄✨

A component instance can...

🎁 Accept *properties*: immutable concept instances passed down by its parent.

_Use these to..._

- pass environment variables to an app deployment (which is like a component instance);
- pass custom traits and elements to a reusable design component or a part of your app.

🗄️ Maintain *storage*: mutable concept instances that only the component instance can access.

_Use this to..._

- hold temporary state while a component is active;
- store values in memory while an app is running;
- save and load data from external persistent storage.

🐣 Have *children*, by creating component instances and passing properties to them.

📣 Report *events* to its parent, by responding when its children report events.

#### 📚 Concepts Tab

The Concepts Tab lists your open concepts. Concepts are the types of information your components can interpret and manipulate.

Each concept has **properties** and **methods**. 

Components create concept instances, which are data structures that conform to the schema defined by a concept's properties.

📦 A *property* is a concept associated with a name that is unique within the given concept _X_.

🏭 A *method* is a pure function which operates on a concept instance of type _X_, plus some parameters, to produce a new concept instance.

### 🔎 Inspector

The Inspector shows detail for items selected in the Explorer.

### 👀 Viewer

The Viewer shows a preview of items selected in the Explorer.
