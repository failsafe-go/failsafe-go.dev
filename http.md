---
layout: default
title: HTTP Integration
---

# HTTP Support
{: .no_toc }

1. TOC
{:toc}

Failsafe-go makes it easy to use any policies with HTTP. One approach is to create a failsafe `RoundTripper`, which you can use with an `http.Client`:

```go
client := &http.Client{}
executor := failsafe.NewExecutor[*http.Response](retryPolicy, circuitBreaker)
client.Transport = failsafehttp.NewRoundTripper(executor, nil)
```

Any requests made with this client will have failures handled by the configured policies:

```go
// Get with retries and circuit breaking
client.Get("http://failsafe-go.dev")
```

Another approach is to create a failsafe request for an executor, `http.Request`, and `http.Client`:

```go
executor := failsafe.NewExecutor[*http.Response](retryPolicy)
failsafeRequest := failsafehttp.NewRequest(executor, request, http.DefaultClient)

// Execute request with retries
response, err := failsafeRequest.Do()
```

The difference between these two approaches is that a failsafe `Request` wraps a client whereas a failsafe `RoundTripper` is used internally by a client. This means any errors created by a client before using the `RoundTripper` would not be handled, but could be handled by a failsafe `Request`.

## Retrying HTTP Failures

The `failsafehttp` package provides a `RetryPolicyBuilder` that can build retry policies with built-in detection of retryable HTTP errors and responses:

```go
retryPolicy := failsafehttp.RetryPolicyBuilder().
  WithBackoff(time.Second, 30*time.Second).
  WithMaxRetries(3).
  Build()
```

`failsafehttp.RetryPolicyBuilder` will also delay retries according to any `Retry-After` header in the HTTP response. Additional configuration, including delays for other responses, can be added to the builder as needed.

## Handling Retry-After

Other policies that support delays, such as [circuit breakers][circuit-breakers] can also be configured with a `failsafehttp.DelayFunc` that delays according to `Retry-After` headers:

```go
circuitBreaker := circuitbreaker.Builder[*http.Response]().
  HandleIf(func(response *http.Response, err error) bool {
    return response.StatusCode == 429
  }).
  WithDelayFunc(failsafehttp.DelayFunc()).
  Build()
```

## Context Cancellation

When using a failsafe `RoundTripper` or `Request`, [Context] cancellations are automatically propagated to the HTTP request context. When an execution is canceled for any reason, such as a [Timeout][timeouts], any outstanding HTTP request's context is canceled. Similarly, when using a [HedgePolicy][hedge], any outstanding hedge reqests contexts are canceled once the first successful response is received.


{% include common-links.html %}
