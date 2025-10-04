---
layout: default
title: Execution Info
---

# Execution Info

Failsafe-go can provide an [Execution] object containing execution related information such as the number of [execution attempts][Attempts], [start][StartTime] and [elapsed times][ElapsedTime], and the last [result][LastResult] or [error][LastError]:

```go
failsafe.With(retryPolicy).RunWithExecution(func(e failsafe.Execution[any]) error {
  logger.Info("Connecting", "attempts", e.Attempts())
  return Connect()
})
```

This is useful for retrying executions that depend on results from a previous attempt:

```go
failsafe.With(retryPolicy).GetWithExecution(func(e failsafe.Execution[int]) (int, error) {
  return e.LastResult() + 1, nil
})
```

The [Execution] object can also tell you if an execution is a [retry][IsRetry], a [hedge][IsHedge], or the [first attempt][IsFirstAttempt]:

```go
failsafe.With(retryPolicy).RunWithExecution(func(e failsafe.Execution[any]) error {
  if e.IsRetry() {
    logger.Info("Retrying connection attempt")
  }
  return Connect()
})
```

## Context

A [Context] can also be provided to an Execution, by configuring it with an [Executor]:

```go
executor := failsafe.With(retryPolicy).WithContext(ctx)
```

The [Context] will be available via an [Execution] or any [event][event-listeners].

{% include common-links.html %}