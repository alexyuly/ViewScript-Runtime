import GenericComponent from "./GenericComponent.mjs";

/**
 * Boxes a number value
 */
export default class TimerComponent extends GenericComponent {
  constructor(parameters, handlers) {
    super(parameters, handlers);

    const restartTimer = (newParameters) => {
      const cancelToken = (newParameters.loops ? setInterval : setTimeout)(
        () => {
          this.reportEvent("time");
        },
        newParameters.period
      );
    };

    restartTimer({
      loops: parameters.loops.value,
      paused: parameters.paused.value,
      period: parameters.period.value,
    });
  }
}
