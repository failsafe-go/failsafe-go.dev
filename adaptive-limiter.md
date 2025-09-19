---
layout: default
title: Adaptive Limiter
---

# Adaptive Limiter
{: .no_toc }

1. TOC
{:toc}

[Adaptive limiters][AdaptiveLimiter] are concurrency limiters that continually adjust their limit based on indications of overload, taking inspiration from [Uber's Cinnamon][cinnamon] and [Netflix's concurrency-limits][concurrency-limits]. Unlike other ways of preventing overload, adaptive limiters are able to automatically detect overload for any type of resource, adapt to changes in load, and also adapt to changes or degradations in a system's capacity.

## Basic Usage

Creating and using an [AdaptiveLimiter] is straightforward:

```go
limiter := adaptivelimiter.NewBuilder[string]().
  WithLimits(1, 100, 20).
  WithRecentWindow(time.Second, 30*time.Second, 50).
  WithBaselineWindow(10).
  WithQueueing(2, 3).
  Build()

// Get with adaptive limiting
response, err := failsafe.Get(FetchData, limiter)
```

Details on how adaptive limiters work, along with their configuration options, are described below.

## How it Works

[Adaptive limiters][AdaptiveLimiter] adjust a concurrency limit up or down based on indications of overload. Overload is detected by observing changes in execution times, throughput, and inflight executions. As these change, a modified [TCP Vegas][vegas] thresholding algorithm is used to determine when to adjust the limit:

- If overload is detected, the limit may be decreased
- If overload is not detected, the limit may be increased

Executions are permitted until the number of concurrent executions hits the limit, after which executions will either fail with `ErrExceeded` or queue until permitted.

## How it Behaves

When not overloaded, an adaptive limiter will increase its limit up to a multiple of the current inflight executions. This provides headroom for bursts without being too high to lower quickly if overload is detected. 

When overload is detected, a limiter will gradually reduce its limit, converging on a limit that represents the capacity of whatever resource is constrained. It will then oscillate around that limit until the overload ends. In this way, the limiter is able to detect the effective capacity of a system for any constrained resource: CPU, disk IO, network IO, etc. 

To better get a feel for how adaptive limiters behave and to see their overload handling in action, check out the load simulation tool [Tripwire].

## Limits

You can set the [min, max, and initial limits][WithLimits] for an adaptive limiter:

```go
builder.WithLimits(1, 100, 20)
```

You can also configure the [max limit factor][WithMaxLimitFactor], which controls how high a limit is allowed to increase as a multiple of the current number of inflight executions:

```go
builder.WithMaxLimitFactor(5)
```

## Execution Times

The primary indicator of overload in an adaptive limiter is execution times, since when a system is overloaded, work will queue and execution times will increase. Adaptive limiters aggregate recent execution times in a window and regularly compare them to baseline execution times to estimate if work is queueing inside a system. 

You can configure the min and max durations of the [recent sampling window][WithRecentWindow], along with the min number of samples that must be collected before adjusting the limit:

```go
builder.WithRecentWindow(time.Second, 30*time.Second, 50)
```

When a window's conditions are met, a quantile of aggregated recent execution times is compared against the baseline. By default, the p90 quantile is used, but you can specify a different [quantile][WithRecentQuantile]:

```go
builder.WithRecentQuantile(.5)
```

Recent sample quantiles are periodically added to a [baseline window][WithBaselineWindow], which is a weighted moving average representing execution times over a longer term. You can configure the average age of values in this window:

```go
builder.WithBaselineWindow(10)
```

Larger baseline windows will cause the limiter to be slower to adjust to changes in baseline load.

## Throughput Correlation

While changes in execution times are a good indicator of overload, they're not perfect. So as a second indicator of overload, adaptive limiters also track recent changes in throughput. In particular, limiters track the _correllation_ between inflight executions and throughput. If inflight executions are increasing but throughput is flat or decreasing, the system is likely overloaded, and the concurrency limit is decreased. 

The number of [recent throughput][WithCorrelationWindow] and inflight measurements to store can be configured:

