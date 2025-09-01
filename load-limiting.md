---
layout: default
title: Load Limiting
---

# Load Limiting
{: .no_toc }

1. TOC
{:toc}

Systems become overloaded when usage exceeds the capacity of resources such as CPU, memory, disk and network IO, thread pools, and so on. Failsafe-go offers several policies that can prevent and sometimes detect system overload, including [Adaptive Limiters][adaptive-limiters], [Circuit Breakers][circuit-breakers], [Bulkheads][bulkheads], [Rate Limiters][rate-limiters], [Timeouts][timeouts], and [Caches][caches]. We'll discuss below how these policies differ, and when you might choose one over another.

## Types of Load Limiting

There's two general approaches to load limiting: *proactive*, where we estimate when a system might be overloaded and proactively limit it, or *reactive*, where we react to a signal that indicates a system is actually overloaded and limit it.

### Proactive Load Limiting

[Bulkheads][bulkheads], [Rate Limiters][rate-limiters], and [Timeouts][timeouts] are *proactive* load limiters. They must be statically configured to limit load at some point. Ideally, that configuration should be carefully chosen through load testing to start limiting before the system becomes overloaded, but not limit so early that the system's resources are underutilized. While it's better to limit sooner than later, choosing configuration for these policies that actually matches a workload and system capacity can be challenging, especially as these change over time.

### Reactive Load Limiting

*Reactive* load limiters take a different approach. Rather than limiting based on a static configuration that might not match a system's capacity, *reactive* limiters wait for a signal that a system is actually becoming overloaded before they start to limit. The benefit is that they can be used with any sized system, without requiring carefully chosen configuration.

[Adaptive limiters][adaptive-limiters] are *reactive* since they detect indications of overload through changes in latency and throughput. Time based [Circuit Breakers][circuit-breakers] are also *reactive* since they only limit executions when the recent failure rate exceeds a threshold, ex: 10% in the last minute.

## Adaptive Limiters vs Circuit Breakers

The effectiveness of time based [circuit breakers][circuit-breakers] depends on the failures that are being used to drive them. Typically timeouts are used to drive circuit breakers, indicating that a system is overloaded. But timeouts are often a lagging indicator of overload, representing very high latency within a system. In extreme cases, a system may crash before a timeout driven circuit breaker opens.

This is where adaptive limiters excel. [Adaptive limiters][adaptive-limiters] are able to detect unusual latency before large numbers of timeouts even occur. This, along with them maintaining a reasonable concurrency limit, can protect a system from overload before it even happens.

## Rate Limiters vs Bulkheads

[Rate limiters][rate-limiters] and [Bulkheads][bulkheads] are both forms of *proactive* limiting, and should be configured based on a system's capacity, but they differ in that [Bulkheads][bulkheads] are better at handling varied workloads than rate limiters. The reason for this is highlighted by [Little's Law][littles-law], which states that the average concurrency inside a system relates to the average request rate and response time.

For example: 100 reqs/sec * 1 sec/req = an average concurrency of 100. If we limit the request rate to 100, the concurrency and load on the system is 100 so long as requests take 1 second to process. If more expensive requests arrive that take 2 seconds to process, then concurrency inside the system increases to 200.

[Bulkheads][bulkheads] avoid this problem since they directly limit concurrency, and therefore load. When the request rate or response times change, the concurrency limit is still the same, allowing a bulkhead to better control workloads for some system capacity. Of course, bulkheads still require static configuration. For something more adaptive to changes in load or capacity, consider an [adaptive limiter][adaptive-limiters].

## Preferences

For guarding against system overload, prefer *reactive* limiters, and in particular, prefer adaptive limiters over circuit breakers since they respond more quickly to indications of overload.

{% include common-links.html %}