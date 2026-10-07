## 2.3.0 07/10/2026

- Seneca 4 support: tested against the Seneca 4 prerelease (4.0.0-rc5)
  and the unreleased 4.0.0, on Node.js 24 and 22; Seneca 3 remains
  supported. Adds `peerDependencies: { seneca: ">=3 || >=4.0.0-rc5" }`.
- Fix: messages sent by adapters for web requests are no longer fatal.
  Routes given in the plugin options were mapped with the delegate of
  the plugin init action, which Seneca marks `fatal$`, so an action
  error during a web request closed the instance and exited the
  process (on Seneca 3 and 4). Adapters are now called with a delegate
  of the root instance; request messages are not fatal and each one
  starts its own transaction.
- Fix: a `role:web,set:server` message that also carries `routes` now
  stores the new server before mapping the routes. It used to be
  dispatched to `role:web,routes:*`, so the server was used once but not
  stored. The plugin adds the pattern `role:web,set:server,routes:*`.
- Route paths are built with `path.posix.join` instead of the
  deprecated `url.parse`, which printed a deprecation warning on
  Node.js 24. Paths are no longer percent encoded (for example a space
  stays a space); route parameters and framework path syntax are
  unchanged.
- Tests: Mocha 12, ESLint 10 with a flat config (`eslint.config.js`),
  new tests for the plugin messages and exports, every test closes its
  Seneca instance. `c8` replaces `nyc` for `npm run coverage`.
- Removed the Travis CI configuration and the `coveralls` script; the
  GitHub Actions workflow is provided as a patch in `.patches/`.
- Documentation reorganized (tutorial, how-to guides, reference,
  explanation) under `docs/`, with runnable examples in `docs/examples`.

## 2.2.2 04/12/2022

- Bump dependencies.

## 2.2.1 09/09/2018

- Bump dependencies.

## 2.2.0 03/12/2017

- Adds support for providing middleware.

## 2.1.0 13/06/2017

- Minor fixes
- Tagging as per https://senecajs-dev.tumblr.com/post/161775321262/plugin-github-tags-20170613

## 2.0.0 01/10/2016

 - Fix to path generation under windows (#85)
 - Provide option to disable body parser when using express/connect (#93)
 - Suffix handling in route map (#95)
 - Adds support for overwriting route name (#97)
 - Passing string as adapter has been removed (#100). Resolution: Require the module instead,
  - seneca-web-adapter-connect
  - seneca-web-adapter-express
  - seneca-web-adapter-hapi
  - seneca-web-adapter-koa1
  - seneca-web-adapter-koa2
 - Log adapter is now the only default included adapter and runs when no adapter is specified.

## 1.0.0 11/09/2016

* module rebuilt from the ground up
* Routing supported for hapi, express, and connect
* Auth supported for hapi and express
* Passport and Bell now directly supported
* New adapter engine for adding custom adapters
* New route mapper generating a well defined route map
* Startware and Endware no longer supported
* Middleware now longer supported
* Message handling over transport now supported
* seneca-auth no longer supported
* mapRoutes, context, and setServer exported for external use
* Server can now be changed at runtime
* Redirects and Autohandlers now supported for all adapter types
* Logging adapter added for logging routes
* Support added for latest versions of seneca, express, hapi and connect
* Lots of examples added
* Readme updated to new spec and examples


## 0.8.0

* buildcontext type functions for Hapi implementation
* Logging for adding Hapi route
