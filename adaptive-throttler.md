---
layout: default
title: Adaptive Throttler
---

# Adaptive Throttler
{: .no_toc }

1. TOC
{:toc}

[Adaptive throttlers][AdaptiveThrottler] are probabalistic load shedders that limit load based on recent failures, as described in the [Google SRE Book][throttling].

## Usage

Creating and using an [AdaptiveThrottler] is straightforward:

```go
// Starts rejecting at 10% failures per minute, after 5 executions, up to 90% max rejections
throttler := adaptivethrottler.NewBuilder[string]().
  HandleErrors(ErrConnecting).
  WithFailureRateThreshold(0.1, 5, time.Minute).
  WithMaxRejectionRate(.9).
  Build()

// Get with adaptive throttling
response, err := failsafe.With(throttler).Get(FetchData)
```

## How it Works

[Adaptive throttlers][AdaptiveThrottler] track recent failures over some time period. When the recent failure rate exceeds the configured threshold, then the throttler will start probablistically rejecting requests. The rejection rate will gradually increase based on how far over the threshold the failure rate is, stopping at the max rate. Any executions that are rejected will fail with `adaptivethrottler.ErrExceeded`.

## Policy Comparison

[Adaptive throttlers][AdaptiveThrottler] are similar to [circuit breakers][circuit-breakers] since they both limit load based on recent failures. But whereas circuit breakers reject all executions for some time period, adaptive throttlers only reject some executions based on how overloaded they are. This makes execution flows more smooth with adaptive throttlers, and also allows them to more quickly detect when overload ends.

## Configuration

### Failure Handling

An [AdaptiveThrottler] can be configured to handle only [certain results, errors, or conditions][failure-handling] as failures:

```go
builder.
  HandleErrors(ErrConnecting).
  HandleResult(nil)
```

### Failure Rate Threshold

A throttler's failure rate threshold configures the rate of failures over some time period, with a minimum number of executions, before executions start to get rejected.

```go
// Starts rejecting at 10% failures per minute, after 10 executions
builder.WithFailureRateThreshold(.1, 10, time.Minute)
```

### Max Rejection Rate

By default, the max rejection rate for a throttler is .9, but you can set a different rate:

```go
// Reject up to 75% of executions
builder.MaxRejectionRate(.75)
```

It's important to ues a value less than 1 to ensure that not all executions are rejected. Maintaining some flow of executions allows the throttler to detect when an overloaded system recovers.

### Execution Prioritization

Adaptive throttlers can optionally decide which executions to reject based on their priority, where lower priority executions are rejected before high priority ones. See the [execution prioritization][execution-prioritization] docs for more info.

### Event Listeners

Adaptive throttlers support the standard [policy listeners][policy-listeners].

### Metrics

[AdaptiveThrottler] provides [metrics][AdaptiveThrottlerMetrics] that include the current rejection rate. 

## Standalone Usage

An [AdaptiveThrottler] can also be manually operated in a standalone way:

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