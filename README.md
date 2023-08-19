# compendium.dev
upend development

## Working with the Compendium IDE

### 🧭 Explorer

#### 🧱 Components Tab

The Components Tab lists your open components. Components are the visible building blocks of your apps (including your apps themselves).

Each component has Properties, Storage, Children, and Events.

🧪 Components are inert prototypes, but component instances do things! A component instance can...

✅ Accept Properties: immutable concept instances passed down by its parent.

You can use this to...
- pass environment variables to an app deployment (which is like a component instance)
- pass custom traits and elements to a reusable design component or a part of your app

✅ Maintain Storage: mutable concept instances that only the component instance can access.

You can use this to...
- keep temporary state while a component is in use
- store values in memory while an app is running
- save and load data from external persistent storage

✅ Have Children, by creating component instances and passing properties to them.

✅ Fire Events to its parent, by responding when its children fire events.

#### 📚 Concepts Tab

The Concepts Tab lists your open concepts. Concepts are the types of information your components can understand and store.

Each concept has Properties and Methods.

💡 A concept defines a data type along with pure functions of that data type.

### 🔎 Inspector

The Inspector shows detail for items selected in the Explorer.

### 👀 Viewer

The Viewer shows a preview of items selected in the Explorer.
