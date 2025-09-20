---
layout: default
title: Rate Limiter
---

# Rate Limiter
{: .no_toc }

1. TOC
{:toc}

[Rate limiters][RateLimiter] are [load limiters][load-limiting] that limit the rate of executions. Failsafe-go supports two types of rate limiters: *smooth* and *bursty*. *Smooth* rate limiters permit a max number of executions per time period, using a leaky bucket approach to spread out executions at an even rate. *Bursty* rate limiters use a fixed window approach to permit a max number of executions for individual time periods, permitting bursts of executions in each time period.

## How It Works

When the number of executions through the rate limiter exceeds the configured max per time period, further executions will either fail with `ratelimiter.ErrExceeded` or will wait until permitted.

## Smooth Rate Limiter

Creating and using a smooth [RateLimiter] is simple:

```go
// Permits 100 executions per second
limiter := ratelimiter.NewSmooth(100, time.Second)
err := failsafe.Run(SendMessage, limiter)
```

The rate at which individual executions are permitted is based on the given `maxExecutions` and `period`. Alternatively, you can directly specify the max rate of individual executions:

```go
// Permits an execution every 10 milliseconds
limiter := ratelimiter.NewSmoothWithMaxRate(10*time.Millisecond)
```

Smooth rate limited executions are permitted with no delay up to the max rate, and are always performed at or below the max rate, avoiding potential bursts.

## Bursty Rate Limiter

Creating and using a bursty [RateLimiter] is also simple:

```go
// Permits 10 executions per second
limiter := ratelimiter.NewBursty(10, time.Second)
err := failsafe.Run(SendMessage, limiter)
```

Bursty rate limited executions are permitted with no delay up to the given `maxExecutions` per `period`. When a new period begins, the number of permitted executions is reset to the configured `maxExecutions`. This may cause bursts of executions when a new time period begins. Larger time periods may cause larger bursts.

## Configuration

### Waiting

By default, when a [RateLimiter] is exceeded, further executions will immediately fail with `ratelimiter.ErrExceeded`. A rate limiter can also be configured to wait for execution permission if it can be achieved within a max wait time:

```go
// Wait up to 1 second for execution permission
builder.WithMaxWaitTime(time.Second)
```

Actual wait times for a rate limiter can vary depending on how busy the rate limiter is. Wait times will grow if more executions are consistently attempted than the rate limiter permits.

### Event Listeners

A [RateLimiter] can notify you with an [ExecutionEvent] when a rate limit has been exceeded by an execution attempt:

```go
builder.OnRateLimitExceeded(func(e failsafe.ExecutionEvent[any]) {
  logger.Error("Rate limited")
})
```

## Standalone Usage

A [RateLimiter] can also be manually operated in a standalone way:

```go
if rateLimiter.TryAcquirePermit() {
  DoSomething()
}
```

You can also integrate a standalone rate limiter with an external scheduler to wait for a permit:

```go
permitWaitTime := rateLimiter.ReservePermit()
scheduler.Schedule(SomeFunc, permitWaitTime)
```

## Best Practices

A [RateLimiter] can and *should* be shared across code that accesses common dependencies. This ensures that if the rate limit is exceeded, all executions that share the same dependency and use the same rate limiter will either wait or fail until executions are permitted again. For example, if multiple connections or requests are made to the same external server, typically they should all go through the same rate limiter.

## Performance

Failsafe-go's internal [RateLimiter] implementation is efficient, with _O(1)_ time and space complexity.

{% include common-links.html %}