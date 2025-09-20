---
layout: default
title: Budget
---

# Budget
{: .no_toc }

1. TOC
{:toc}

[Budgets][Budget] limit the total number of concurrent retries or hedges across a system to prevent them from causing overload. This can happen when a flood of retries or hedges come in and need to be handled gradually.

## Usage

Creating a [Budget] to use with [retries][retry] is straightforward:

```go
// Allow up to 20% retries by default, with a minimum of 3 retries
budget := budget.NewBuilder().ForRetries().Build()

// Retry on any error by default, except budget.ErrExceeded
retryPolicy := retrypolicy.NewBuilder[bool]().
  AbortOnErrors(budget.ErrExceeded).
  Build()

// Run with retries and a budget
err := failsafe.Run(SendRequest, retryPolicy, budget)
```

Similarly, a [Budget] can be created for [hedges][hedge]:

```go
// Allow up to 20% retries by default, with a minimum of 3 hedges
budget := budget.NewBuilder().ForHedges().Build()

// Hedge up to 1 time with a 1 second delay between attempts
hedgePolicy := hedgepolicy.NewWithDelay[any](time.Second)

// Run with hedges and a budget
err := failsafe.Run(SendRequest, hedgePolicy, budget)
```

You can also use the same budget for retries and hedges if you like.

## How It Works

Budgets permit executions to proceed up to some max number of concurrent retries or hedges, after which executions will fail with `budget.ErrExceeded`. This allows a system-wide cap to be placed on retries or hedges.

## Policy Comparison

[Budgets][Budget] are similar to [Bulkheads][bulkheads] in that they both limit concurrency. But whereas a bulkhead limits the concurrency of all executions wherever it's used, a budget limits the concurrency of just retries or hedges wherever it's used.

## Configuration

### Max Rate

You can specify the max rate of retries or hedges that are permitted before rejections occur:

```go
// Allow up to 50% of executions to be retries or hedges
builder.WithMaxRate(.5)
```

You can also specify the min number of concurrent executions that can be retries or hedges:

```go
// Allow at least 5 executions to be retries or hedges
builder.WithMinConcurrency(5)
```

### Composition and Error Handling

It's recommended to compose a [Budget] *inside* a [RetryPolicy] or [HedgePolicy]:

```go
failsafe.Run(SendMessage, retryPolicy, budget)
```

This way outer retries or hedges can be rejected by the inner budget if it's exceeded.

It's also recommended that for retry policies, the policy should abort on any `budget.ErrExceeded`:

```
retryPolicyBuilder.AbortOnErrors(budget.ErrExceeded)
```

This way retries still happen for other errors or conditions, but not when a budget is exceeded.

### Event Listeners

A [Budget] can notify you with an [ExecutionEvent] when the budget is exceeded:

```go
builder.OnBudgetExceeded(func(e failsafe.ExecutionEvent[any]) {
  logger.Error("Budget exceeded")
})
```

## Standalone Usage

A [Budget] can also be manually operated in a standalone way for retries or hedges:

```go
if budget.TryAcquireRetryPermit() {
  doSomething()
  budget.ReleaseRetryPermit()
}
```

## Best Practices

A [Budget] should be shared across a system to make sure that all retries or hedges are counted towards the budget.

{% include common-links.html %}