const cssPropertyNames = ["background", "color", "font", "padding"];

export const cssSupports = (propertyName: string) =>
  cssPropertyNames.includes(propertyName);
