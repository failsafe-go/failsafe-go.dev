---
layout: default
title: Extending Failsafe-go
---

# Extending Failsafe-go

Failsafe-go can be extended to add custom policies along with the existing policies.

## Custom Policies

Policies consist of a [failsafe.Policy] implementation, containing the necessary configuration to handle executions along with any policy state, and a [policy.Executor] implementation to handle individual executions according to a policy. Policies can be stateful across executions, such as [circuit breakers][circuit-breakers], or stateless, such as [retry policies][retry].

The [policy package][policy-package] provides base types to help with building a custom policy. Those along with the existing [policy.Executor][] [implementations][github] are a good reference for creating custom implementations.

{% include common-links.html %}