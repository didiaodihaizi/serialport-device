import {
  app,
  BrowserWindow,
  ipcMain
} from 'electron'
import bridge from './utils/bridge'
import server from './app'
let mainWindow = null
let winURL = process.env.NODE_ENV !== 'development' ? `file://${__dirname}/index.html` : 'http://localhost:9998'
//background-process
// let backgroundURL = process.env.NODE_ENV !== 'development' ? `file://${__dirname}/background.html` : 'http://localhost:9988'
function createWindow () {
  mainWindow = new BrowserWindow({
    height: 768,
    width: 1280,
    center: true
  })

  mainWindow.loadURL(winURL)

  server.listen()
  bridge.init()

  mainWindow.on('closed', () => {
    mainWindow = null
    app.quit()
  })
}
// function createWindow () {
//   const backgroundProcessHandler = main.createBackgroundProcess(backgroundURL, true);
//   mainWindow = new BrowserWindow({width: 1280, height: 768, center: true});
//   backgroundProcessHandler.addWindow(mainWindow);
//   mainWindow.loadURL(winURL);
//   server.listen()
//   bridge.init()

//   mainWindow.on('closed', () => {
//     mainWindow = null
//     app.quit()
//   })
// }

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


// app.on('ready', function() {
//   const backgroundURL = 'file://' + __dirname + '/background.html';
//   const backgroundProcessHandler = main.createBackgroundProcess(backgroundURL, true);
//   mainWindow = new BrowserWindow({width: 1280, height: 600});
//   backgroundProcessHandler.addWindow(mainWindow);
//   mainWindow.loadURL('file://' + __dirname + '/foreground.html');
//   createWindow()
// });

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
