---
layout: default
title: HTTP Integration
---

# HTTP Integration
{: .no_toc }

1. TOC
{:toc}

Failsafe-go makes it easy to use any policies with HTTP via an [http.RoundTripper][RoundTripper]. Creating a failsafe `RoundTripper` is straightforward:

```go
executor := failsafe.NewExecutor[*http.Response](retryPolicy, circuitBreaker)
roundTripper := failsafehttp.NewRoundTripper(executor, nil)
```

[Retry policies][retry], [circuit breakers][circuit-breakers], [timeouts], and [hedge policies][hedge] are all common to use with a failsafe `RoundTripper`. 

## Handling HTTP Responses

Some policies, such as a [retry policies][retry], [circuit breakers][circuit-breakers], and [fallbacks] can be configured to handle specific HTTP responses, ex:

```go
// Retry on a 400 response
retryPolicy := retrypolicy.Builder[*http.Response]().
  HandleIf(func(response *http.Response, err error) bool {
    return response.StatusCode == 400
  }).Build()
```

## Context Cancellation

When using a failsafe `RoundTripper`, [Context] cancellations are automatically propagated to the HTTP request context. When an execution is canceled for any reason, such as a [Timeout][timeouts], any outstanding HTTP request's context is canceled. Similarly, when using a [HedgePolicy][hedge], any outstanding hedge reqests contexts are canceled once the first successful response is received.


{% include common-links.html %}
