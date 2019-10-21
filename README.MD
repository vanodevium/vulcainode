# VulcaiNode

VulcaiNode is JavaScript implementation of [vulcain](https://vulcain.rocks) protocol

## Configuration

You must set environment variables:

- UPSTREAM
- PORT

Additional settings:
- LOGGER

> You can use `.env` file

## Usage

VulcaiNode accept only case-insensitive headers unlike original [vulcain](https://vulcain.rocks) implementation:

- preload
- fields


```js
const vulcainode = 'https://ip:port/v1'
const resp = await fetch(vulcainode + '/resource', {
  headers: {
    preload: '/relation1/*/relation2/relation3',
    fields: '/:id,field1,field2/relation2:id,field1/relation3:id'
  },
  credentials: 'same-origin',
})
return await resp.json()
```

## Starting

```shell script
UPSTREAM=http://your-api:8888/v1 PORT=1234 node index.js
```

> Better to use [pm2](https://www.npmjs.com/package/pm2)

## Roadmap

- [x] Preload
- [x] Fields
- [ ] OpenApi 3 integration
- [ ] Tests

## License

[MIT](./LICENSE.MD) © [Vano Devium](https://www.devium.me/)
