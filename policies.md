---
layout: default
title: Policies
---

# Policies
{: .no_toc }

1. TOC
{:toc}

Failsafe-go provides several resilience policies including [Retry][retry], [Circuit Breaker][circuit-breakers], [Rate Limiter][rate-limiters], [Timeout][timeouts], [Fallback][fallbacks], [Hedge][hedge], and [Bulkhead][bulkheads]. While each policy handles failures in different ways, some of their common features are described below.

## Failure Handling

Policies add resilience by detecting failures and handling them. Each policy determines which execution [results, errors, or conditions][FailurePolicyBuilder] represent a failure and how to handle them. 

Some policies, such as a [Retry][retry], [Circuit Breaker][circuit-breakers], and [Fallback][fallbacks], allow you to specify which errors or results to handle as failures. By default these policies handle any `error` that is returned. But they can be configured to handle more specific errors or results:

```go
builder.
  HandleErrors(ErrClosed, ErrShutdown).
  HandleResult(nil)
```

They can also be configured to handle specific conditions:

```go
builder.HandleIf(func(response *http.Response, err error) bool {
  return response.StatusCode == 500
})
```

If multiple handle methods are configured, they are logically OR'ed. The default `error` handling condition is only replaced by another condition that handles errors. A `HandleResult` setting will not replace the default `error` handling.

## Policy Composition

Policies can be composed in any way desired, including multiple policies of the same type. Policies handle execution results in reverse order, similar to the way that function composition works. For example, consider:

```go
failsafe.Get(fn, fallback, retryPolicy, circuitBreaker, timeout)
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

- `failsafe.Get` calls the `Fallback`
- `Fallback` calls the `RetryPolicy`
- `RetryPolicy` calls the `CircuitBreaker`
- `CircuitBreaker` returns `ErrOpen` if the breaker is open, else calls the `func`
- `func` executes and returns a result or error
- `CircuitBreaker` records the result as either a success or failure, based on its [configuration](#failure-handling), possibly changing the state of the breaker, then returns
- `RetryPolicy` records the result as either a success or failure, based on its [configuration](#failure-handling), and either retries or returns
- `Fallback` handles the result or error according to its configuration and returns a fallback result or error if needed
- `failsafe.Get` returns the final result or error to the caller

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

A common policy composition might place a `Fallback` as the outer-most policy, followed by a `RetryPolicy` or `HedgePolicy`, a `CircuitBreaker` or `RateLimiter`, a `Bulkhead`, and a `Timeout` as the inner-most policy:

```go
failsafe.NewExecutor[any](fallback, retryPolicy, circuitBreaker, bulkhead, timeout)
```

That said, it really depends on how the policies are being used, and different compositions make sense for different use cases.

## Policy Reuse

All policies are safe to reuse across different executions. While some policies are stateless, others such as [Circuit Breaker][circuit-breakers], [Rate Limiter][rate-limiters], and [Bulkhead][bulkheads] are stateful, and are specifically meant to be shared across different executions that access the same resources.

## Supported Policies

Read about the built-in policies that Failsafe supports:

- [Retry][retry]
- [Circuit Breaker][circuit-breakers]
- [Rate Limiter][rate-limiters]
- [Timeout][timeouts]
- [Fallback][fallbacks]
- [Hedge][hedge]
- [Bulkhead][bulkheads]
- [Cache][cache]

{% include common-links.html %}