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
  value: string | null
) => {
  element.style.setProperty(name, value === null ? null : String(value));
  window.console.log(
    `[DOM] 💧 Update <${element.tagName.toLowerCase()}> ${name} =`,
    value
  );
};

export const attribute = (
  element: HTMLElement,
  name: string,
  value: string | null
) => {
  element.setAttribute(name, value === null ? "" : String(value));
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
    // TODO Add support for processing the Event passed to this listener.

    window.console.log(
      `[DOM] 🔥 Fire ${event} on <${element.tagName.toLowerCase()}>`
    );
    callback();
  });
};

export const render = (elements: Array<HTMLElement>) => {
  window.document.body.append(...elements);

  window.console.log(`[DOM] 🪴 Render:`, elements);
};
