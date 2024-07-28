---
layout: default
title: Circuit Breaker
---

# Circuit Breaker
{: .no_toc }

1. TOC
{:toc}

[Circuit breakers][fowler-circuit-breaker] are [load limiters][load-limiting] that temporarily disable execution when failures occur. Failsafe-go supports two types of circuit breakers: *count based* and *time based*. *Count based* circuit breakers operate by tracking recent execution results up to a certain limit. *Time based* circuit breakers operate by tracking any number of execution results that occur within a time period.

## Usage

Creating and using a [CircuitBreaker] is straightforward, for example:

```go
// Opens after 5 failures, half-opens after 1 minute, closes after 2 successes
breaker := circuitbreaker.Builder[any]().
  HandleErrors(ErrSending).
  WithFailureThreshold(5).
  WithDelay(time.Minute).
  WithSuccessThreshold(2).
  Build()
  
// Run with circuit breaking
err := failsafe.Run(SendMessage, breaker)
```

## How it Works

When the number of recent execution failures exceed a configured threshold, the breaker is *opened* and further executions will fail with `ErrOpen`. After a delay, the breaker is *half-opened* and trial executions are allowed which determine whether the breaker should be *closed* or *opened* again. If the trial executions meet a success threshold, the breaker is *closed* again and executions will proceed as normal, otherwise it's re-*opened*.

## Failure Handling

A [CircuitBreaker] can be configured to handle only [certain results, errors, or conditions][failure-handling] as failures:

```go
builder.
  HandleErrors(ErrConnecting).
  HandleResult(nil)
```

## Configuration

[Circuit breakers][CircuitBreaker] can be flexibly configured to express when the breaker should be opened, half-opened, and closed.

### Opening

A circuit breaker is *count based* by default and will *open* after a single failure occurs. You can instead configure a circuit breaker to *open* when a successive number of executions have failed:

```go
builder.WithFailureThreshold(5)
```

Or when, for example, 3 out of the last 5 executions have failed:

```go
builder.WithFailureThresholdRatio(3, 5)
```

A *time based* circuit breaker can be configured to *open* when a number of failures occur within a time period:

```go
builder.WithFailureThresholdPeriod(3, time.Minute)
```

It can also be configured to *open* when the percentage rate of failures out of a minimum number of executions exceeds a threshold:

```go
builder.WithFailureRateThreshold(20, 5, time.Minute)
```

### Half-Opening

After opening, a breaker will delay for 1 minute by default before before transitioning to *half-open*. You can configure a different delay:

```go
builder.WithDelay(30*time.Second)
```

Or a [computed delay][WithDelayFunc] based on an execution result. 

When in an *open* state, you can also get the [remaining delay][RemainingDelay], so that callers know how long to wait before retrying:

```go
breaker.RemainingDelay()
```

### Closing

The breaker can be configured to *close* again if a number of trial executions succeed, else it will re-*open*:

```go
builder.WithSuccessThreshold(5)
```

The breaker can also be configured to *close* again if, for example, 3 out of the last 5 executions succeed, else it will re-*open*:

```go
builder.WithSuccessThresholdRatio(3, 5)
```

If a success threshold is not configured, then the failure threshold is used to determine if a breaker should transition from *half-open* to either *closed* or *open*.

## Event Listeners

In addition to the standard [policy listeners][policy-listeners], a [CircuitBreaker] can notify you when the [state of the breaker changes][OnStateChanged]:

```go
builder.OnStateChanged(func(e circuitbreaker.StateChangedEvent) {
  logger.Info("CircuitBreaker state changed", "oldState", e.OldState, "newState", e.NewState)
})
```

It can also notify you when the breaker [opens][OnOpen], [closes][OnClose], or [half-opens][OnHalfOpen].

## Metrics

[CircuitBreaker] provides [metrics][CircuitBreakerMetrics] for the current state that the breaker is in, including execution count, success count, failure count, success rate, and failure rate. 

## Best Practices

A [CircuitBreaker] can and *should* be shared across code that accesses common dependencies. This ensures that if the circuit breaker is opened, all executions that share the same dependency and use the same circuit breaker will be blocked until the circuit is closed again. For example, if multiple connections or requests are made to the same external server, typically they should all go through the same circuit breaker.

### Composing Circuit Breakers

When [composing policies][policy-composition], it's recommended to not have a circuit breaker handle errors from other policies, such as `bulkhead.ErrFull` or `ratelimiter.ErrExceeded`. If an execution is rejected by any policy, there's no need to have a circuit breaker open in addition. This makes it easier to reason about why a circuit breaker has opened, and avoids limiting load longer than is needed.

## Standalone Usage

A [CircuitBreaker] can also be manually operated in a standalone way:

```go
breaker.Open()
breaker.HalfOpen()
breaker.Close()

if breaker.TryAcquirePermit() {
  if err := doSomething(); err != nil {
    breaker.RecordError(err)
  else {
    breaker.RecordSuccess()
  }
}
```

## Time Based Resolution

*Time based* circuit breakers use a sliding window to aggregate execution results. As time progresses and newer results are recorded, older results are discarded. In order to maintain space and time efficiency, results are grouped into 10 time slices, each representing 1/10th of the configured failure threshold period. When a time slice is no longer within the thresholding period, its results are discarded. This allows the circuit breaker to operate based on recent results without needing to track the time of each individual execution.

## Performance

Failsafe-go's internal [CircuitBreaker] implementation is space and time efficient, utilizing a single circular data structure to record execution results. Recording an execution and evaluating a threshold has an _O(1)_ time complexity, regardless of the thresholding capacity.

{% include common-links.html %}