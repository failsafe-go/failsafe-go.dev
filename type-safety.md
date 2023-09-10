---
layout: default
title: Type Safety
---

# Type Safety

Failsafe-go's APIs are typed based on the expected execution result. While for some executions and policies, this type may not matter:

```go
retryPolicy := retrypolicy.WithDefaults[any]()
```

But for other policies you might declare a more specific result type:

```go
retryPolicy := retrypolicy.Builder[*http.Response]().
  builder.HandleIf(func(response *http.Response, err error) bool {
    response.StatusCode == 500
  }).
  OnFailure(func(e failsafe.ExecutionEvent[*http.Response]) {
    fmt.Println("Failed attempt", e.LastResult().StatusCode)
  }).
  Build();
```

This allows Failsafe-go to ensure that the same result type used for the policy is returned by the execution and available in [event listeners][event-listeners]:

```go
response := Failsafe.NewExecutor(retryPolicy).
  OnSuccess(func(e failsafe.ExecutionCompletedEvent[*http.Response]) {
    fmt.Println("Request sent", e.Result().StatusCode)
  }).
  Get(SendHttpRequest)
```

It also ensures that when multiple policies are composed, they all share the same result type:

```go
circuitBreaker := circuitBreaker.WithDefaults[*http.Response]()
response, err := failsafe.Get(SendHttpRequest, retryPolicy, circuitBreaker)
```

{% include common-links.html %}