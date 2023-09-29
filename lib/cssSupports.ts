const cssPropertyNames = [
  "background",
  "border",
  "border-radius",
  "color",
  "cursor",
  "font",
  "font-size",
  "margin",
  "padding",
];

export const cssSupports = (propertyName: string) =>
  cssPropertyNames.includes(propertyName);
