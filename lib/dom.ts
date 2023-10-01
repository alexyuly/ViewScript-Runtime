export const create = (tagName: string) => {
  const htmlElement = window.document.createElement(tagName.toLowerCase());
  window.console.log(
    `[DOM] 🔩 <${tagName.toLowerCase()}> created`,
    htmlElement
  );
  return htmlElement;
};

export const append = (element: HTMLElement, child: HTMLElement) => {
  element.appendChild(child);
  window.console.log(
    `[DOM] 🔧 <${child.tagName.toLowerCase()}> appended to <${element.tagName.toLowerCase()}>`,
    child
  );
};

export const textContent = (element: HTMLElement, value: string | null) => {
  element.textContent = value === null ? null : String(value);
  window.console.log(
    `[DOM] 💧 <${element.tagName.toLowerCase()}> textContent =`,
    value
  );
};

export const styleProp = (
  element: HTMLElement,
  name: string,
  value: string | null
) => {
  element.style.setProperty(name, value === null ? null : String(value));
  window.console.log(
    `[DOM] 💧 <${element.tagName.toLowerCase()}> ${name} =`,
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
    `[DOM] 💧 <${element.tagName.toLowerCase()}> ${name} =`,
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

    window.console.log(`[DOM] 🔥 <${element.tagName.toLowerCase()}> ${event}`);
    callback();
  });
};
