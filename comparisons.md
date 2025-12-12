---
layout: default
title: Comparisons
---

# Comparisons
{: .no_toc }

1. TOC
{:toc}

## Retries

### Failsafe-go vs cenkalti/backoff

[cenkalti/backoff](https://github.com/cenkalti/backoff) is an expontial backoff retry implementation. It differs from Failsafe-go's [RetryPolicy][retry] in a few ways:

- Failsafe-go allows you to combine settings for any retry scenario, including fixed, backoff, or random delays, jitter, max retries, and max duration, through a [single interface][RetryPolicyBuilder].
- Failsafe-go retries can be configured to handle [different results, errors, or conditions][failure-handling].
- Failsafe-go retries can be [aborted][aborts] on different results, errors, or conditions.
- Failsafe-go provides several retry related [event listeners][retry-listeners].
- Failsafe-go can perform [asynchronous executions][async-execution] with retries.
- Failsafe-go retry policies are concurrency safe.
- Failsafe-go retries can can receive [execution info][execution-info].
- Failsafe-go retries can be used with a [budget][budgets].
- Failsafe-go retries can [cooperate with cancellation][cooperative-cancellation].
- Failsafe-go retry backoff delays are computed automatically. [cenkalti/backoff] requires calling a function on each attempt.
- Failsafe-go retries can be [composed][policy-composition] with other policies.

## Circuit Breakers

### Failsafe-go vs gobreaker

[gobreaker] is a circuit breaker implementation. It differs from Failsafe-go's [CircuitBreaker][circuit-breakers] in a few ways:

- Failsafe-go offers count-based and time-based thresholding. [gobreaker] offers count-based thresholding. 
- Failsafe-go's circuit breaker provides a [single interface][CircuitBreakerBuilder] for configuring any scenario. [gobreaker] has different structs for different types of circuit breaking.
- Failsafe-go circuit breakers can threshold on recent execution results. [gobreaker] periodically clears execution results, losing recent data.
- Failsafe-go circuit breakers can be configured to handle [different results, errors, or conditions][failure-handling].
- Failsafe-go circuit breakers can be configured with separate [failure and success thresholds][circuit-breaker-configuration].
- Failsafe-go provides several circuit breaker [event listeners][circuit-breaker-listeners].
- Failsafe-go circuit breakers can be [manually operated][circuit-breaker-standalone].
- Failsafe-go circuit breakers can be [composed][policy-composition] with other policies.

## Hedges

### Failsafe-go vs cristalhq/hedgedhttp

[cristalhq/hedgedhttp] is an HTTP hedging implemetation. It differs from Failsafe-go's [HedgePolicy][hedge] in a few ways:

- Failsafe-go hedges can be used with any type of execution. [cristalhq/hedgedhttp] can be used to hedge HTTP requests.
- Failsafe-go hedges allow you to configure which results/errors to cancel outstanding hedges based on. [cristalhq/hedgedhttp] treats any non-error as a success.
- Failsafe-go supports [dynamic hedge delays][hedge-dynamic-delay].
- Failsafe-go provides hedge [event listeners][hedge-listeners].
- Failsafe-go hedges can be used with a [budget][budgets].
- Failsafe-go hedges can be [composed][policy-composition] with other policies.

{% include common-links.html %}

[cenkalti/backoff]: https://github.com/cenkalti/backoff
[gobreaker]: https://github.com/sony/gobreaker
[cristalhq/hedgedhttp]: https://github.com/cristalhq/hedgedhttp