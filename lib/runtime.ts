import * as Abstract from "./abstract";
import { Listener, Publisher } from "./helpers";

export class App {
  constructor(app: Abstract.App) {
    new Renderable(app.renders);
  }
}

class Field<T extends Abstract.Value>
  extends Publisher<T>
  implements Listener<T>
{
  private readonly publisher?: Publisher<T>;

  constructor(field: Abstract.Field) {
    super();

    if (field.publisher.kind === "store") {
      this.publisher = new Store(field.publisher);
    } else {
      // TODO
    }
  }

  take(value: T): void {
    this.publish(value);
  }
}

class Store<T extends Abstract.Value>
  extends Publisher<T>
  implements Listener<T>
{
  private value: T;

  constructor(store: Abstract.Store) {
    super();

    this.value = store.value as T;
  }

  getValue() {
    return this.value;
  }

  take(value: T): void {
    this.value = value;
    this.publish(value);
  }
}

class Action {
  // TODO
}

class Renderable {
  constructor(renderable: Abstract.Renderable) {
    if (renderable.body.kind === "atom") {
      new Atom(renderable.body);
    } else {
      new Organism(renderable.body);
    }
  }
}

class Atom {
  constructor(atom: Abstract.Atom) {
    const htmlElement = window.document.createElement(atom.tagName);

    Object.entries(atom.properties).forEach(([name, property]) => {
      if (property.kind === "action") {
        const action = new Action(property);

        htmlElement.addEventListener(name, (event) => {
          action.take(event);
        });
      } else {
        const field = new Field(property);

        field.listen({
          take: (value) => {
            if (name === "content") {
              // TODO
            } else if (window.CSS.supports(name, String(value))) {
              htmlElement.style.setProperty(name, String(value));
            } else if (value === false) {
              htmlElement.removeAttribute(name);
            } else {
              htmlElement.setAttribute(name, String(value));
            }
          },
        });
      }
    });
  }
}
