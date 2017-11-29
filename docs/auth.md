# Authorization

You can provide `auth` and `secure` keys to routes to indicate they should be authenticated/secured.

For express, you can provide an `auth` to the root seneca-web configuration (typically this is a configured Passport instance)

Please refer to the [hapi-secure](./examples/hapi-secure.js) and [express-secure](./examples/express-secure.js) for functional examples.

Currently authentication is not supported with the following adapters:

* seneca-web-adapter-connect
* seneca-web-adapter-koa-1
* seneca-web-adapter-koa-2

## Configuration

The following options are used to configure authentication on routes attached with `seneca-web`.

On the root `seneca-web` configuration object:

* `auth` - authentication provider - used only with `express`

On each route:

* `auth` - an object that is passed to the underlying web framework.

  * `strategy` - a string identifying the strategy to use

  * `pass` - redirect the user somewhere upon success

  * `fail` - redirect the user somewhere upon failure

* `secure` - a object indicating a route requires a req.user to be present (express only)

  * `fail` - user will be redirected here if not logged in
