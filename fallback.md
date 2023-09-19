---
layout: default
title: Fallback
---

# Fallback
{: .no_toc }

1. TOC
{:toc}

[Fallbacks][Fallback] provide an alternative result or error for a failed execution. 

## Usage

Creating a [Fallback] is simple. You can create a fallback that provides a default result:

```go
fallback := fallback.WithResult(defaultResult)
```

An alternative error:

```go
fallback := fallback.WithError(ErrConnecting)
```

Or computes a different result or error:

```go
fallback := fallback.WithFn[any](func(e failsafe.Execution[any]) (any, error) {
  return ConnectToBackup(backupConfig)
})
```

## Failure Handling

A [Fallback][Fallback] can be configured to handle only [certain results, errors, or conditions][failure-handling] as failures:

```go
builder.
  HandleErrors(ErrConnecting, ErrRetriesExceeded).
  HandleResult(nil)
```

When using a Fallback in combination with another policy, it's common to configure both to handle the same failures. It's also common for Fallback to handle errors that may be returned by inner policies in a [composition][policy-composition], such as `ErrRetriesExceeded`, `ErrCircuitBreakerOpen`, or `ErrTimeoutExceeded`.

## Event Listeners

In addition to the standard [policy event listeners][policy-listeners], a [Fallback] can notify you with an [ExecutionDoneEvent] when it handles a failure:

```go
builder.OnFallbackExecuted(func(e failsafe.ExecutionDoneEvent[any]) {
  logger.Info("Fallback executed", "result", e.Result)
})
```

{% include common-links.html %}
