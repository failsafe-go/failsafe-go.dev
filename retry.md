---
layout: default
title: Retry
---

# Retry
{: .no_toc }

1. TOC
{:toc}

[Retry policies][RetryPolicy] are used to retry failed executions a certain number of times, with an optional delay between attempts.

## Usage

Creating and using a [RetryPolicy] is straightforward, for example:

```go
// Retry on ErrConnecting up to 3 times with a 1 second delay between attempts
retryPolicy := retrypolicy.NewBuilder[Connection]().
  HandleErrors(ErrConnecting).
  WithDelay(time.Second).
  WithMaxRetries(3).
  Build()
  
// Get with retries
connection, err := failsafe.Get(Connect, retryPolicy)
```

## Failure Handling

A [RetryPolicy] can be configured to handle only [certain results, errors, or conditions][failure-handling] as failures:

```go
builder.
  HandleErrors(ErrConnecting).
  HandleResult(nil)
```

## Max Attempts

[By default][retrypolicy-defaults], a [RetryPolicy] will allow a maximum of 3 execution attempts. You can configure a different max number of [attempts][WithMaxAttempts]:

```go
builder.WithMaxAttempts(3)
```

Or a max number of [retries][WithMaxRetries]:

```go
builder.WithMaxRetries(2)
```

You can also disable the default max attempt limit:

```go
builder.WithMaxAttempts(-1)
```

## Max Duration

In addition to max attempts, you can also add a [max duration][WithMaxDuration] for an execution, after which retries will stop if the max attempts haven't already been reached.

```go
builder.WithMaxDuration(5*time.Minute)
```

## Delays

By default, a [RetryPolicy] has no delay between attempts. You can configure a fixed delay:

```go
builder.WithDelay(time.Second)
```

Or a delay that [backs off][WithBackoff] exponentially:

```go
builder.WithBackoff(time.Second, 30*time.Second)
```

A [random delay][WithRandomDelay] for some range:

```go
builder.WithRandomDelay(time.Second, 10*time.Second)
```

Or a [computed delay][WithDelayFunc] based on an execution result or error:

```go
builder.WithDelayFunc(ComputeDelay)
```

### Jitter

You can also combine a delay with a random [jitter factor][WithJitterFactor]:

```go
builder.WithJitterFactor(.1)
```

Or a [time based jitter][WithJitter]:

```go
builder.WithJitter(100*time.Second)
```

To cancel running executions, see the [execution cancellation][execution-cancellation] docs or [Timeout][timeouts] policy.

## Abort

You can also specify which results, errors, or conditions to [abort retries][AbortOnErrors] on:

```go
builder.
  AbortOnResult(true)
  AbortOnErrors(context.Canceled)
  AbortIf(AbortCondition)
```

## Return Value

By default, when an execution fails and a [RetryPolicy] is exceeded, an [ExceededError][RetryPolicyExceededError] will be returned, wrapping the last execution result and error:

```go
response, err := failsafe.Get(SendMessage, retryPolicy)
if ee := retrypolicy.AsExceededError(err); ee != nil {
  logger.Error("Failed to send message", "response", ee.LastResult, "err", ee.LastError)
}
```

A [RetryPolicy] can also be configured to return the last result and error instead of wrapping them:

```go
builder.ReturnLastFailure()
```

If additional handling or an alternative result is needed, additional policies, such as a [fallbacks], can be [composed][policy-composition] around a [RetryPolicy].

## Event Listeners

In addition to the standard [policy event listeners][policy-listeners], a RetryPolicy can notify you with an [ExecutionEvent] when a retry is [scheduled][OnRetryScheduled] or is about to be [attempted][OnRetry], when an execution fails and the max retries are [exceeded][OnRetriesExceeded], or when retries are [aborted][OnAbort]. For example:

```go
builder.OnRetry(func(e failsafe.ExecutionEvent[any]) {
  logger.Error("Retrying after error", "error", e.LastError())
})
```


{% include common-links.html %}