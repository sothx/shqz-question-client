import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron'
import { release } from 'os'
import { join } from 'path'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'


// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export const ROOT_PATH = {
  // /dist
  dist: join(__dirname, '../..'),
  // /dist or /public
  public: join(__dirname, app.isPackaged ? '../..' : '../../../public'),
}

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin
const url = `http://${process.env['VITE_DEV_SERVER_HOST']}:${process.env['VITE_DEV_SERVER_PORT']}`
const indexHtml = join(ROOT_PATH.dist, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: join(ROOT_PATH.public, 'favicon.ico'),
    minWidth: 1200,
    minHeight: 900,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  })

  if (app.isPackaged) {
    win.loadFile(indexHtml)
  } else {
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

// 监听打开url的事件，打开默认浏览器
ipcMain.on('open-url', (event, url) => {
  shell.openExternal(url) // 打开系统默认浏览器到指定url
})

// 监听客户端升级事件，开始升级流程
ipcMain.on('update-clitent', (event, payload) => {
  // if (app.isPackaged) {
  //   checkForUpdates()
  // }
  // 初始化客户端升级
  if (payload === 'init') {
    checkForUpdates()
  }
  // 升级完成并重启客户端
  if (payload === 'confirm') {
    autoUpdater.quitAndInstall()
  }
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// new window example arg: new windows url
ipcMain.handle('open-win', (event, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
    },
  })

  if (app.isPackaged) {
    childWindow.loadFile(indexHtml, { hash: arg })
  } else {
    childWindow.loadURL(`${url}/#${arg}`)
    // childWindow.webContents.openDevTools({ mode: "undocked", activate: true })
  }
})




function checkForUpdates() {
  log.info('Set up event listeners...')
  // package.json这里已经配置了，不需要额外配置
  //autoUpdater.setFeedURL('http://client-updater.sothx.com/shqz-question-client/');
  // 正在检查更新……
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...')
  })
  // 检测到新版本，正在下载……
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.')
  })
  // 现在使用的就是最新版本，不用更新
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.')
  })
  // 检查更新出错
  autoUpdater.on('error', (err:any) => {
    log.error('Error in auto-updater.' + err)
  })

  // 更新下载进度事件
  autoUpdater.on('download-progress', function (progressObj) {
    let msg = "Download speed: " + progressObj.bytesPerSecond
    msg = msg + ' - Downloaded ' + progressObj.percent + '%'
    msg = msg + ' (' + progressObj.transferred + "/" + progressObj.total + ')'
    log.info(msg)
  })
  autoUpdater.on('update-downloaded', function (info) {

    win?.webContents.send('client-update-downloaded',info)
    // log.info('Update downloaded.')
    
    // // The update will automatically be installed the next time the
    // // app launches. If you want to, you can force the installation
    // // now:
    // const dialogOpts: any = {
    //   type: 'info',
    //   buttons: ['Restart', 'Later'],
    //   title: 'App Update',
    //   message: process.platform === 'win32' ? info.releaseNotes : info.releaseName,
    //   detail: `A new version (${info.version}) has been downloaded. Restart the application to apply the updates.`
    // }

    // dialog.showMessageBox(dialogOpts).then((returnValue) => {
    //   if (returnValue.response === 0) autoUpdater.quitAndInstall()
    // })

  });

  // More properties on autoUpdater, see https://www.electron.build/auto-update#AppUpdater
  //autoUpdater.autoDownload = true
  //autoUpdater.autoInstallOnAppQuit = true

  // No debugging! Check main.log for details.
  // Ready? Go!
  log.info('checkForUpdates() -- begin')
  try {
    //autoUpdater.setFeedURL('')
    autoUpdater.checkForUpdates()
    //autoUpdater.checkForUpdatesAndNotify()
  } catch (error) {
    log.error(error)
  }
  log.info('checkForUpdates() -- end')
}
