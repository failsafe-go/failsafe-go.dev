---
layout: default
title: Type Safety
---

# Type Safety

Failsafe-go's APIs are typed based on the expected execution result. For some policies and executions, this type may not matter:

```go
retryPolicy := retrypolicy.NewWithDefaults[any]()
err := failsafe.With(retryPolicy).Run(Connect)
```

But for other cases you might declare a more specific result type:

```go
retryPolicy := retrypolicy.NewBuilder[*http.Response]().
  HandleIf(func(response *http.Response, err error) bool {
    return response != nil && response.StatusCode == 500
  }).
  OnFailure(func(e failsafe.ExecutionEvent[*http.Response]) {
    logger.Error("Failed attempt", "statusCode", e.LastResult().StatusCode)
  }).
  Build()
```

This allows Failsafe-go to ensure that the same result type used for the policy is returned by the execution and is available in [event listeners][event-listeners]:

```go
response, err := failsafe.With(retryPolicy).
  OnSuccess(func(e failsafe.ExecutionDoneEvent[*http.Response]) {
    logger.Info("Request sent", "statusCode", e.Result.StatusCode)
  }).
  Get(SendHttpRequest)
```

It also ensures that when multiple policies are composed, they all share the same result type:

```go
circuitBreaker := circuitbreaker.NewWithDefaults[*http.Response]()
response, err := failsafe.With(retryPolicy, circuitBreaker).Get(SendHttpRequest)
```

## Mixing Result Types

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

{% include common-links.html %}