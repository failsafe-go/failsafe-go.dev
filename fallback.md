---
layout: default
title: Fallback
---

# Fallback
{: .no_toc }

1. TOC
{:toc}

[Fallbacks][Fallback] allow you to provide an alternative result for a failed execution. They can also be used to suppress errors or provide a default result:

```go
fallback := fallback.WithResult(defaultResult)
```

Return a different error:

```go
fallback := fallback.WithError(ErrConnecting)
```

Or compute an alternative result or error:

```go
fallback := fallback.WithFn[any](func(e failsafe.Execution[any]) (any, error) {
  return ConnectToBackup(backupConfig)
})
```

## Failure Handling

[Fallbacks][Fallback] can be configured to handle only [certain results or errors][failure-handling] as failures:

```go
builder.
  HandleErrors(ErrConnecting, ErrRetriesExceeded).
  HandleResult(nil)
```

When using a Fallback in combination with another policy, it's common to configure both to handle the same failures. It's also common for Fallback to handle errors that may be returned by inner policies in a [composition][policy-composition], such as `ErrRetriesExceeded`, `ErrCircuitBreakerOpen`, or `ErrTimeoutExceeded`.


{% include common-links.html %}
