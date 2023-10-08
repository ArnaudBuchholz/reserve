'use strict'

require('mock-require')('os', {
  networkInterfaces: () => ({
    Ethernet: [
      {
        address: 'ffff:dddd:bbbb:1:8888:666:4444:2222',
        netmask: 'ffff:ffff:ffff:ffff::',
        family: 'IPv6',
        mac: 'FF:FF:FF:FF:FF:FF',
        internal: false,
        cidr: 'eeee:cccc:aaaa:1:9999:7777:555:3333/64',
        scopeid: 0
      },
      {
        address: 'ffff:dddd:bbbb:1:8888:666:4444:1111',
        netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
        family: 'IPv6',
        mac: 'FF:FF:FF:FF:FF:FF',
        internal: false,
        cidr: 'eeee:cccc:aaaa:1:9999:7777:555:3333/128',
        scopeid: 0
      },
      {
        address: 'ffff::eeee:dddd:cccc:bbbb',
        netmask: 'ffff:ffff:ffff:ffff::',
        family: 'IPv6',
        mac: 'FF:FF:FF:FF:FF:FF',
        internal: false,
        cidr: '9999::8888:7777:6666:5555/64',
        scopeid: 15
      },
      {
        address: '192.168.0.1',
        netmask: '255.255.252.0',
        family: 'IPv4',
        mac: 'FF:FF:FF:FF:FF:FF',
        internal: false,
        cidr: '192.168.0.1/22'
      }
    ],
    'Loopback Pseudo-Interface 1': [
      {
        address: '::1',
        netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
        family: 'IPv6',
        mac: '00:00:00:00:00:00',
        internal: true,
        cidr: '::1/128',
        scopeid: 0
      },
      {
        address: '127.0.0.1',
        netmask: '255.0.0.0',
        family: 'IPv4',
        mac: '00:00:00:00:00:00',
        internal: true,
        cidr: '127.0.0.1/8'
      }
    ]
  })
})
