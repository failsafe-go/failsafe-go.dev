---
layout: default
title: Fallback
---

# Fallback
{: .no_toc }

1. TOC
{:toc}

[Fallbacks][Fallback] handle failed executions by providing an alternative result or error. 

## Usage

There are a few different options for creating a [Fallback]. You can provide an alternative result:

```go
fallback := fallback.NewWithResult(defaultResult)
```

An alternative error:

```go
fallback := fallback.NewWithError(ErrConnecting)
```

Or compute a different result or error:

```go
fallback := fallback.NewWithFunc(func(e failsafe.Execution[Connection]) (Connection, error) {
  return ConnectToBackup(backupConfig)
})
```

Using a [Fallback] is simple:

```go
connection, err := failsafe.With(fallback).Get(Connect)
```

## Configuration

### Failure Handling

A [Fallback] can be configured to handle only [certain results, errors, or conditions][failure-handling] as failures:

```go
builder.
  HandleErrors(ErrConnecting, retrypolicy.ErrExceeded).
  HandleResult(nil)
```

When using a Fallback in combination with another policy, it's common to configure both to handle the same failures. It's also common for a Fallback to handle errors that may be returned by inner policies in a [composition][policy-composition], such as `retrypolicy.ErrExceeded`, `circuitbreaker.ErrOpen`, or `timeout.ErrExceeded`.

### Event Listeners

In addition to the standard [policy event listeners][policy-listeners], a [Fallback] can notify you with an [ExecutionDoneEvent] when it handles a failure:

```go
builder.OnFallbackExecuted(func(e failsafe.ExecutionDoneEvent[any]) {
  logger.Info("Fallback executed", "result", e.Result)
})
```

{% include common-links.html %}
