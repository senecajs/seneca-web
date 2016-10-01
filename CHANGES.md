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
