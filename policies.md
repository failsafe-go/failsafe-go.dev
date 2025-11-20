---
layout: default
title: Policies
---

# Policies
{: .no_toc }

1. TOC
{:toc}

Failsafe-go provides numerous resilience policies. While each policy handles failures in different ways, some of their common features are described below.

## Failure Handling

Policies add resilience by detecting failures and handling them. Each policy determines which execution [results, errors, or conditions][FailurePolicyBuilder] represent a failure and how to handle them. 

Some policies, such as a [Retry][retry], [Circuit Breaker][circuit-breakers], [Adaptive Throttler][adaptive-throttlers], and [Fallback][fallbacks], allow you to specify which errors or results to handle as failures. By default these policies handle any `error` that is returned. But they can be configured to handle more specific errors, error types, or results:

```go
builder.
  HandleErrors(ErrClosed, ErrShutdown).
  HandleErrorTypes(net.OpError{}, new(net.Error)).
  HandleResult(nil)
```

They can also be configured to handle specific conditions:

```go
builder.HandleIf(func(response *http.Response, err error) bool {
  return response != nil && response.StatusCode == 500
})
```

If multiple handle methods are configured, they are logically OR'ed. The default `error` handling condition is only replaced by another condition that handles errors. A `HandleResult` setting will not replace the default `error` handling.

## Policy Composition

Policies can be composed in any way desired, including multiple policies of the same type. Policies are composed around a function from left to right, similar to have function composition works, where the inner-most policy handles a function result first. For example, consider:

```go
failsafe.With(fallback).
  Compose(retryPolicy).
  Compose(circuitBreaker).
  Compose(timeout).
  Get(fn)
```

The same statement can also be written as:

```go
failsafe.With(fallback, retryPolicy, circuitBreaker, timeout).Get(fn)
```

This results in the following composition when executing the `fn` and handling its result:

```
Fallback(RetryPolicy(CircuitBreaker(Timeout(fn))))
```

### Executing a Policy Composition

The process for executing a policy composition begins with Failsafe-go calling the outer-most policy. That policy in turn calls the next inner policy, and so on, until the user-provided `func` is reached. A result or error is returned back through the policy layers, and handled if needed by any policy along the way.

Each policy makes its own decision to allow an execution attempt to proceed and how to handle an execution result or error. For example, a `RetryPolicy` may retry an execution, which calls the next inner policy again, or it may return the result or error. A `CircuitBreaker` may return an error before an execution attempt even makes it to the `func`.

### Example Execution

Consider an execution of the following policy composition:

<img class="composition" src="/assets/images/composition.png">

- `Get` calls the `Fallback`
- `Fallback` calls the `RetryPolicy`
- `RetryPolicy` calls the `CircuitBreaker`
- `CircuitBreaker` returns `ErrOpen` if the breaker is open, else calls the `func`
- `func` executes and returns a result or error
- `CircuitBreaker` records the result as either a success or failure, based on its [configuration](#failure-handling), possibly changing the state of the breaker, then returns
- `RetryPolicy` records the result as either a success or failure, based on its [configuration](#failure-handling), and either retries or returns
- `Fallback` handles the result or error according to its configuration and returns a fallback result or error if needed
- `Get` returns the final result or error to the caller

### Composition and Error Handling

While policies handle all `error` instances by default, it's common to configure a policy to handle more specific errors, as [described above](#failure-handling):

```go
policyBuilder.HandleErrors(ErrClosed)
```

But when doing so for a policy that is composed around other policies, you may want to also configure an outer policy to handle errors returned by any inner policies, depending on your use case:

```go
policyBuilder.HandleErrors(
  retrypolicy.ErrExceeded,
  circuitbreaker.ErrOpen,
  timeout.ErrExceeded
)
```

### Composition Recommendations

A common policy composition ordering might place a `Fallback` as the outer-most policy, followed by a `CachePolicy`, a `RetryPolicy` or `HedgePolicy`, a `CircuitBreaker`, `AdaptiveLimiter`, `AdaptiveThrottler` or `RateLimiter`, a `Bulkhead`, and a `Timeout` as the inner-most policy:

```go
failsafe.With(fallback, cachePolicy, retryPolicy, circuitBreaker, bulkhead, timeout)
```

That said, it really depends on how the policies are being used, and different compositions make sense for different use cases.

## Policy Sharing

All policies are safe to share across different executions. While some policies such as [Retry Policy][retry] stateless, others such as [Circuit Breaker][circuit-breakers], [Adaptive Limiter][adaptive-limiters], [Adaptive Throttler][adaptive-throttlers], [Rate Limiter][rate-limiters], and [Bulkhead][bulkheads] are stateful, and are meant to be shared across different executions that access the same resources.

### Mixing Result Types

When composing shared policies, it's common for the shared policy to have `any` as the result type. These can be composed _inside_ policies with specific result types:

```go
circuitBreaker := circuitbreaker.NewWithDefaults[any]()
retryPolicy := retrypolicy.NewWithDefaults[Connection]()

// Compose RetryPolicy[Connection] around CircuitBreaker[any]
failsafe.With(retryPolicy).ComposeAny(circuitBreaker)
```

Or they can be composed _outside_ other policies:

```go
// Compose CircuitBreaker[any] around RetryPolicy[Connection]
failsafe.WithAny[Connection](circuitBreaker).Compose(retryPolicy)
```

## Supported Policies

Read about the built-in policies that Failsafe supports:

- [Retry][retry]
- [Circuit Breaker][circuit-breakers]
- [Adaptive Limiter][adaptive-limiters]
- [Adaptive Throttler][adaptive-throttlers]
- [Rate Limiter][rate-limiters]
- [Timeout][timeouts]
- [Fallback][fallbacks]
- [Hedge][hedge]
- [Bulkhead][bulkheads]
- [Cache][cache]

{% include common-links.html %}