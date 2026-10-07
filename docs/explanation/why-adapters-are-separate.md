# Why adapters are separate

seneca-web does not register routes with Express, Hapi or Koa itself.
It maps route plans and hands the result to an *adapter*, a function in
its own package. This page explains the reasons and the consequences.

## Frameworks differ in everything but the idea

Every web framework has routes, handlers and some notion of request and
response, but the details differ: Express handlers take `(req, res,
next)`, Hapi 16 handlers take `(request, reply)`, Koa handlers take a
context. Body parsing, authentication, middleware ordering and error
propagation all differ too. Putting all of them in one package would
mean a dependency on every framework, a version matrix that is never
quite right, and a plugin that changes whenever any framework does.

Version 1.0.0 (2016) therefore moved the framework specific code into
`seneca-web-adapter-<framework>` packages, and version 2.0.0 removed
the last shortcut, naming an adapter by string: the application
requires the adapter package itself and passes the function in the
`adapter` option. Each adapter declares a peer dependency on
`seneca-web`, not the other way round.

## What the plugin owns and what the adapter owns

The plugin owns the plan format, the mapped route format, the messages
to change the configuration, and the message convention for requests
(`args`, `request$`, `response$`). The adapter owns everything that
touches the framework: registering handlers, reading bodies, running
middleware, authentication, redirects, and turning a reply or an error
into a response. The contract between them is one function call,
`adapter.call(seneca, options, context, auth, routes, done)`, described
in the [adapter contract reference](../reference/adapter-contract.md).
An adapter for a new framework is a small program; the one in
[`docs/examples/write-an-adapter.js`](../examples/write-an-adapter.js)
is about sixty lines.

## The context is opaque

The plugin never inspects the `context`. It stores it, returns it from
`web/context`, and passes it to the adapter. That is what allows the
same plugin to serve an Express application, an Express router, a Hapi
server or a Koa router. It also means the plugin can not validate it;
an adapter replies `no context provided` when it is missing, and
anything else is discovered when the adapter calls a method on it.

One limit comes from Seneca rather than from the plugin: Seneca walks
plugin options when a plugin loads, and a context with circular
references (a Hapi server) makes that walk hang or overflow. Such
contexts are passed with `role:web,set:server` instead of `use()`.

## Actions stay portable, mostly

Because the adapter builds the message, actions see the same `args`
properties (`body`, `query`, `params`) whatever the framework, and an
action written for the Express adapter usually works behind the Koa
adapter. The escape hatches, `request$` and `response$`, tie an action
to a framework and to the web process: they are removed when a message
travels over a transport. Actions that use them (for example with
`autoreply: false`) give up portability knowingly. The published
adapters differ in small ways, listed in the
[request mapping reference](../reference/request-mapping.md); the
differences are in what each framework can provide, not in the
convention.

## Error handling is the adapter's job

The plugin does not translate Seneca errors into status codes. There is
no single right mapping, and frameworks have their own error pipelines,
so the adapter hands the error to the framework and the application
decides there. What the plugin guarantees since version 2.3.0 is that
request errors are ordinary action errors, not fatal ones; and the
Seneca version decides the error's shape (the action's error on
Seneca 4, a wrapper with `err.orig` on Seneca 3).
