---
layout: default
title: Cache
---

# Cache
{: .no_toc }

1. TOC
{:toc}

[Cache policies][CachePolicy] limit unnecessary load by caching and returning previous execution results, when possible. 

## Usage

Creating and using a [CachePolicy] for a [cache] is simple:

```go
// Store connections under the "connection" key in the cache
cachePolicy := cachePolicy.NewBuilder(cache).
  WithKey("connection").
  Build()
  
// Get a connection from the cache, else create a new one
connection, err := failsafe.Get(Connect, cachePolicy)
```

### Cache Keys

A [CachePolicy] can use a key specified at the policy level, as shown above, to store cached execution results. It can also use a cache key provided at execution time, via a [Context], allowing different keys to be used for different executions:

```go
ctx := cache.ContextWithCacheKey(context.Background(), "connection")
connection, err := failsafe.NewExecutor(cachePolicy).
  WithContext(ctx).
  Get(Connect)
```

## Configuration

### Conditional Caching

By default, any non-error execution results will be cached. But a [CachePolicy] can also be configured only cache results when a condition is met:

```go
builder.CacheIf(func(response *http.Response, err error) bool {
  return response != nil && response.StatusCode == 200
})
```

### Event Listeners

A [CachePolicy] can notify you with an [ExecutionEvent] when a result is added to the cache:

```go
builder.OnResultCached(func(e failsafe.ExecutionEvent[any]) {
  logger.Info("Cached result", "result", e.LastResult())
})
```

It can also notify you when a cache hit or miss occurs:

```go
builder.OnCacheHit(func(e failsafe.ExecutionDoneEvent[any]) {
  logger.Info("Cache hit", "result", e.Result)
}).onCacheMiss(func(e failsafe.ExecutionEvent[any]) {
  logger.Info("Cache miss")
})
```

{% include common-links.html %}