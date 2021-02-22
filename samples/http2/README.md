# HTTP/2 examples

This sample demonstrates the same file being served with HTTP/1.1, HTTP/2 and HTTP/2 with push mechanism.

## How to start

* `node ../.. --config http.json,http2.json,http2push.json`

## How to use

After starting the servers, opens one or several browsers to :
* http://localhost:8080/ to test HTTP/1.1
* https://localhost:8082/ to test HTTP/2
* https://localhost:8083/ to test HTTP/2 with push

**NOTE** : the certificate is self signed.

Open the debugger and check the network tab.
