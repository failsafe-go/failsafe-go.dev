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

[cenkalti/backoff](https://github.com/cenkalti/backoff) is an expontial backoff retry implementation. It differs from Failsafe-go's retry policy in a few ways:

- Failsafe-go's [RetryPolicy] allows you to combine settings for any retry scenario, including fixed, backoff, or random delays, jitter, max retries, and max duration. [cenkalti/backoff] requires different structs for different types of retries.
- Failsafe-go retry policies can be configured to handle [different results, errors, or conditions][failure-handling]. [cenkalti/backoff] only retries on non-permanent errors.
- Failsafe-go retries can be aborted on different results, errors, or conditions.
- Failsafe-go provides several retry related event listeners.
- Failsafe-go can perform [asynchronous executions][async-execution] with retries.
- Failsafe-go retry policies are concurrency safe.
- Failsafe-go retries can can receive [execution context][execution-context].
- Failsafe-go retries can [cooperate with cancellation][cooperative-cancellation].
- Failsafe-go retry backoff delays are computed automatically. [cenkalti/backoff] requires you to call a function.
- Failsafe-go retries can be [composed][policy-composition] with other policies.

## Circuit Breakers

### Failsafe-go vs gobreaker

[gobreaker] is a circuit breaker implementation. It differs from Failsafe-go's circuit breaker in a few ways:

- Failsafe-go offers count-based and time-based thresholding. [gobreaker] only offers count-based thresholding. 
- Failsafe-go's [CircuitBreaker] provides a uniform interface for any scenario. [gobreaker] has different interfaces for one and two step circuit breaking.
- Failsafe-go circuit breakers can be configured to handle [different results, errors, or conditions][failure-handling].
- Failsafe-go circuit breakers can be configured with separate failure and success thresholds.
- Failsafe-go circuit breakers can be triggered by execution errors or results.
- Failsafe-go provides several circuit breaker event listeners.
- Failsafe-go circuit breakers can be [composed][policy-composition] with other policies.

{% include common-links.html %}

[cenkalti/backoff]: https://github.com/cenkalti/backoff
[gobreaker]: https://github.com/sony/gobreaker