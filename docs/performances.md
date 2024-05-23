# REserve performances

[🔝 REserve documentation](README.md)

## Method used

Static servers are created using different frameworks :

* `native` : based on Node.js v20.11.11 [http](https://nodejs.org/api/http.html) layer ([src](https://github.com/ArnaudBuchholz/reserve/blob/main/samples/static/http.js))
* `reserve` : based on [REserve 2️⃣](https://www.npmjs.com/package/reserve) ([src](https://github.com/ArnaudBuchholz/reserve/blob/main/samples/static/reserve.js))
* `express` : based on [express](https://www.npmjs.com/package/express) ([src](https://github.com/ArnaudBuchholz/reserve/blob/main/samples/static/express.js))
* `koa` : based on [koa](https://www.npmjs.com/package/express) and [koa-send](https://www.npmjs.com/package/koa-send) ([src](https://github.com/ArnaudBuchholz/reserve/blob/main/samples/static/koa.js))
* `fastify` : based on [fastify](https://www.npmjs.com/package/fastify) and [@fastify/static](https://www.npmjs.com/package/@fastify/static) ([src](https://github.com/ArnaudBuchholz/reserve/blob/main/samples/static/fastify.js))

A [benchmark](https://github.com/ArnaudBuchholz/reserve/blob/main/samples/static/benchmark.js) tool - based on [autocannon](https://www.npmjs.com/package/autocannon) - measure the number of hits achieved on the following URLs :

* `/hello` : which returns "Hello World !" statically
* `/index.html` : which is a file mapping to [`index.html`](https://github.com/ArnaudBuchholz/reserve/blob/main/samples/static/www/index.html)

> [!IMPORTANT]
> The default settings of `autocannon` are kept : 10 rounds of measurements are recorded.

## Results

### Hello World !

| implementation | Average hits / 10s |
|---|---|
| express | 81019 |
| koa | 224420 |
| reserve | 226501 |
| fastify | 252594 |
| native | 279925 |

### index.html

| implementation | Average hits / 10s |
|---|---|
| index.html | 45396 |
| express | 43082 |
| native | 43703 |
| koa | 44386 |
| reserve | 47163 |
| fastify | 48750 |

> [!NOTE]
> Some implementations cache the file information. It explains why they are faster than the native one.

## Conclusions

REserve appears to be slower than fastify but is faster than express and koa.