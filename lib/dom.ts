export const create = (tagName: string) => {
  const htmlElement = window.document.createElement(tagName.toLowerCase());
  window.console.log(`[DOM] 🌱 Create <${tagName.toLowerCase()}>`, htmlElement);
  return htmlElement;
};

export const append = (
  element: HTMLElement,
  child: HTMLElement | string | null
) => {
  if (child instanceof Node) {
    element.appendChild(child);
  } else if (child !== null) {
    element.insertAdjacentHTML("beforeend", child);
  }

  window.console.log(
    `[DOM] 🌿 Append to <${element.tagName.toLowerCase()}>:`,
    child
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
