---
layout: default
title: Timeout
---

# Timeout
{: .no_toc }

1. TOC
{:toc}

[Timeouts][Timeout] allow you to cancel an execution with `ErrTimeoutExceeded` if it takes too long to complete:

```go
timeout := timeout.With(10*time.Second)
```

If an execution is cancelled by a `Timeout`, the execution and policies composed inside the timeout will return `ErrTimeoutExceeded`. See the [execution cancellation][execution-cancellation] page for more on cancellation.

## Timeouts with Retries

When a `Timeout` is [composed][policy-composition] _outside_ a `RetryPolicy`, a timeout occurrence will cancel any _inner_ retries:

```go
failsafe.Run(Connect, timeout, retryPolicy)
```

When a `Timeout` is [composed][policy-composition] _inside_ a `RetryPolicy`, a timeout occurrence will not automatically cancel any _outer_ retries:

```go
failsafe.Run(Connect, retryPolicy, timeout)
```

## Timeout vs Context

While a [Timeout] is similar to a [Context], in that they both can cause an execution to be cancelled, [Timeouts][Timeout] can be composed with other policies. Additionally, when a [Timeout] is triggered, it can be reset by an outer [RetryPolicy], whereas a [Context] cannot be reset once it is done. 

With this in mind, use a [Timeout] when you want to limit execution time, and use a [Context] when you want to explicitly cancel an execution.

## Event Listeners

A [Timeout] can notify you with an [ExecutionEvent] when a timeout has been exceeded by an execution attempt:

```go
builder.OnTimeoutExceeded(func(e failsafe.ExecutionEvent[Connection]) {
  logger.Error("Connection timed out")
})
```

{% include common-links.html %}