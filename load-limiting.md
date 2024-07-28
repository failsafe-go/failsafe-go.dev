---
layout: default
title: Policies
---

# Load Limiting
{: .no_toc }

1. TOC
{:toc}

Systems become overloaded when usage exceeds the capacity of resources such as CPU, memory, disk, thread pools, and so on. Failsafe-go offers several policies that can prevent system overload, including [Circuit Breakers][circuit-breakers], [Bulkheads][bulkheads], [Rate Limiters][rate-limiters], and [Caches][Cache]. We'll discuss below how these policies differ, and when you might choose one over another.

## Types of Load Limiting

There's two general approaches to load limiting: *proactive*, where we guess when a system might be overloaded and proactively limit it, or *reactive*, where we react to a signal that indicates a system is actually overloaded and limit it.

### Proactive Load Limiting

[Bulkheads][bulkheads] and [Rate Limiters][rate-limiters] are *proactive* load limiters. They must be statically configured to limit load at some point. Ideally, that configuration should be carefully chosen through load testing to start limiting before the system becomes overloaded, but to not limit so early that the system's resources are underutilized. While it's better to limit sooner than later, choosing configuration for these policies that actually matches a workload and system capacity can be challenging, especially as these change over time. This is the main drawback of *proactive* load limiting.

### Reactive Load Limiting

*Reactive* load limiting takes a different approach. Rather than limiting based on a static configuration that might not match a system's capacity, *reactive* limiting waits for a signal that a system is actually becoming overloaded before it starts to limit.

Time based [Circuit Breakers][circuit-breakers] can be used as *reactive* load limiters, where they only limit when the recent failure rate exceeds a threshold, ex: 10% in the last minute. The benefit of this approach is it can be used with any sized workload or system, without requiring carefully chosen static configuration. The drawback of this approach is that the error or result that the circuit breaker handles as a failure needs to represent a system that is actually overloaded, such as a timeout error.

## Rate Limiters vs Bulkheads

[Rate limiters][rate-limiters] and [Bulkhead][bulkheads] are both forms of *proactive* limiting, and should be configured based on a system's capacity, but they differ in that [Bulkheads][bulkheads] are better at handling different workloads than rate limiters. The reason for this is highlighted by [Little's Law][littles-law], which states that the average concurrency inside a system relates to the average request rate and response time.

For example: 100 reqs/sec * 1 sec/req = an average concurrency of 100. If we limit the request rate to 100, the concurrency and load on the system is 100 so long as requests take 1 second to process. If more expensive requests arrive that take 2 seconds to process, then concurrency inside the system increases to 200.

A [Bulkhead][bulkheads] avoids this problem since it directly limits concurrency, and therefore load. When the request rate or response times change, the concurrency limit is still the same, allowing a bulkhead to better match different workloads to some system capacity.

{% include common-links.html %}