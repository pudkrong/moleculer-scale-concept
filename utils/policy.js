const { Policy, SamplingBreaker, ConsecutiveBreaker, TimeoutStrategy } = require('cockatiel');

class AscPolicy {
  static retry (attempts = 2, backoffOptions = { maxDelay: 30 * 1000, exponent: 2, initialDelay: 128 }) {
    return Policy.handleAll().retry().attempts(attempts).exponential(backoffOptions);
  }

  static timeout (duration = 3000) {
    return Policy.timeout(duration, TimeoutStrategy.Aggressive).dangerouslyUnref();
  }

  static circuitBreaker (halfOpenAfter = 10 * 1000, breakerOptions = { type: 'sampling', options: { threshold: 0.2, duration: 30 * 1000 }}) {
    let breaker;
    switch (breakerOptions.type) {
      case 'consecutive':
        breaker = new ConsecutiveBreaker(breakerOptions.options.threshold);
        break;
      default:
        breaker = new SamplingBreaker(breakerOptions.options);
        break;
    }

    return Policy.handleAll().circuitBreaker(halfOpenAfter, breaker);
  }

  static polify (fn, ...policies) {
    const policy = Policy.wrap(...policies);
    return (...args) => {
      return policy.execute(() => { return fn.call(fn, ...args); });
    };
  }
}

module.exports = AscPolicy;
