---
layout: default
title: Rate Limiter
---

# Rate Limiter
{: .no_toc }

1. TOC
{:toc}

[Rate limiters][RateLimiter] allow you to control the rate of executions as a way of preventing system overload. Failsafe-go provides two types of rate limiting: *smooth* and *bursty*, which are discussed below.

## How It Works

When the number of executions through the rate limiter exceeds the configured max per time period, further executions will either fail with `ErrRateLimitExceeded` or will wait until permitted.

## Smooth Rate Limiter

A *smooth* rate limiter permits a max number of executions per time period, using a leaky bucket approach to spread out executions at an even rate. Creating a smooth [RateLimiter] is straightforward:

```go
// Permits 100 executions per second
limiter := ratelimiter.Smooth(100, time.Second)
```

The rate at which individual executions are permitted is based on the given `maxExecutions` and `period`. Alternatively, you can directly specify the max rate of individual executions:

```go
// Permits an execution every 10 milliseconds
limiter := ratelimiter.SmoothWithMaxRate(10*time.Millisecond)
```

Smooth rate limited executions are permitted with no delay up to the max rate, and are always performed at or below the max rate, avoiding potential bursts.

## Bursty Rate Limiter

A *bursty* rate limiter uses a fixed window approach to permit a max number of executions for individual time periods. Creating a bursty [RateLimiter] is also straightforward:

```go
// Permits 10 executions per second
limiter := ratelimiter.Bursty(10, time.Second)
```

Bursty rate limited executions are permitted with no delay up to the given `maxExecutions` for the current period. When a new period begins, the number of permitted executions is reset to the configured `maxExecutions`. This may cause bursts of executions when a new time period begins. Larger time periods may cause larger bursts.

## Waiting

By default, when a [RateLimiter] is exceeded, further executions will immediately fail with `ErrRateLimitExceeded`. A rate limiter can also be configured to wait for execution permission if it can be achieved within a max wait time:

```go
// Wait up to 1 second for execution permission
builder.WithMaxWaitTime(time.Second)
```

Actual wait times for a rate limiter can vary depending on busy the rate limiter is. Wait times will grow if more executions are consistently attempted than the rate limiter permits. Since executions will block while waiting on a rate limiter, a `maxWaitTime` should be chosen carefully to avoid excessive blocking.

## Event Listeners

A [RateLimiter] can notify you with an [ExecutionEvent] when a rate limit has been exceeded by an execution attempt:

```go
builder.OnRateLimitExceeded(func(e failsafe.ExecutionEvent[any]) {
  fmt.Println("Rate limited")
})
```

## Best Practices

A rate limiter can and *should* be shared across code that accesses common dependencies. This ensures that if the rate limit is exceeded, all executions that share the same dependency and use the same rate limiter will either wait or fail until executions are permitted again. For example, if multiple connections or requests are made to the same external server, typically they should all go through the same rate limiter.

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

## Performance

Failsafe's internal [RateLimiter] implementation is efficient, with _O(1)_ time and space complexity.

{% include common-links.html %}