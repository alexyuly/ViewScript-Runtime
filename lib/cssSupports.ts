const cssPropertyNames = [
  "background",
  "border",
  "color",
  "cursor",
  "font",
  "margin",
  "padding",
];

export const cssSupports = (propertyName: string) =>
  cssPropertyNames.includes(propertyName);
