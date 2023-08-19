# compendium.dev
upend development

## Working with the Compendium IDE

### 🧭 Explorer

#### 🧱 Components Tab

The Components Tab lists your open components. Components are the visible building blocks of your apps (including your apps themselves).

Each component has Properties, Storage, Children, and Events.

🧪 Components are inert prototypes, but component instances do things! A component instance can...

✅ Accept Properties: immutable concept instances passed down by its parent.

Use these to...
- pass environment variables to an app deployment (which is like a component instance);
- pass custom traits and elements to a reusable design component or a part of your app.

✅ Maintain Storage: mutable concept instances that only the component instance can access.

Use this to...
- hold temporary state while a component is active;
- store values in memory while an app is running;
- save and load data from external persistent storage.

✅ Have Children, by creating component instances and passing properties to them.

✅ Fire Events to its parent, by responding when its children fire events.

#### 📚 Concepts Tab

The Concepts Tab lists your open concepts. Concepts are the types of information your components can interpret and manipulate.

Each concept has Properties and Methods. Components create concept instances, which are data structures conforming to the schema defined by a concept's properties. 

📦 A property is a concept with a unique name, within another concept of a certain type.

🏭 A method is a pure function which operates on a concept instance of a certain type, plus some parameters, to produce a new concept instance.

### 🔎 Inspector

The Inspector shows detail for items selected in the Explorer.

### 👀 Viewer

The Viewer shows a preview of items selected in the Explorer.
