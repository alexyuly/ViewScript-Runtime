import GenericComponent from "./GenericComponent.mjs";

/**
 * Boxes a number value
 */
export default class TimerComponent extends GenericComponent {
  constructor(parameters, handlers) {
    super(parameters, handlers);

    // TODO set up setTimeout or setInterval based on initial parameters
    // TODO subscribe to parameters changing, and update things accordingly
  }
}
