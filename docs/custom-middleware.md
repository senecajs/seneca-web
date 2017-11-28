# Custom Middleware  support

Now you can define object under `middleware` key in seneca option. The middleware will be an object with key as middleware name and value as middleware functions as follows;

```
seneca = Seneca()
seneca.use(SenecaWeb, {
   middleware = [
                {'middleware1': (req, res, next) => {...etc...}},
                {'middleware2': (req, res, next) => {...etc...}},
            ]
})
seneca.ready(() => {
 
})
```

Then you can specify certain route to use specific middleware as follows;

```
{
  "routes": [
    {
      pin: 'role:api,cmd:*',
      map: {
        ping: {
          GET: 'true',
          middleware: ['middleware1', 'middleware2']
        }
      }
    }
  ]
}
```

## Or single middleware

```
{
  "routes": [
    {
      pin: 'role:api,cmd:*',
      map: {
        ping: {
          GET: 'true',
          middleware: 'middleware1'
        }
      }
    }
  ]
}
```
