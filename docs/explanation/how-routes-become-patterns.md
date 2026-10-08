# How routes become patterns

seneca-web rests on one idea: a URL is just another way to address a
message pattern. This page explains how the plugin gets from a route
plan to a running route, and why it is built the way it is.

## The pin and the wildcard

Seneca actions are selected by patterns such as `role:todo,cmd:list`.
A plugin typically implements a family of patterns that differ in one
property: `role:todo,cmd:list`, `role:todo,cmd:load`, `role:todo,cmd:create`.
The route plan captures the family with a *pin*, `role:todo,cmd:*`, and
lists the members in `map`. Each map key is substituted for the `:*`,
which gives the exact pattern the adapter will send to. The same key
becomes the last part of the URL. So one line, `list: true`, says both
"there is an action `role:todo,cmd:list`" and "serve it at
`/todo/list`".

The substitution is textual, by design: the plugin does not look at the
actions that exist. A plan can name actions that are added later, or
that live in another service behind a transport. The cost is that typos
are not detected when mapping; a request to a route whose pattern has
no action gets Seneca's `act_not_found` error at request time.

## The mapped route as a stable format

Between the plan and the framework sits the *mapped route*: a plain
object with the `pattern`, the `path`, the `methods`, and the flags
`autoreply`, `redirect`, `auth`, `secure` and `middleware`, always
present, with `false` for the ones not set. The mapper
(`lib/mapper.js`) produces it, the adapter consumes it. This split is
what lets adapters stay small: an adapter does not parse plans, apply
defaults or build paths, it loops over mapped routes and registers
handlers. The log adapter prints the mapped routes, which doubles as a
way to check a plan before choosing a framework.

Path building follows one rule, `/<prefix>/<part>/<postfix>/<suffix>`
with `alias` overriding everything, joined with `path.posix.join` so
that the result has forward slashes on every platform and tolerates
missing or doubled slashes in the plan. Nothing is percent encoded: the
path is handed to the framework, whose own syntax (`/:id`, Express 5's
`{/:id}`) must survive.

## The plugin's own patterns

The plugin adds three action patterns. `role:web,routes:*` matches any
message with `role:web` and a `routes` property; this is why the short
form `seneca.act('role:web', { routes })` works. `role:web,set:server`
changes the stored adapter, context, auth and options.

The two interact in a way that took until version 2.3.0 to get right.
Seneca compares pattern properties in alphabetical order, and `routes`
sorts before `set`, so a `set:server` message that also carries
`routes` used to be dispatched to `role:web,routes:*`: the routes were
mapped with the new context, but the context was never stored. The
plugin now also adds `role:web,set:server,routes:*`, which has more
properties and therefore wins, and which runs `setServer`.

The third pattern, `init:web`, is Seneca's plugin initialization hook
(Seneca sends `role:seneca,plugin:init,init:web`, which matches it). It
stores the options as the current server and maps the `routes` option.

## Which Seneca instance sends the request messages

Adapters send one message per web request using the Seneca instance
they were called with. Seneca marks everything a plugin does during
definition and initialization as fatal (`fatal$`), so that a plugin
that fails to load stops the process rather than leaving a half
working service. That is right for initialization, but the adapter
keeps the instance for the lifetime of the server. Until 2.3.0 the
plugin passed its own delegate along, with the consequence that an
action error during a request was treated as fatal: Seneca logged a
fatal report, closed the instance and exited. Since 2.3.0 adapters are
called with a delegate of the root instance, which carries no `fatal$`
and no transaction id, so every request message is an ordinary message
in its own transaction. See
[Handle errors and status codes](../how-to/handle-errors-and-status-codes.md).

## One configuration per process

The plugin keeps its state (the current adapter, context, auth, options
and the options from `use`) in variables of the module, not of the
Seneca instance. This dates from the 2016 rebuild and is kept for
compatibility: `seneca.export('web/context')()` and `set:server` are
process wide. The practical limits are described in
[Options](../reference/options.md#one-configuration-per-process): load
the plugin once per process, or pass a `context` with each `role:web`
message when several servers are needed.
