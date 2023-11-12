export const create = (tagName: string) => {
  const htmlElement = window.document.createElement(tagName.toLowerCase());
  window.console.log(`[DOM] 🌱 Create <${tagName.toLowerCase()}>`, htmlElement);
  return htmlElement;
};

export const populate = (element: HTMLElement, children: Array<HTMLElement | string>) => {
  element.replaceChildren(...children);
  window.console.log(`[DOM] 🌿 Populate <${element.tagName.toLowerCase()}>`, children);
};

export const styleProp = (element: HTMLElement, name: string, value: unknown) => {
  if (value == null || value === false) {
    element.style.removeProperty(name);
  } else {
    element.style.setProperty(name, String(value));
  }
  window.console.log(`[DOM] 💧 Update <${element.tagName.toLowerCase()}> ${name} =`, value);
};

export const attribute = (element: HTMLElement, name: string, value: unknown) => {
  if (value == null || value === false) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, value === true ? name : String(value));
  }
  window.console.log(`[DOM] 💧 Update <${element.tagName.toLowerCase()}> ${name} =`, value);
};

export const listen = (element: HTMLElement, event: string, callback: (value: Event) => void) => {
  element.addEventListener(event, (value) => {
    window.console.log(`[DOM] 🔥 Fire ${event} on <${element.tagName.toLowerCase()}>`);
    callback(value);
  });
};

export const render = (element: HTMLElement) => {
  window.document.body.append(element);
  window.console.log(`[DOM] 🪴 Render element:`, element);
};
