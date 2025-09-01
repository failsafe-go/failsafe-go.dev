---
layout: default
title: Type Safety
---

# Type Safety

Failsafe-go's APIs are typed based on the expected execution result. For some policies and executions, this type may not matter:

```go
retryPolicy := retrypolicy.NewWithDefaults[any]()
err := failsafe.Run(Connect, retryPolicy)
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
response, err := failsafe.NewExecutor[*http.Response](retryPolicy).
  OnSuccess(func(e failsafe.ExecutionDoneEvent[*http.Response]) {
    logger.Info("Request sent", "statusCode", e.Result.StatusCode)
  }).
  Get(SendHttpRequest)
```

It also ensures that when multiple policies are composed, they all share the same result type:

```go
circuitBreaker := circuitbreaker.NewWithDefaults[*http.Response]()
response, err := failsafe.Get(SendHttpRequest, retryPolicy, circuitBreaker)
```

{% include common-links.html %}