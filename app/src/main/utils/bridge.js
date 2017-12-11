import {
  ipcMain as ipc
} from 'electron'
import {
  BluetoothAdapter,
  AdvanproPi,
  Discoverer
} from 'advanpro-node-device'

const instances = new Map()
const cbs = new Map()
let bles = {}

export default {
  init: () => {
    ipc.on('bluethooth-scanning-request', (event, timeout = 30000) => {
      BluetoothAdapter.scan(timeout, (record) => {
        let address = record.address === 'unknown' ? record.manufacturer.address : record.address
        bles[address] = record
        event.sender.send('bluethooth-scanning-response', record)
      })
    })

    ipc.on('bluethooth-stop-request', (event, id) => {
      BluetoothAdapter
        .stop()
        .then(() => {
          event.sender.send(`${id}-bluethooth-stop-response`)
        })
        .catch((error) => {
          event.sender.send(`${id}-bluethooth-stop-response`, error)
        })
    })

    ipc.on('bluethooth-batch-request', (event, id, options) => {
      new Promise((resolve) => {
        let list = []
        let exist = []
        for (let address of options.address) {
          if (instances.has(address)) {
            exist.push({ address })
            event.sender.send(`${id}-bluethooth-batch-cb-response`, address)
          } else {
            list.push(address)
          }
        }

        if (!list.length) {
          return resolve()
        }

        options.address = list
        resolve(BluetoothAdapter.batch(options, (device) => {
          instances.set(device.address, instance)
          event.sender.send(`${id}-bluethooth-batch-cb-response`, device.address)
        }))
      })
        .then((devices = []) => {
          let rs = devices.map((element) => element.address)
          event.sender.send(`${id}-bluethooth-batch-response`, null, rs.concat(exist))
        })
        .catch((error) => {
          event.sender.send(`${id}-bluethooth-batch-response`, error, null)
        })
    })

    ipc.on('bluethooth-create-request', (event, id, options) => {
      new Promise((resolve) => {
        let instance = instances.get(options.address)
        if (!instance) {
          instance = bles[options.address] ? BluetoothAdapter.create(bles[options.address]) : BluetoothAdapter.instance(options)
        } else {
          instance.clear()
        }

        resolve(instance)
      })
        .then((instance) => {
          if (instance) {
            instances.set(options.address, instance)
          }
          event.sender.send(`${id}-bluethooth-create-response`, null, instance ? options.address : null)
        })
        .catch((error) => {
          event.sender.send(`${id}-bluethooth-create-response`, error, null)
        })
    })

    ipc.on('serialport-list-request', (event, id) => {
      Discoverer
        .serialport()
        .then((list) => {
          event.sender.send(`${id}-serialport-list-response`, null, list)
        })
        .catch((error) => {
          event.sender.send(`${id}-serialport-list-response`, error)
        })
    })

    ipc.on('advanpro-serialport-create-request', (event, id, options) => {
      let instance = instances.get(options.path)
      if (!instance) {
        instance = new AdvanproPi.Serialport(options)
        instances.set(options.path, instance)
      } else {
        instance.clear()
      }

      return event.sender.send(`${id}-advanpro-serialport-create-response`, null, options.path)
    })

    ipc.on('device-connect-request', (event, id, address, options) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-connect-response`, new Error('Not Found'))
        return;
      }

      if (!instance.isConnected()) {
        instance
          .connect(options)
          .then(() => {
            event.sender.send(`${id}-device-connect-response`, null)
          })
          .catch((error) => {
            event.sender.send(`${id}-device-connect-response`, error)
          })
      } else {
        event.sender.send(`${id}-device-connect-response`, null)
      }
    })

    ipc.on('device-disconnect-request', (event, id, address) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-disconnect-response`, new Error('Not Found'))
        return;
      }

      if (instance.isConnected()) {
        instance
          .disconnect()
          .then(() => event.sender.send(`${id}-device-disconnect-response`, null))
          .catch((error) => {
            event.sender.send(`${id}-device-n-response`, error)
          })
      } else {
        event.sender.send(`${id}-device-disconnect-response`, null)
      }
    })

    ipc.on('device-isConnected-request', (event, id, address) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-isConnected-response`, new Error('Not Found'))
      }

      try {
        event.sender.send(`${id}-device-isConnected-response`, null, instance.isConnected())
      } catch (error) {
        event.sender.send(`${id}-device-isConnected-response`, error)
      }
    })

    ipc.on('device-on-request', (event, id, address, key) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-on-response`, new Error('Not Found'))
      }

      let cb = (data) => {
        event.sender.send(`${id}-device-on-response`, null, data)
      };

      cbs.set(id, cb)
      instance.on(key, cb)
    })

    ipc.on('device-un-request', (event, id, address, key) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-un-response`, new Error('Not Found'))
      }

      try {
        instance.un(key, cbs.get(id))
        event.sender.send(`${id}-device-un-response`, null)
      } catch (error) {
        event.sender.send(`${id}-device-un-response`, error)
      }
    })

    ipc.on('device-command-request', (event, id, address, key, params, timeout) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-command-response`, new Error('Not Found'))
      }

      instance
        .command(key, params, timeout)
        .then((res) => {
          event.sender.send(`${id}-device-command-response`, null, res)
        })
        .catch((error) => {
          cbs.delete(id)
          event.sender.send(`${id}-device-command-response`, error)
        })
    })

    ipc.on('device-start-request', (event, id, address, params, timeout) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-start-response`, new Error('Not Found'))
      }

      instance
        .start(params, timeout)
        .then((res) => {
          event.sender.send(`${id}-device-start-response`, null, res)
        })
        .catch((error) => {
          cbs.delete(id)
          event.sender.send(`${id}-device-start-response`, error)
        })
    })

    ipc.on('device-stop-request', (event, id, address, params, timeout) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-stop-response`, new Error('Not Found'))
      }

      instance
        .stop(params, timeout)
        .then((res) => {
          event.sender.send(`${id}-device-stop-response`, null, res)
        })
        .catch((error) => {
          cbs.delete(id)
          event.sender.send(`${id}-device-stop-response`, error)
        })
    })

    ipc.on('device-get-request', (event, id, address, key) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-get-response`, new Error('Not Found'))
      }

      event.sender.send(`${id}-device-get-response`, null, instance[key])
    })
  },
  destory: () => {
    instances.forEach((value, key) => {
      let instance = instances.get(key)
      instance.disconnect()
    })
  }
}
