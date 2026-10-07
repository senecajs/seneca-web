# Request mapping reference

How an adapter turns a web request into a Seneca message, and a reply
into a web response. The plugin defines the convention; each adapter
implements it with its framework's objects. The table below is taken
from the published adapters: seneca-web-adapter-express 1.2.1,
seneca-web-adapter-connect 1.1.0, seneca-web-adapter-koa2 1.2.1 and
seneca-web-adapter-hapi 1.0.2.

## The message

The adapter calls `seneca.act(route.pattern, message, callback)`, where
`route` is the [mapped route](route-mapping.md#mapped-route). The
message has:

| Property | Content |
| -------- | ------- |
| the pattern properties | From `route.pattern`, for example `role: 'todo', cmd: 'list'`. |
| `args` | A plain object with the request data (below). It travels over transports. |
| `request$` | The framework's request object. Removed when the message leaves the process. |
| `response$` | The framework's response object. Removed when the message leaves the process. |

Seneca removes properties whose names end in `$` from messages that it
sends over a transport, so an action running in another service receives
`args` but not `request$` or `response$`. Such an action can not use
`autoreply: false` or inspect headers.

### `args` by adapter

| Property | express | connect | koa2 | hapi |
| -------- | ------- | ------- | ---- | ---- |
| `body` | raw body string when `parseBody` is `true` (default); otherwise `request.body` or `{}` | raw body string when `parseBody` is `true`; otherwise `request.body` or `{}` | parsed with `co-body` for POST and PUT when `parseBody` is not `false`; otherwise `ctx.request.body`; `{}` for other methods | `request.payload` |
| `query` | `request.query` | parsed from the URL with `querystring` | copy of `ctx.request.query` | `request.query` |
| `params` | `request.params` | not set | copy of `ctx.params` | `request.params` |
| `route` | the mapped route | the mapped route | not set | the mapped route |
| `user` | `request.user` or `null` | not set | not set | `request.auth.credentials` or `null` |
| `state` | not set | not set | copy of `ctx.state` | not set |
| `isAuthenticated` | not set | not set | not set | `request.auth.isAuthenticated` |
| `request$` | `request` (unless `options.includeRequest` is `false`) | `request` | `ctx.request` | `request` |
| `response$` | `response` (unless `options.includeResponse` is `false`) | `response` | `ctx.response` | the `reply` interface |

With the Express adapter and the default `parseBody: true`, a JSON body
arrives as the string `'{"note":"hi"}'`; the action parses it. With
`parseBody: false` and `app.use(express.json())`, it arrives parsed. See
the `parseBody` note in [Options](options.md#adapter-options).

Example message received by an action behind the Express adapter for
`POST /api/echo/42?x=1` with `parseBody: false` and `express.json()`
(from [`getting-started.js`](../examples/getting-started.js)):

```js
{
  role: 'greeting',
  cmd: 'echo',
  args: {
    body: { note: 'hi' },
    route: { /* the mapped route */ },
    params: { id: '42' },
    query: { x: '1' },
    user: null,
  },
  request$: /* Express request */,
  response$: /* Express response */,
}
```

## The response

When the action replies, the adapter does the first of these that
applies:

| Condition | express | connect | koa2 | hapi |
| --------- | ------- | ------- | ---- | ---- |
| the action replied with an error | `next(err)`: Express error handling | `next(err)` | the handler rejects: Koa error handling (status 500 by default) | `reply(err)` |
| `route.redirect` is set | `response.redirect(url)` (302) | not supported | `ctx.redirect(url)` | `reply.redirect(url)`, before calling the action |
| `route.autoreply` is `true` | `response.send(reply)` (JSON for objects, status 200) | status 200, `application/json`, `JSON.stringify(reply)` | `ctx.body = reply`, status 200, type `json` | `reply(null, result)` |
| `route.autoreply` is `false` | nothing: the action responds through `response$` | nothing | nothing | nothing |

With `autoreply: false` the action is responsible for the whole
response, for example `msg.response$.status(201).json({...})` with
Express; the action still has to call `reply()` so that the message
completes.

## Errors

On Seneca 4 the error given to the adapter's callback is the error
object the action replied with (or threw): `err.message` and `err.code`
are the action's. Seneca attaches its own description as `err.meta$`.
On Seneca 3 (with the default `legacy.error: true`) the error is a
wrapper whose message is `seneca: Action <pattern> failed: <message>.`,
with the action's error as `err.orig` and its message also in
`err.details.message`. Code that must run on both reads
`(err.orig || err).message`. See
[Handle errors and status codes](../how-to/handle-errors-and-status-codes.md).

## Which Seneca instance sends the message

The adapter sends the message with the Seneca instance it was called
with. Since version 2.3.0 that is a delegate of the root instance, so
request messages are not fatal and each request starts its own
transaction (`meta.tx`). Before 2.3.0, routes given in the plugin
options were mapped with the delegate of the plugin init action, which
Seneca marks `fatal$`; every request message inherited the flag and an
action error ended the process.