```go
builder.WithCorrelationWindow(50)
```

## Queueing

Since adaptive limiters set a concurrency limit based on the detected capacity of a system, bursts of executions can quickly fill up the limiter, causing executions to be rejected. To avoid excess rejections when a limiter is full, we can allow some queueing in front of the limiter rather than immediately rejecting executions.

### Gradual Rejections

When a queue starts to fill up, rejections can be configured to be gradual, starting from an initial rejection threshold up to some max. The initial rejection threshold is the multiple of the current limiter and the initial rejection factor, which can be configured. And likewise for the max rejection factor.

For example: with a current limit of 10, an initial rejection factor of 2, and a max rejection factor of 3:

- Up to 10 inflight executions can be executed before the limiter is full
- Up to 20 additional executions can queue before rejections gradually begin
- After 30 executions are queued, all additional executions are rejected

Configuring queue sizes as a multiple of the current limit allows the queue to scale for different workloads without requiring different configuration for each workload. To [enable queueing][WithQueueing] with some initial and max rejection factors:

```go
builder.WithQueueing(2, 3)
```

## Execution Prioritization

Adaptive limiters can optionally decide which executions to reject based on their priority, where lower priority executions are rejected before high priority ones. They can also prioritize executions based on usage from individual users. See the [execution prioritization][execution-prioritization] docs for more info.

## Event Listeners

In addition to the standard [policy listeners][policy-listeners], an [AdaptiveLimiter] can notify you when the [limit changes][OnLimitChanged] or is [exceeded][OnLimitExceeded]:

```go
builder.OnLimitChanged(func(e adaptivelimiter.LimitChangedEvent) {
  logger.Info("AdaptiveLimiter limit changed", "oldLimit", e.OldLimit, "newLimit", e.NewLimit)
}).OnLimitExceeded(func(e failsafe.ExecutionEvent[any]) {
  logger.Info("AdaptiveLimiter limit exceeded")
})
```

## Logging and Metrics

Debug logging of [AdaptiveLimiter] limit changes can be enabled by providing an `slog.Logger` when building these:

```go
builder.WithLogger(logger)
```

[AdaptiveLimiter] also provides [metrics][AdaptiveLimiterMetrics] that include the current limit, inflight executions, and queued executions.

## Standalone Usage

An [AdaptiveLimiter] can be manually operated in a standalone way:

```go
permit, err := limiter.AcquirePermit(ctx)
if err != nil {
  return err
}

if err := sendRequest(); err != nil {
  permit.Drop()
  return err
}
permit.Record()
```

Additional methods are available to acquire permits with wait times and priorities.

## Best Practices

### Shared Prioritizers

[Prioritizers][Prioritizer] should be shared across multiple limiters when possible. This allows a combined rejection threshold to be determined across limiters, which takes their combined queueing levels into account, and leads to more stable rejection behavior.

## Additional Details

### Determining Overload

When recent execution times change relative to the baseline, this could mean that a system is overloaded, or it could mean the type of work that the system is doing has shifted and that the baseline needs to change. For example, the system may have been processing fast requests and now only slow requests are being performed. That doesn't necessarily mean the system is overloaded - it could just mean the type of work it's doing has shifted.

The way a limiter distinguishes between these is _experimentally_: by lowering the limit and observing what happens. As the limit is lowered, eventually the recent and baseline latencies will equalize, and the limit will be raised again as normal. If this was a true overload situation, recent execution times would spike again and the limit would adjust down in response. Otherwise the limit would continue to increase as normal, with a new baseline having been set.

## Thanks

Thank you to Jakob Holdgaard Thomsen, Vladimir Gavrilenko, and Jesper Lindstrøm Nielsen for their valuable insights and feedback while developing Failsafe-go's adaptive limiter.

[cinnamon]: https://www.uber.com/blog/cinnamon-using-century-old-tech-to-build-a-mean-load-shedder/
[concurrency-limits]: https://github.com/Netflix/concurrency-limits
[vegas]: https://en.wikipedia.org/wiki/TCP_Vegas

{% include common-links.html %}