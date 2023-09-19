---
layout: default
title: Execution Info
---

# Execution Info

Failsafe-go can provide an [Execution] object containing execution related information such as the number of [execution attempts][Attempts], [start][StartTime] and [elapsed times][ElapsedTime], and the last [result][LastResult] or [error][LastError]:

```go
failsafe.RunWithExecution(func(e failsafe.Execution[any]) error {
  logger.Info("Connecting", "attempts", e.Attempts());
  return Connect()
}, retryPolicy)
```

This is useful for retrying executions that depend on results from a previous attempt:

```go
failsafe.GetWithExecution(func(e failsafe.Execution[int]) (int, error) {
  return e.LastResult() + 1, nil
}, retryPolicy)
```

The [Execution] object can also tell you if an execution is being [retried][IsRetry] or if it's the [first attempt][IsFirstAttempt]:

```go
failsafe.RunWithExecution(func(e failsafe.Execution[any]) error {
  if e.IsRetry() {
    logger.Info("Retrying connection attempt")
  }
  return Connect()
}, retryPolicy)
```

{% include common-links.html %}