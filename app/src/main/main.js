import {
  app,
  BrowserWindow
} from 'electron'
import bridge from './utils/bridge'
let mainWindow = null
let winURL = process.env.NODE_ENV !== 'development' ? `file://${__dirname}/index.html` : 'http://localhost:9998'

function createWindow () {
  mainWindow = new BrowserWindow({
    height: 768,
    width: 1280,
    center: true
  })

  mainWindow.loadURL(winURL)

  bridge.init()

  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
}

const isSecondInstance = app.makeSingleInstance((commandLine, workingDirectory) => {
  // Someone tried to run a second instance, we should focus our window.
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

if (isSecondInstance) {
  app.quit()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
