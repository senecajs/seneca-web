![Seneca][Logo]

# seneca-web
[![npm version][npm-badge]][npm-url]
[![Build Status][travis-badge]][travis-url]
[![Coverage Status][coveralls-badge]][coveralls-url]
[![Dependency Status][david-badge]][david-url]
[![Gitter chat][gitter-badge]][gitter-url]

- __Sponsor:__ [nearForm][Sponsor]
- __Node:__ 4.x, 6.x
- __Seneca:__ 1.x - 3.x


This plugin allows http methods to be mapped to seneca actions. Http actions handled
locally can access the raw `request` and `response` objects. Actions handled over
transport can access a reduced set of request data including payloads and headers.

If you're using this module, and need help, you can:

- Post a [github issue][],
- Tweet to [@senecajs][],
- Ask on the [Gitter][gitter-url].

If you are new to Seneca in general, please take a look at [senecajs.org][]. We have
everything from tutorials to sample apps to help get you up and running quickly.


## Install
```
npm install seneca
```

## Test
To run tests locally,

```
npm run test
```

To obtain a coverage report,

```
npm run coverage; open docs/coverage.html
```

## Quick example




## Action Patterns

### `role:web`

Define a web service as a mapping from URL routes to action patterns.

_Parameters_

   * `use`: mapping object, or middleware function


## Exported Methods




## Contributing
The [Senecajs org][] encourage open participation. If you feel you can help in any way,
be it with documentation, examples, extra testing, or new features please get in touch.


## License
Copyright (c) 2013 - 2016, Richard Rodger and other contributors.
Licensed under [MIT][].

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
