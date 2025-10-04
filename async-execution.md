---
layout: default
title: Async Execution
---

# Async Execution
{: .no_toc }

1. TOC
{:toc}

Failsafe-go can execute a `func` asynchronously via a goroutine. Async executions return an [ExecutionResult] which can be used to detect when the execution is done and get the result or error, waiting if needed.

Executing a `func` asynchronously with a policy is simple: 

```go
// Run asynchronously with retries
result := failsafe.With(retryPolicy).RunAsync(SendMessage)
err := result.Error()

// Get asynchronously with retries
result := failsafe.With(retryPolicy).GetAsync(Connect)
connection, err := result.Get()
```

The `Error()` and `Get()` methods block until the execution is done. You can also use `IsDone()` or the `Done()` channel to detect when the execution is done:

```go
select {
case <-result.Done():
  connection, err := result.Get()
}
```

{% include common-links.html %}