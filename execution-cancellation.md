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
failsafe.With(timeout.New[any](time.Second)).Get(Connect)
```

By a [Context]:

```go
ctx, _ := context.WithTimeout(context.Background(), time.Second)

// Connect will be canceled by the ctx after 1 second
failsafe.With(retryPolicy).WithContext(ctx).Get(Connect)
```

Or by an async [ExecutionResult]:

```go
result := failsafe.With(retryPolicy).RunAsync(Connect)
result.Cancel()
```

Outstanding [hedge executions][hedge] are also canceled once a successful result is received.

## Propagating Cancellations

For executions that may be canceled by a policy such as a [timeout] or [hedge policy][hedge], a child context is created and made available via [Context()][ExecutionInfo.Context], which should be used to propagate these cancellations to downstream code:

```go
failsafe.With(timeout).
  GetWithExecution(func(exec failsafe.Execution[*http.Response]) (*http.Response, error) {
    request, err := http.NewRequestWithContext(exec.Context(), http.MethodGet, url, nil)
    return client.Do(request)
  })
```

## Cooperative Cancellation

Executions can cooperate with a cancellation by periodically checking [IsCanceled()][IsCanceled]:

```go
failsafe.With(timeout).RunWithExecution(func(exec failsafe.Execution[any]) error {
  for {
    if !exec.IsCanceled() {
      if err := DoWork(); err != nil {
        return err
      }
    }
  }
  return nil
})
```

Executions can also use the [Canceled()][Canceled] channel to detect when an execution is canceled:

```go
failsafe.With(timeout).RunWithExecution(func(exec failsafe.Execution[any]) error {
  for {
    select {
    case <-exec.Canceled():
      return nil
    case task := <-GetTask():
      Process(task)
    }
  }
  return nil
})
```

## Timeout vs Context Cancellation

While a cancellation from a [Timeout][timeouts] can still be retried by an outer [RetryPolicy][retry], a cancellation from a [Context] or [ExecutionResult] cannot be.

{% include common-links.html %}