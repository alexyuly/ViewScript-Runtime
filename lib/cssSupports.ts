const cssPropertyNames = ["background", "color", "cursor", "font", "padding"];

export const cssSupports = (propertyName: string) =>
  cssPropertyNames.includes(propertyName);
