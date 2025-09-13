---
layout: default
title: Adaptive Throttler
---

# Adaptive Throttler
{: .no_toc }

1. TOC
{:toc}

[Adaptive throttlers][AdaptiveThrottler] are probabalistic load shedders that limit load based on recent failures, as described in the [Google SRE Book][throttling]. They're similar to [circuit breakers][circuit-breakers] since they're driven by recent failures, but rather than being all on or off like a circuit breaker, they reject only some requests based on how overloaded they are.

## Basic Usage

Creating and using an [AdaptiveThrottler] is straightforward:

```go
// Starts rejecting at 10% failures per minute, after 5 executions, up to 90% max rejections
throttler := adaptivethrottler.NewBuilder[string]().
  HandleErrors(ErrConnecting).
  WithFailureRateThreshold(0.1, 5, time.Minute).
  WithMaxRejectionRate(.9).
  Build()

// Get with adaptive throttling
response, err := failsafe.Get(FetchData, throttler)
```

## How it Works

[Adaptive throttlers][AdaptiveThrottler] track recent failures over some time period. When the recent failure rate exceeds the configured threshold, then the throttler will start probablistically rejecting requests. The rejection rate will gradually increase based on how far over the threshold the failure rate is, stopping at the max rate. Any executions that are rejected will fail with `ErrExceeded`.

## Failure Handling

An [AdaptiveThrottler] can be configured to handle only [certain results, errors, or conditions][failure-handling] as failures:

```go
builder.
  HandleErrors(ErrConnecting).
  HandleResult(nil)
```

## Execution Prioritization

Adaptive throttlers can optionally decide which executions to reject based on their priority, where lower priority executions are rejected before high priority ones. See the [execution prioritization][execution-prioritization] docs for more info.

## Metrics

[AdaptiveThrottler] provides [metrics][AdaptiveThrottlerMetrics] that include the current rejection rate. 

## Standalone Usage

A [AdaptiveThrottler] can also be manually operated in a standalone way:

```go
if throttler.TryAcquirePermit() {
  if err := doSomething(); err != nil {
    throttler.RecordError(err)
  else {
    throttler.RecordSuccess()
  }
}
```

## Best Practices

An [AdaptiveThrottler] can and *should* be shared across code that accesses common dependencies. For example, if multiple connections or requests are made to the same external server, typically they should all go through the same throttler.

### Composing Adaptive Throttlers

When [composing policies][policy-composition], it's recommended to not have an adaptive throttler handle errors from other policies, such as `bulkhead.ErrFull` or `ratelimiter.ErrExceeded`. If an execution is rejected by any policy, there's no need to have an adaptive throttler record it in addition. This makes it easier to reason about when a throttler does reject an execution.

[throttling]: https://sre.google/sre-book/handling-overload/#client-side-throttling-a7sYUg

{% include common-links.html %}