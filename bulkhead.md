---
layout: default
title: Bulkhead
---

# Bulkhead
{: .no_toc }

1. TOC
{:toc}

[Bulkheads][Bulkhead] are [load limiters][load-limiting] that limit concurrent executions. 

## Usage

Creating and using a [Bulkhead] is simple:

```go
// Permit 10 concurrent executions
bulkhead := bulkhead.New[any](10)
err := failsafe.With(bulkhead).Run(SendRequest)
```

## How It Works

Executions are permitted in a bulkhead until it is full, meaning the max number of concurrent executions has been reached. Any further executions will either fail with `bulkhead.ErrFull` or will wait until permitted.

## Configuration

### Waiting

By default, when the max concurrent executions are exceeded, further executions will immediately fail with `ErrFull`. A bulkhead can also be configured to wait for execution permission if it can be achieved within a max wait time:

```go
// Wait up to 1 second for execution permission
bulkhead := bulkhead.NewBuilder[any](10).
  WithMaxWaitTime(time.Second).
  Build()
```

Fairness is guaranteed with waiting executions, meaning they're permitted in the order they're received. Actual wait times for a bulkhead can vary depending on how busy it is. Since executions will block while waiting on a rate limiter, a `maxWaitTime` should be chosen carefully to avoid excessive blocking.

### Event Listeners

A [Bulkhead] can notify you with an [ExecutionEvent] when the bulkhead is full:

```go
builder.OnFull(func(e failsafe.ExecutionEvent[any]) {
  logger.Error("Bulkhead full")
})
```

`OnAcquired` runs after an execution acquires a permit. `OnReleased` runs immediately before that execution releases its permit, whether the execution succeeds or returns an error.

These listeners can track executions that hold a permit:

```go
// Requires sync/atomic.
var inflight atomic.Int64
builder.
  OnAcquired(func(e failsafe.ExecutionEvent[any]) {
    inflight.Add(1)
  }).
  OnReleased(func(e failsafe.ExecutionEvent[any]) {
    inflight.Add(-1)
  })
```

Neither listener runs when an execution fails to acquire a permit, including cancellation or an exceeded max wait time. Listener code must be safe for concurrent executions. These listeners provide side effects, such as logging and metrics, without changing execution results.

## Standalone Usage

A [Bulkhead] can also be manually operated in a standalone way:

```go
if bulkhead.TryAcquirePermit() {
  doSomething()
  bulkhead.ReleasePermit()
}
```

Standalone permit methods do not call `OnFull`, `OnAcquired`, or `OnReleased`. These listeners only apply to executions through Failsafe.

## Best Practices

A [Bulkhead] can and *should* be shared across code that accesses finite resources. This ensures that if the bulkhead is full, all executions that access the same resource and use the same bulkhead will either wait or fail until executions are permitted again. For example, if multiple connections or requests are made to the same external server, you may route them through the same bulkhead.

{% include common-links.html %}