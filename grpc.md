---
layout: default
title: gRPC Support
---

# gRPC Support
{: .no_toc }

1. TOC
{:toc}

Failsafe-go makes it easy to use any policies with gRPC. 

## Clients

You can create a failsafe `UnaryClientInterceptor` for a [policy composition][policy-composition] to handle errors, limit load, or limit execution time:

```go
interceptor := failsafegrpc.NewUnaryClientInterceptor[SomeResponse](retryPolicy, circuitBreaker)
client, err := grpc.NewClient(target, grpc.WithUnaryInterceptor(interceptor))

// Perform an RPC with retries and circuit breaking
service := somepkg.NewSomeServiceClient(client)
service.DoSomething(ctx, request)
```

## Servers

On the server side, you can use load limiting or time limiting policies to create a failsafe `ServerInHandle`:

```go
inTapHandle := failsafegrpc.NewServerInHandle[any](bulkhead, timeout)
server := grpc.NewServer(grpc.InTapHandle(inTapHandle))
```

You can also create a failsafe `UnaryServerInterceptor`:

```go
interceptor := failsafegrpc.NewUnaryServerInterceptor[SomeResponse](retryPolicy, circuitBreaker)
server := grpc.NewServer(target, grpc.UnaryInterceptor(interceptor))
```

The difference between these two approaches is that a `ServerInHandle` handles a request before it has been decoded whereas a `UnaryServerInterceptor` allows your policies to handle the contents of a response. 

For most load limiting use cases, prefer `ServerInHandle` since it [does not create][ServerInHandle] additional server side resources for requests that are rejected. For use cases where a policy needs to inspect the response, such as a `Fallback` or a `CircuitBreaker`, you can use a `UnaryServerInterceptor`.

## Fallbacks

When using a [Fallback][fallbacks] with a `UnaryClientInterceptor`, it's necessary to set your fallback value against the execution's `LastResult()` since a [UnaryClientInterceptor] has no way to return an alternative result:

```go
fb := fallback.WithFunc(func(exec failsafe.Execution[*SomeResponse]) (*SomeResponse, error) {
  exec.LastResult().Msg = "fallback"
  return nil, nil
})
```

A [Fallback][fallbacks] with a `UnaryServerInterceptor` can be used as usual since [UnaryServerInterceptor] does allow an alternative result to be returned:

```go
fb := fallback.WithResult(&SomeResponse{Msg: "fallback"})
```

## Context Cancellation

When using Failsafe-go's gRPC support, [Context] cancellations are automatically propagated to the RPC context. When an execution is canceled for any reason, such as a [Timeout][timeouts], any outstanding RPC's context is canceled. Similarly, when using a [HedgePolicy][hedge], any outstanding hedge RPC contexts are canceled once the first successful response is received.

{% include common-links.html %}
