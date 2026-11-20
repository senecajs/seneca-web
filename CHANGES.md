# Changes

## 3.0.0 2026-11-20

First release under the name `@seneca/web`. Versions up to 2.2.2 were
published as `seneca-web`. Version 2.3.0 was prepared but never
published; its changes are part of this release.

- Seneca 4: the peer dependency is `seneca` `^4.0.0`. Seneca 3 users
  stay on `seneca-web@2`.
- Renamed from `seneca-web` to `@seneca/web`. Load the plugin with
  `seneca.use(require('@seneca/web'), options)`.
- Node.js 24 or later (`engines.node` `>=24`).
- The plugin merges its options with `seneca.util.deep` instead of the
  deprecated `seneca.util.deepextend` (D2), so loading it no longer
  prints the `SENECA_DEP_UTIL_DEEPEXTEND` warning. The merge is the
  same.
- Breaking: route paths are built with `path.posix.join` instead of the
  deprecated `url.parse`, which printed a deprecation warning on
  Node.js 24. Paths are no longer percent encoded (for example a space
  stays a space); route parameters and framework path syntax are
  unchanged.
- Fix: messages sent by adapters for web requests are no longer fatal.
  Routes given in the plugin options were mapped with the delegate of
  the plugin init action, which Seneca marks `fatal$`, so an action
  error during a web request closed the instance and exited the
  process. Adapters are now called with a delegate of the root instance
  with no fixed arguments: request messages are not fatal, each one
  starts its own transaction, and route actions run in their own plugin
  context, so their error message templates apply.
- Fix: a `role:web,set:server` message that also carries `routes` now
  stores the new server before mapping the routes. It used to be
  dispatched to `role:web,routes:*`, so the server was used once but not
  stored. The plugin adds the pattern `role:web,set:server,routes:*`.
- Tests: Mocha 12, ESLint 10 with a flat config (`eslint.config.js`),
  new tests for the plugin messages and exports, every test closes its
  Seneca instance. `c8` replaces `nyc` for `npm run coverage`. Tested
  with Seneca 4.0.0 on Node.js 26.
- Removed the Travis CI configuration and the `coveralls` script; the
  GitHub Actions workflow is provided as a patch in `.patches/`.
- `package.json`: `repository.url` in the `git+https` form,
  `publishConfig.access` `public`, `CHANGES.md` in `files`;
  `package-lock.json` is no longer committed. The examples use the
  Express adapter under its new name, `@seneca/web-adapter-express`.
  It is no longer a development dependency, because it depends on this
  package; install it with `npm install --no-save
  @seneca/web-adapter-express` to run the examples.
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
