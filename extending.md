---
layout: default
title: Extending Failsafe-go
---

# Extending Failsafe-go

Failsafe-go can be extended to add custom policies along with the existing policies.

## Custom Policies

Policies consist of a [Policy] implementation, containing the necessary configuration to handle executions, and a [PolicyExecutor] implementation, to handle individual executions according to a policy. Policies can be stateful, similar to [circuit breakers][circuit-breakers], or stateless, similar to [retry policies][retry].

The [policy package][policy-package] provides base types to help with building a custom policy. Those along with the existing [PolicyExecutor][] [implementations][github] are a good reference for creating custom implementations.

{% include common-links.html %}