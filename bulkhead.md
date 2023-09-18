---
layout: default
title: Bulkhead
---

# Bulkhead
{: .no_toc }

1. TOC
{:toc}

[Bulkheads][Bulkhead] allow you to restrict concurrent executions as a way of preventing system overload. Creating a [Bulkhead] is straightforward:

```go
// Permits 10 concurrent executions
bulkhead := bulkhead.With[any](10)
```

## How It Works

Executions are permitted in a bulkhead until it is full, meaning the max number of concurrent executions has been reached. Any further executions will either fail with `ErrBulkheadFull ` or will wait until permitted.

## Waiting

By default, when the max concurrent executions are exceeded, further executions will immediately fail with `ErrBulkheadFull `. A bulkhead can also be configured to wait for execution permission if it can be achieved within a max wait time:

```go
// Wait up to 1 second for execution permission
bulkhead := bulkhead.Builder[any](10).
  WithMaxWaitTime(time.Second).
  Build()
```

Fairness is guaranteed with waiting executions, meaning they're permitted in the order they're received. Actual wait times for a bulkhead can vary depending on how busy it is. Since executions will block while waiting on a rate limiter, a `maxWaitTime` should be chosen carefully to avoid excessive blocking.

## Event Listeners

A [Bulkhead] can notify you with an [ExecutionEvent] when a rate limit has been exceeded by an execution attempt:

```go
builder.OnBulkheadFull(func(e failsafe.ExecutionEvent[any]) {
  fmt.Println("Bulkhead full")
})
```

## Best Practices

A [Bulkhead] can and *should* be shared across code that accesses finite resources. This ensures that if the bulkhead is full, all executions that access the same resource and use the same bulkhead will either wait or fail until executions are permitted again. For example, if multiple connections or requests are made to the same external server, you may route them through the same bulkhead.

## Standalone Usage

A [Bulkhead] can also be manually operated in a standalone way:

```go
if bulkhead.TryAcquirePermit() {
  doSomething()
  bulkhead.releasePermit()
}
```

{% include common-links.html %}