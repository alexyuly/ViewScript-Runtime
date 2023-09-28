const cssPropertyNames = ["background", "color", "font", "padding"];

export const cssSupports = (propertyName: string) =>
  cssPropertyNames.includes(propertyName);

// TODO Consider using CSS.Supports as part of this implementation.
// For now, it seems faster and more stable to use a constant list of available properties.
