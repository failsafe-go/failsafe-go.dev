---
layout: default
title: HTTP Support
---

# HTTP Support
{: .no_toc }

1. TOC
{:toc}

Failsafe-go makes it easy to use any policies with HTTP. 

## Clients

You can create a failsafe `RoundTripper` for a [policy composition][policy-composition] which can be used with an `http.Client`:

```go
client := &http.Client{
  Transport: failsafehttp.NewRoundTripper(http.DefaultTransport, retryPolicy, circuitBreaker),
}

// Get with retries and circuit breaking
client.Get("http://failsafe-go.dev")
```

Alternatively, you can create a failsafe request for an `http.Request`, `http.Client`, and policies:

```go
failsafeRequest := failsafehttp.NewRequest(request, client, retryPolicy)

// Perform request with retries
response, err := failsafeRequest.Do()
```

The difference between these two approaches is that a failsafe `Request` wraps a client whereas a failsafe `RoundTripper` is used internally by a client. This means any errors created by a client before using the `RoundTripper` would not be handled, but could be handled by a failsafe `Request`.

## Servers

On the server side, you can use load limiting or time limiting policies to create a failsafe `http.Handler`:

```go
handler = failsafehttp.NewHandler(innerHandler, bulkhead, timeout)
```

## Retrying HTTP Failures

The `failsafehttp` package provides a `NewRetryPolicyBuilder` that can build retry policies with built-in detection of retryable HTTP errors and responses:

```go
retryPolicy := failsafehttp.NewRetryPolicyBuilder().
  WithBackoff(time.Second, 30*time.Second).
  WithMaxRetries(3).
  Build()
```

`failsafehttp.NewRetryPolicyBuilder` will also delay retries according to any `Retry-After` header in the HTTP response. Additional configuration, including delays for other responses, can be added to the builder as needed.

## Handling Retry-After

Other policies that support delays, such as [circuit breakers][circuit-breakers] can also be configured with a `failsafehttp.DelayFunc` that delays according to `Retry-After` headers:

```go
circuitBreaker := circuitbreaker.NewBuilder[*http.Response]().
  HandleIf(func(response *http.Response, err error) bool {
    return response != nil && response.StatusCode == 429
  }).
  WithDelayFunc(failsafehttp.DelayFunc).
  Build()
```

## Adaptive Limiters

When using an [adaptive limiter][adaptive-limiters], executions can include priority or level information. Ideally, this should be propagated from HTTP clients to servers, and on to the server's handler. On the client, we can propagate priority or level information from a context through an outgoing request by using a `RoundTripper`:

```go
client := &http.Client{
  Transport: failsafehttp.NewRoundTripperWithLevel(nil),
}
```

And on the server, we can decode priority or level information from an incoming request, optionally generate a level if one does not exist but a priority does, and propagate it to the `http.Handler`:

```go
handler := failsafehttp.NewHandlerWithLevel(innerHandler, true)
```

For distributed systems, you typically want to generate a level, if one does not exist, at the edge of your system, and then propagate the same level for all sub-requests.

## Context Cancellation

When using a failsafe `RoundTripper` or `Request`, [Context] cancellations are automatically propagated to the HTTP request context. When an execution is canceled for any reason, such as a [Timeout][timeouts], any outstanding HTTP request's context is canceled. Similarly, when using a [HedgePolicy][hedge], any outstanding hedge reqests contexts are canceled once the first successful response is received.


{% include common-links.html %}
