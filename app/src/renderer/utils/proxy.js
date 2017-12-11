import { ipcRenderer } from 'electron'

let id = 0

class AdvanproPiSerialport {
  static scan (cb = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-serialport-list-response`, (event, error, list) => {
        cb(error, list)
        return error
          ? reject(error)
          : resolve(list)
      })
      ipcRenderer.send('serialport-list-request', index)
    })
  }

  static create (options, cb = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-advanpro-serialport-create-response`, (event, error, address) => {
        cb(error, address)
        return error
          ? reject(error)
          : resolve(new ProxyDevice(address))
      })

      ipcRenderer.send('advanpro-serialport-create-request', index, options)
    })
  }
}

class BluetoothAdapter {
  static scan (cb = () => {}) {
    BluetoothAdapter.scanner = cb
    ipcRenderer.on('bluethooth-scanning-response', (event, record) => {
      BluetoothAdapter.scanner(record)
    })
    ipcRenderer.send('bluethooth-scanning-request')
  }

  static stop (cb = () => {}) {
    ipcRenderer.removeListener('bluethooth-scanning-response', BluetoothAdapter.scanner)

    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-bluethooth-stop-response`, (event, error) => {
        cb(error)
        return error
          ? reject(error)
          : resolve()
      })

      ipcRenderer.send('bluethooth-stop-request', index)
    })
  }

  static batch (options, cb = () => {}, callback = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.on(`${index}-bluethooth-batch-cb-response`, (event, address) => {
        let proxy = new ProxyDevice(address)
        cb(proxy)
      })

      ipcRenderer.once(`${index}-bluethooth-batch-response`, (event, error, address) => {
        callback(error, address)
        if (error) {
          reject(error)
        } else {
          resolve(address)
        }
      })
    })
  }

  static create (options, cb = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-bluethooth-create-response`, (event, error, address) => {
        cb(error, error ? null : new ProxyDevice(address))

        return error
          ? reject(error)
          : resolve(address
            ? new ProxyDevice(address)
            : null)
      })

      ipcRenderer.send('bluethooth-create-request', index, options)
    })
  }
}

const cbs = []

class ProxyDevice {
  constructor (address) {
    this.address = address
  }

  connect (options, cb = () => {}) {
    if (typeof (options) === 'function') {
      cb = options
    }

    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-device-connect-response`, (event, error) => {
        cb(error)
        return error
          ? reject(error)
          : resolve()
      })
      ipcRenderer.send('device-connect-request', index, this.address, options)
    })
  }

  disconnect (cb = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-device-disconnect-response`, (event, error) => {
        cb(error)
        return error
          ? reject(error)
          : resolve()
      })

      ipcRenderer.send('device-disconnect-request', index, this.address)
    })
  }

  isConnected (cb = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-device-isConnected-response`, (event, error, isConnected) => {
        cb(error, isConnected)
        return error
          ? reject(error)
          : resolve(isConnected)
      })

      ipcRenderer.send('device-isConnected-request', index, this.address)
    })
  }

  on (key, cb = () => {}) {
    let index = id++
    let warp = (event, error, data) => {
      cb(error, data)
    };

    cbs.push({ index, cb, warp })
    ipcRenderer.on(`${index}-device-on-response`, warp)
    
    ipcRenderer.send('device-on-request', index, this.address, key)
  }

  un (key, listeners, cb = () => {}) {
    return new Promise((resolve, reject) => {
      let item = cbs.find((element) => element.cb === listeners)
      if (!item) {
        resolve()
      } else {
        ipcRenderer.send('device-un-request', item.index, this.address, key)

        ipcRenderer.once(`${item.index}-device-un-response`, (event, error) => {
          ipcRenderer.un(`${item.index}-device-on-response`, item.warp)
          cb(error)
          return error
            ? reject(error)
            : resolve()
        })
      }
    })
  }

  command (key, params, timeout, cb = () => {}) {
    if (typeof (params) === 'number') {
      timeout = params
      params = []
    }

    if (typeof (params) === 'function') {
      cb = params
      params = []
    }

    if (typeof (timeout) === 'function') {
      cb = timeout
      timeout = 3000
    }

    if (!params) {
      params = []
    }

    if (!timeout) {
      timeout = 3000
    }

    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-device-command-response`, (event, error, res) => {
        cb(error, res)
        return error
          ? reject(error)
          : resolve(res)
      })
      ipcRenderer.send('device-command-request', index, this.address, key, params, timeout)
    })
  }

  start (params, timeout, cb = () => {}) {
    if (typeof (params) === 'number') {
      timeout = params
      params = []
    }

    if (typeof (params) === 'function') {
      cb = params
      params = []
    }

    if (typeof (timeout) === 'function') {
      cb = timeout
      timeout = 3000
    }

    if (!params) {
      params = []
    }

    if (!timeout) {
      timeout = 3000
    }

    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-device-start-response`, (event, error, res) => {
        cb(error, res)
        return error
          ? reject(error)
          : resolve(res)
      })

      ipcRenderer.send('device-start-request', index, this.address, params, timeout)
    })
  }

  stop (cb = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-device-stop-response`, (event, error, res) => {
        cb(error, res)
        return error
          ? reject(error)
          : resolve(res)
      })

      ipcRenderer.send('device-stop-request', index, this.address)
    })
  }

  get (key, cb = () => {}) {
    return new Promise((resolve, reject) => {
      let index = id++
      ipcRenderer.once(`${index}-device-get-response`, (event, error, res) => {
        cb(error, res)
        return error
          ? reject(error)
          : resolve(res)
      })

      ipcRenderer.send('device-get-request', index, this.address, key)
    })
  }


}

export { AdvanproPiSerialport, BluetoothAdapter, ProxyDevice }
