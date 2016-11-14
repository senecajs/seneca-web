# Providing Routes

At it's core, seneca-web maps seneca actions to a web framework's routes.

## Route Definition

Options for what is mapped and how it behaves is performed by passing the route config object to seneca-web by either acting upon `role:web` or by calling the exported `web/mapRoutes` method.

### routes[]

routes is an array of objects that define how a seneca pin is to be turned into a web route.

* `pin` - the seneca actions to pin on.  If an asterik is provided, it will be expanded into the commands in `map` below.

* `prefix` - a prefix applied to all mapped actions

* `postfix` - a suffix applied to all mapped actions.

* `map` - an object or boolean defining all commands to map (see below)

### map

`map` is an object with each key assumed to be an action available under the `pin` specified at the root of `routes`

Each value can be either:

* `true` if true is passed, a simple `GET` is created using ${prefix}/${key}/${postfix}

* `object` an object can be passed to customize the path and behavior of the route.

If an object is passed, the following properties are recognized:

* `alias` - if provided, `prefix`, `postfix` and the `name` are ignored this string will be used for the path; no frills, no gimmicks. (default: false)

* `auth` - if provided, this will be passed to the framework's auth setup.  This is highly dependent on framework, for more details see [auth](./auth.md)

* `autotreply` - if false, seneca-web will not respond to the request. The seneca action must use the framework's response action to generate the response.  (default: true)

* `name` - if provided, this will allow you to override the name of the action (default: the key of the object)

* `redirect` - if provided, instead of returning the response of the seneca action, the user will be redirected here instead.  (default: false)

* `secure` - this is used in conjunction with `auth`.   For more details see [auth](./auth.md)

* `suffix` - if provided, this will be appended to the path. (default: false)

In addition to the above, the following HTTP verbs can be provided as `true`

* GET
* POST
* PUT
* HEAD
* DELETE
* OPTIONS
* PATCH

If any of these are passed, this type of HTTP verb will be added. Any combination of verbs can be used.

### Path Generation

If `alias` is used:

    /${alias}

Otherwise:

    /${prefix}/${key}/${postfix}/${suffix}

### Quick Examples

```js
const Routes = [{
  pin: 'role:admin,cmd:*',
  prefix: '/v1',
  postfix: '/:id'
  map: {
    home: {
      GET: true,
      POST: true,
      alias: '/home'
    },
    logout: {
      GET: true,
      redirect: '/'
    },
    profile: {
      GET: true,
      autoreply: false
    },
    login: {
      POST: true,
      auth: {
        strategy: 'local',
        pass: '/v1/profile',
        fail: '/'
      }
    }
  }
}]
```

Results in:

| method    | route           | action                 | notes                                                                |
|-----------|-----------------|------------------------|----------------------------------------------------------------------|
| GET, POST | /               | role:admin,cmd:home    | alias has overwritten everything else; GET/POST both added           |
| GET       | /v1/logout/:id  | role:admin,cmd:logout  | user is redirected to '/'                                            |
| GET       | /v1/profile/:id | role:admin,cmd:profile | no response is generated, action must respond via response$          |
| POST      | /v1/login/:id   | role:admin,cmd:login   | local auth strategy is used, user is redirected upon success/failure |

### REST example

```js
const Routes = [{
  prefix: '/user',
  pin: 'role:user,cmd:*',
  map: {
    list: {GET: true, name: ''}
    load: {GET: true, name: '', suffix: '/:id'},
    edit: {PUT: true, name: '', suffix: '/:id'},
    create: {POST: true, name: ''},
    delete: {DELETE: true, name: '', suffix: '/:id'},
  }
}]

```
Results in:

| method | route     | action               |
|--------|-----------|----------------------|
| GET    | /user     | role:user,cmd:list   |
| GET    | /user/:id | role:user,cmd:load   |
| PUT    | /user/:id | role:user,cmd:edit   |
| POST   | /user     | role:user,cmd:create |
| DELETE | /user/:id | role:user,cmd:delete |
