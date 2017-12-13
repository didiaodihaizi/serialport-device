import {
  ipcMain as ipc
} from 'electron'
import {
  SerialportFactory,
  Bluetooh
} from './serialport'

const instances = new Map()
const cbs = new Map()
let bles = {}

export default {
  init: () => {
    ipc.on('bluethooth-scanning-request', (event, timeout = 30000) => {
      Bluetooh.scan(timeout, (record) => {
        let address = record.address === 'unknown' ? record.manufacturer.address : record.address
        bles[address] = record
        event.sender.send('bluethooth-scanning-response', record)
      })
    })

    ipc.on('bluethooth-stop-request', (event, id) => {
      new Promise((resolve, reject) => {
        Bluetooh.stop(reject)
        resolve()
      })
      .then(() => {
        event.sender.send(`${id}-bluethooth-stop-response`)
      })
      .catch(error => {
        event.sender.send(`${id}-bluethooth-stop-response`, error)
      })
    })

    ipc.on('serialport-list-request', (event, id) => {
      SerialportFactory
      .list()
      .then(list => {
        event.sender.send(`${id}-serialport-list-response`, null, list)
      })
      .catch(error => {
        event.sender.send(`${id}-serialport-list-response`, error)
      })
    })

    ipc.on('advanpro-serialport-create-request', (event, id, options) => {
      let instance = instances.get(options.path)
      if (!instance) {
        instance = SerialportFactory.create(options)
        instances.set(options.path, instance)
      } else {
        instance.clear()
      }

      return event.sender.send(`${id}-advanpro-serialport-create-response`, null, options.path)
    })

    ipc.on('device-connect-request', (event, id, address) => {
      let instance = instances.get(address)
      if (!instance) {
        event.sender.send(`${id}-device-connect-response`, new Error('Not Found'))
        return
      }

      if (!instance.isConnected()) {
        instance
          .connect()
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
        return
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
      }

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
  },
  destory: () => {
    instances.forEach((value, key) => {
      let instance = instances.get(key)
      instance.disconnect()
    })
  }
}
