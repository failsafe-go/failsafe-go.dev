---
layout: default
title: Event Listeners
---

# Event Listeners
{: .no_toc }

1. TOC
{:toc}

Failsafe-go supports event listeners, both at the top level [failsafe.Executor][Executor] API, and in the different policy implementations.

## Executor Listeners

At the top level, Failsafe-go can notify you when an execution is done:

```go
failsafe.With(retryPolicy, circuitBreaker).
  OnDone(func(e failsafe.ExecutionDoneEvent[any]) {
    if e.Error != nil {
      logger.Error("Failed to create connection", "error", e.Error)
    } else {
      logger.Info("Connected", "connection", e.Result)
    }
  }).
  Get(Connect)
```

It can notify you when an execution is successful for *all* policies:

```go
executor.OnSuccess(func(e failsafe.ExecutionDoneEvent[*http.Response]) {
  logger.Info("Request succeeded")
})
```

Or when an execution fails for *any* policy:

```go
executor.OnFailure(func(e failsafe.ExecutionDoneEvent[*http.Response]) {
  logger.Error("Request failed")
})
```

If any policy fails to handle an execution failure, as specified by the policy's [failure handling configuration][failure-handling], then the execution is considered a failure and [OnFailure] will be called, otherwise it's considered a success and [OnSuccess] is called. [OnDone] will be called for every execution. 

Errors from policies themselves, such as `circuitbreaker.ErrOpen`, `retrypolicy.ErrExceeded`, or `timeout.ErrExceeded`, are considered failures if they're not handled by an outer policy.

## Policy Listeners

Policies that can be configured to handle specific results or errors, such as [RetryPolicy][retry], [CircuitBreaker][circuit-breakers], [AdaptiveThrottler][adaptive-throttlers], and [Fallback][fallbacks], provide event listeners that indicate when an execution attempt succeeds or fails according to that policy's [failure handling configuration][failure-handling]:

```go
policyBuilder.
  OnSuccess(func(e failsafe.ExecutionEvent[Connection]) {
    logger.Info("Connected", "connection", e.LastResult())
  }).
  OnFailure(func(e failsafe.ExecutionEvent[Connection]) {
    logger.Error("Failed to create connection", "error", e.LastError())
  })
```

Additional listeners are available for different policies.

## Alternative Execution Results

Event listeners are meant for side effects such as logging and metrics. They do not influence the outcome of an execution. To provide an alternative execution result, use a [Fallback][fallbacks].

{% include common-links.html %}