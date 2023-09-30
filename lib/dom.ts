export const append = (child: HTMLElement, parent: HTMLElement) => {
  parent.appendChild(child);
  window.console.log(
    `[DOM] 🔧 <${child.tagName.toLowerCase()}> appended to <${parent.tagName.toLowerCase()}>`,
    child
  );
};
