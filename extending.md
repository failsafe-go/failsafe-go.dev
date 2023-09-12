---
layout: default
title: Extending Failsafe-go
---

# Extending Failsafe-go

Failsafe-go provides a Service Provider Interface (SPI) for extending the library, such as with custom policies.

## Custom Policies

Failsafe [Policy] implementations contain the necessary configuration to handle executions in a certain way. The actual execution handling is done by a corresponding [PolicyExecutor] implementation, which each Policy provides. The PolicyExecutor is responsible for performing any pre-execution behavior and post-execution handling of a result or exception. 

The [BasePolicyExecutor] along with the existing PolicyExecutor [implementations][github] are a good reference for creating custom implementations.

{% include common-links.html %}