import SerialPort from 'serialport'
import noble from 'noble'
import { setTimeout } from 'timers'

let bluetoohReady = false

let scaning = false

let discoverCb

noble.on('stateChange', state => {
  bluetoohReady = state === 'poweredOn'
})

noble.on('discover', peripheral => {
  discoverCb(peripheral)
})

class SerialportFactory {
  static list (cb = () => {}) {
    return new Promise((resolve, reject) => {
      SerialPort.list((err, ports) => {
        if (err) {
          reject(err)
        } else {
          cb(ports)
          resolve(ports)
        }
      })
    })
  }

  static create (options) {
    return new PromiseSerialPort(options)
  }
}

class PromiseSerialPort {
  constructor (options) {
    this.isOpend = false
    this.instance = new SerialPort(options.path, Object.assign({
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
      autoOpen: false,
      parser: SerialPort.parsers.readline('\n')
    }, options))
  }

  isConnected () {
    return this.isOpend
  }

  connect () {
    return new Promise((resolve, reject) => {
      if (this.isOpend) {
        resolve()
      }
      this.instance.open(err => {
        if (err) {
          reject(err)
        } else {
          this.isOpend = true
          resolve()
        }
      })
    })
  }

  disconnect () {
    return new Promise((resolve, reject) => {
      this.instance.close(err => {
        if (err) {
          reject(err)
        } else {
          this.isOpend = false
          resolve()
        }
      })
    })
  }

  on (event, cb) {
    this.instance.on(event, cb)
  }

  clear () {
    this.instance.removeAllListeners('data')
  }
}

class Bluetooh {
  static scan (timeout = 20000, cb) {
    if (bluetoohReady) {
      if (scaning) {
        noble.stopScanning()
      }
      discoverCb = cb
      noble.startScanning()
      scaning = true
      setTimeout(() => { Bluetooh.stop() }, timeout)
    }
  }

  static stop () {
    noble.stopScanning(err => {
      scaning = true
    })
  }
}

export {SerialportFactory, PromiseSerialPort, Bluetooh}
