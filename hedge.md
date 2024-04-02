---
layout: default
title: Hedge
---

# Hedge
{: .no_toc }

1. TOC
{:toc}

[Hedge policies][HedgePolicy] are used to bring down tail latencies by performing additional executions, after some delays, if the initial execution is slow to complete. This differs from retry policies since multiple hedged executions may be in progress at the same time. After the first successful execution is returned, the remaining executions are canceled.

## Usage

Creating and using a [HedgePolicy] is straightforward, for example:

```go
// Hedge up to 2 times with a 1 second delay between attempts
hedgePolicy := hedgepolicy.BuilderWithDelay[any](time.Second).
  WithMaxHedges(2).
  Build()
  
// Run with hedges
err := failsafe.Run(SendRequest, hedgePolicy)
```

## Max Hedges

By default, a [HedgePolicy] will perform a single hedged execution if the initial execution is not done before the delay. You can configure a different max number of [hedges][WithMaxHedges]:

```go
builder.WithMaxHedges(2)
```

## Dynamic Delay

The hedging pattern was first described in [The Tail at Scale][tail-at-scale], which recommends setting a hedging delay equal to the current p95 or p99 latency of your executions. This ensures that if latencies change, you're only targeting long tail requests and don't unintentionally perform hedged executions too early. 

With this in mind, you can configure a dynamic delay for a [HedgePolicy], based on a function result:

```go
hedgePolicy := hedgepolicy.BuilderWithDelayFunc[any](
  func(exec failsafe.ExecutionAttempt[any]) time.Duration {
    return p95Latency()  
  }).
  WithMaxHedges(2).
  Build()
```

## Cancellation

By default, any outstanding hedges are canceled after the first result is returned. You can also specify that only certain results, errors, or conditions should cause outstanding hedges to be canceled:

```go
builder.
  CancelOnResult(true).
  CancelOnError(ErrConnecting).
  CancelIf(CancelCondition)
```

## Event Listeners

A HedgePolicy can notify you with an [ExecutionEvent] when a hedge is about to be [attempted][OnHedge]:

```go
builder.OnHedge(func(e failsafe.ExecutionEvent[any]) {
  logger.Error("Hedging after error", "error", e.LastError())
})
```


{% include common-links.html %}