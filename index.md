---
layout: default
title: Fault tolerance and resilience patterns for Go
---

# Overview

Failsafe-go is a library for building resilient, fault tolerant Go applications. It works by wrapping functions with one or more resilience [policies], which can be combined and [composed][policy-composition] as needed. Policies include:

- Failure handling: [Retry][retry], [Fallback][fallbacks]
- Load limiting: [Circuit Breaker][circuit-breakers], [Adaptive Limiter][adaptive-limiters], [Adaptive Throttler][adaptive-throttlers], [Bulkhead][bulkheads], [Rate Limiter][rate-limiters], [Cache][caches]
- Time limiting: [Timeout][timeouts], [Hedge][hedge]

## Getting Started

To see how Failsafe-go works, we'll create a [retry policy][retry] that defines which failures to handle and when retries should be performed:

```go
retryPolicy := retrypolicy.NewBuilder[SomeResponse]().
  HandleErrors(ErrConnecting).
  WithDelay(time.Second).
  WithMaxRetries(3).
  Build()
```

We can then [Run] or [Get] a result from a `func` *with* retries:

```go
// Run with retries
err := failsafe.With(retryPolicy).Run(Connect)

// Get with retries
response, err := failsafe.With(retryPolicy).Get(SendRequest)
```

### Asynchronous Execution

Executing a `func` [asynchronously][async-execution] *with* retries is simple:

```go
// Run asynchronously with retries
result := failsafe.With(retryPolicy).RunAsync(Connect)

// Get asynchronously with retries
result := failsafe.With(retryPolicy).GetAsync(SendRequest)
```

The returned [ExecutionResult] can be used to wait for the execution to be done and gets its result or error.

### Composing Policies

Multiple [policies] can be composed to add additional layers of resilience or to handle different failures in different ways:

```go
fallback := fallback.NewWithResult(backupConnection)
circuitBreaker := circuitbreaker.NewWithDefaults[Connection]()
timeout := timeout.New[Connection](10*time.Second)

// Get with fallback, retries, circuit breaker, and timeout
connection, err := failsafe.With(fallback, retryPolicy, circuitBreaker, timeout).Get(Connect)
```

Order does matter when composing policies. See the [policy composition][policy-composition] overview for more details.

### Executor

Policy compositions can also be saved and reused via an [Executor]:

```go
executor := failsafe.With(retryPolicy, circuitBreaker)
err := executor.Get(Connect)
```

## Further Reading

Read more about [policies] and how they're used, then explore some of Failsafe-go's other features in the site menu.

{% include common-links.html %}