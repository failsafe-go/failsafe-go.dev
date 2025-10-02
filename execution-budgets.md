---
layout: default
title: Execution Budgets
---

# Execution Budgets
{: .no_toc }

1. TOC
{:toc}

[Budgets][Budget] limit the total number of concurrent retries or hedges across a system to prevent them from causing overload. This can happen when a flood of retries or hedges come in and need to be handled gradually.

## Usage

Creating a [Budget] is straightforward:

```go
// Allow up to 25% retries or hedges by default, with a minimum of 5 in progress
budget := budget.NewBuilder().
  WithMaxRate(.25).
  WithMinConcurrency(5).
  Build()
```

Budgets are meant to be used across retries or hedges in your system:

```go
retryPolicy := retrypolicy.NewBuilder[any]().
  WithBudget(budget).
  Build()

// Run with budgeted retries
err := failsafe.Run(SendRequest, retryPolicy)

hedgePolicy := hedgepolicy.NewBuilderWithDelay[any](time.Second).
  WithBudget(budget).
  Build()

// Run with budgeted hedges
err := failsafe.Run(SendRequest, hedgePolicy)
```

You can use the same budget for retries and hedges if you like.

## How It Works

Budgets permit executions to proceed up to some max number of concurrent retries or hedges, after which executions will fail with `budget.ErrExceeded`. This allows a system-wide cap to be placed on retries or hedges.

## Comparison

[Budgets][Budget] are similar to [Bulkheads][bulkheads] in that they both limit concurrency. But whereas a bulkhead limits the concurrency of *all* executions wherever it's used, a budget limits the concurrency of *just retries or hedges* wherever it's used.

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

### Event Listeners

A [Budget] can notify you with an [budget.ExceededEvent][BudgetExceededEvent] when the budget is exceeded:

```go
builder.OnBudgetExceeded(func(e budget.ExceededEvent) {
  logger.Error("Budget exceeded")
})
```

### Metrics

Budgets expose metrics including the current inflight [retry][RetryRate] and [hedge][HedgeRate] rates.

## Best Practices

A [Budget] should be shared across a system to make sure that all retries or hedges are counted towards the budget.

{% include common-links.html %}