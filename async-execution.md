---
layout: default
title: Async Execution
---

# Async Execution
{: .no_toc }

1. TOC
{:toc}

In addition to synchronous execution, Failsafe-go can execute a `func` asynchronously within a goroutine. Async executions return an [ExecutionResult] which can be used to detect when an execution is done and get the result or error, waiting if needed.

Executing a `func` asynchronously with a policy is simple: 

```go
// Run with retries asynchronously
result := failsafe.RunAsync(SendMessage, retryPolicy)
err := result.Error()

// Get with retries asynchronously
result := failsafe.GetAsync(Connect, retryPolicy)
connection, err := result.Get()
```

The `Error()` and `Get()` methods block until the execution is done. You can also use the `IsDone()` method or the `Done()` channel to detect when an execution is done:

```go
select {
case <-result.Done():
  connect, err := result.Get()
}
```

{% include common-links.html %}