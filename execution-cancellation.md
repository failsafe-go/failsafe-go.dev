---
layout: default
title: Execution Cancellation
---

# Execution Cancellation
{: .no_toc }

1. TOC
{:toc}

Failsafe-go supports execution cancellation, which can be triggered in a few ways. It can be triggered by a [Timeout][timeouts]:

```go
// Cancel Connect call after 1 second
failsafe.Get(Connect, timeout.With(time.Second))
```

By a [Context]:

```go
ctx, _ := context.WithTimeout(context.Background(), time.Second)

// Connect will be canceled by the ctx after 1 second
failsafe.NewExecutor[any](retryPolicy).WithContext(ctx).Get(Connect)
```

Or by an async [ExecutionResult]:

```go
result := failsafe.RunAsync(Connect, retryPolicy)
result.Cancel()
```

While a cancellation from a [Timeout][timeouts] can still be retried by an outer [RetryPolicy][retry], a cancellation from a [Context] or [ExecutionResult] cannot be.

## Execution Context

When providing a [Context] to an execution, a child Context will be created and made available via [Context()][Execution.Context]:

```go
failsafe.GetWithExecution(func(e failsafe.Execution[*http.Response]) (*http.Response, error) {
  request, err := http.NewRequestWithContext(e.Context(), http.MethodGet, "https://foo.com", nil)
  return client.Do(request)
}, timeout)
```

The is the Context that should be used in executions since it will be canceled when a [Timeout][timeouts] is exceeded, whereas the Context configured via [WithContext] will not be canceled.

## Cooperative Cancellation

Executions can cooperate with a cancellation by periodically checking [IsCanceled()][IsCanceled]:

```go
failsafe.RunWithExecution(func(e failsafe.Execution[any]) error {
  for {
    if !e.IsCanceled() {
      if err := DoWork(); err != nil {
        return err
      }
    }
  }
  return nil
}, timeout)
```

Executions can also use the [Canceled()][Canceled] channel to detect when an execution is canceled:

```go
failsafe.RunWithExecution(func(e failsafe.Execution[any]) error {
  for {
    select {
    case <-e.Canceled():
      return nil
    case task := <-GetTask():
      Process(task)
    }
  }
  return nil
}, timeout)
```

{% include common-links.html %}