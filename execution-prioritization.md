---
layout: default
title: Execution Prioritization
---

# Execution Prioritization
{: .no_toc }

1. TOC
{:toc}

Some policies, including [adaptive limiters][adaptive-limiters] and [adaptive throttlers][adaptive-throttlers] support execution prioritization, where an overloaded policy will reject executions based on their priority. Prioritization draws from the idea of [criticality], as described in the [Google SRE book][sre-book].

## Priorities

Failsafe-go supports 5 priority classes:

- Very High
- High
- Medium
- Low
- Very Low

Different priorities can be assigned to different types of executions. For example, internal requests may be prioritized higher than requests from users. When a policy is overloaded, lower priority executions will be rejected before higher priority ones.

## Prioritizers

To used prioritized rejection in an adaptive limiter or throttler, first we need to create a [Prioritizer]:

```go
prioritizer := adaptivelimiter.NewPrioritizer()
prioritizer.ScheduleCalibrations(ctx, time.Second)
```

A [Prioritizer] is responsible for storing the priorities of recent executions and calibrating a rejection threshold based on recent priorities and policy stats. A [Prioritizer] should be calibrated regularly to update its rejection threshold, and a shared prioritizer can be used to determine a rejection threshold across multiple policies. 

Next we can create a prioritized limiter or throttler that uses the [Prioritizer]:

```go
limiter := adaptivelimiter.NewBuilder[any]().BuildPrioritized(prioritizer)
```

Prioritization is only important when a policy is overloaded and needs to reject some executions. Each policy determines how overloaded it is, and the [Prioritizer] combines this information across policies to determine a global rejection rate.

## Prioritized Execution

To perform an execution with a priority, provide a context containing the priority to Failsafe:

```go
ctx := priority.High.AddTo(context.Background())
executor := failsafe.NewExecutor[any](limiter).WithContext(ctx)

// Get with adaptive limiting, using high priority
response, err := executor.Get(FetchData)
```

When a policy is exceeded, executions are rejected based on the associated Prioritizer's rejection threshold.

## Priorities vs Levels

In order to enable more granular prioritization of executions, priorities are internally converted to more granular levels, with 100 levels per priority class. In practice, Prioritizers use these levels to determine which executions to reject, allow more precise rejection rates.

## HTTP and gRPC Support

When using HTTP or gRPC, you can propagate priority and level information through clients and servers. See the [HTTP][http-priorities] and [gRPC][grpc-priorities] docs for more info.

## Standalone Usage

Policies that support prioritization can also be used in a standalone way:

```go
permit, err := limiter.AcquirePermitWithPriority(ctx, priority.High)
```

{% include common-links.html %}
