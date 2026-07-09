![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] plugin

# @seneca/web

| ![Voxgig](https://www.voxgig.com/res/img/vgt01r.png) | This open source module is sponsored and supported by [Voxgig](https://www.voxgig.com). |
|---|---|

## Install

```sh
npm install seneca-web
```

## Quick Example

__Route map__
```js
var Routes = [{
  pin: 'role:admin,cmd:*',
  prefix: '/v1',
  postfix: '/?param=true',
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
        pass: '/profile',
        fail: '/'
      }
    }
  }
}]
```

## More Examples

See [test/](test/) for usage examples.

## Motivation

This plugin allows HTTP requests to be mapped to Seneca actions. HTTP actions handled locally can access the raw request and response objects.

## Support

If you're using this module and need help, you can:

- Post a [github issue][]
- Tweet to [@senecajs][]
- Ask on the [Gitter][gitter-url]

## API

### Action Patterns

#### role:web,route:*
Define a web service as a mapping from URL routes to action patterns.

#### role:web,set:server
Change plugin configuration options.

### Adapters

- [seneca-web-adapter-express](https://github.com/senecajs/seneca-web-adapter-express)
- [seneca-web-adapter-hapi](https://github.com/senecajs/seneca-web-adapter-hapi)
- [seneca-web-adapter-koa1](https://github.com/senecajs/seneca-web-adapter-koa1)
- [seneca-web-adapter-koa2](https://github.com/senecajs/seneca-web-adapter-koa2)

## Contributing

The [Senecajs org][] encourages open participation. If you feel you can help in any way, be it with documentation, examples, extra testing, or new features please get in touch.

### Running tests

```sh
npm run test
```

## Background

Sponsored originally by [nearForm](http://nearform.com). See [docs/examples](./docs/examples) for usage examples.

[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter chat][gitter-badge]][gitter-url]
[Sponsor]: http://nearform.com
[Logo]: http://senecajs.org/files/assets/seneca-logo.png
[npm-badge]: https://badge.fury.io/js/seneca-web.svg
[npm-url]: https://badge.fury.io/js/seneca-web
[travis-badge]: https://api.travis-ci.org/senecajs/seneca-web.svg
[travis-url]: https://travis-ci.org/senecajs/seneca-web
[coveralls-badge]:https://coveralls.io/repos/senecajs/seneca-web/badge.svg?branch=master&service=github
[coveralls-url]: https://coveralls.io/github/senecajs/seneca-web?branch=master
[david-badge]: https://david-dm.org/senecajs/seneca-web.svg
[david-url]: https://david-dm.org/senecajs/seneca-web
[gitter-badge]: https://badges.gitter.im/senecajs/seneca.png
[gitter-url]: https://gitter.im/senecajs/seneca
[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[Seneca.js]: https://www.npmjs.com/package/seneca
[senecajs.org]: http://senecajs.org/
[github issue]: https://github.com/senecajs/seneca-web/issues
[@senecajs]: http://twitter.com/senecajs
[providing-routes]: https://github.com/senecajs/seneca-web/blob/master/docs/providing-routes.md
