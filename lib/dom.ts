import type { Value } from "./abstract";

export const create = (tagName: string) => {
  const htmlElement = window.document.createElement(tagName.toLowerCase());
  window.console.log(`[DOM] 🌱 Create <${tagName.toLowerCase()}>`, htmlElement);
  return htmlElement;
};

export const populate = (
  element: HTMLElement,
  children: Array<HTMLElement | string>
) => {
  element.replaceChildren(...children);
  window.console.log(
    `[DOM] 🌿 Populate <${element.tagName.toLowerCase()}>`,
    children
  );
};

export const styleProp = (
  element: HTMLElement,
  name: string,
  value?: Value
) => {
  if (value === undefined) {
    element.style.removeProperty(name);
  } else {
    element.style.setProperty(name, String(value));
  }
  window.console.log(
    `[DOM] 💧 Update <${element.tagName.toLowerCase()}> ${name} =`,
    value
  );
};

export const attribute = (
  element: HTMLElement,
  name: string,
  value?: Value
) => {
  if (value === undefined || (typeof value === "boolean" && !value)) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(
      name,
      typeof value === "boolean" ? name : String(value)
    );
  }
  window.console.log(
    `[DOM] 💧 Update <${element.tagName.toLowerCase()}> ${name} =`,
    value
  );
};

export const listen = (
  element: HTMLElement,
  event: string,
  callback: () => void
) => {
  element.addEventListener(event, () => {
    window.console.log(
      `[DOM] 🔥 Fire ${event} on <${element.tagName.toLowerCase()}>`
    );
    callback();
  });
};

export const render = (element: HTMLElement) => {
  window.document.body.append(element);
  window.console.log(`[DOM] 🪴 Render element:`, element);
};
