---
layout: default
title: Execution Cancellation
---

# Execution Cancellation
{: .no_toc }

1. TOC
{:toc}

Failsafe-go supports cancellation of executions. Cancellation can be triggered by [Timeouts][timeouts]:

```go
// Cancel Connect call after 1 second
failsafe.Get(Connect, timeout.With(time.Second))
```

They can also be triggered by a [Context]:

```go
ctx, cancel := context.WithCancel(context.Background())
go func() {
  time.Sleep(time.Second)
  cancel()
}

// Connect will be cancelled by the ctx after 1 second
failsafe.NewExecutor[any](retryPolicy).WithContext(ctx).Get(Connect)
```

While a cancellation from a [Timeout][timeouts] could still be retried by an outer [RetryPolicy][retry], a cancellation from a [Context] cannot be.

## Cooperative Cancellation

Executions can cooperate with a cancellation by checking [IsCanceled()][IsCanceled]:

```go
failsafe.RunWithExecution(func(e failsafe.Execution[int]) error {
  for {
    if e.IsCancelled() {
      return nil
    }
    
    if err := doWork(); err != nil {
      return err
    }
  }
  return nil
}, timeout)
```

Executions can also select on the [Canceled()][Canceled] channel to detect when an execution is cancelled.

{% include common-links.html %}