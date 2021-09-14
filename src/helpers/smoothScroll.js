export let smoothScroll = function (element, target, duration) {
  target = Math.round(target);
  duration = Math.round(duration);
  if (duration < 0) {
    return new Error();
  }
  if (duration === 0) {
    element.scrollTop = target;
    return Promise.resolve();
  }

  let startTime = Date.now();
  let endTime = startTime + duration;

  let startTop = element.scrollTop;
  let distance = target - startTop;

  let smoothStep = function (start, end, point) {
    if (point <= start) {
      return 0;
    }
    if (point >= end) {
      return 1;
    }
    let x = (point - start) / (end - start);
    return x * x * (3 - 2 * x);
  };

  return new Promise(function (resolve, reject) {
    let previousTop = element.scrollTop;
    let scrollFrame = function () {
      if (element.scrollTop != previousTop) {
        return resolve();
      }

      let now = Date.now();
      let point = smoothStep(startTime, endTime, now);
      let frameTop = Math.round(startTop + distance * point);
      element.scrollTop = frameTop;

      if (now >= endTime) {
        resolve();
        return;
      }

      if (
        element.scrollTop === previousTop &&
        element.scrollTop !== frameTop
      ) {
        resolve();
        return;
      }
      previousTop = element.scrollTop;

      setTimeout(scrollFrame, 0);
    };

    setTimeout(scrollFrame, 0);
  });
};
