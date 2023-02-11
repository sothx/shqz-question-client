import { BrowserWindow, MenuItemConstructorOptions, MenuItem } from 'electron'
export const ApplicationMenu: (win: BrowserWindow | null) => (MenuItemConstructorOptions | MenuItem)[] = (win) => {
  const Menu: (MenuItemConstructorOptions | MenuItem)[] = [
    {
      label: '操作',
      submenu: [
        {
          label: '刷新',
          role: 'reload',
          accelerator: 'Ctrl+R',
        },
        {
          label: '调试控制台',
          role: 'toggleDevTools',
          accelerator: 'Ctrl+Shift+I',
        }
      ]
    },
    {
      label: '检测更新',
      click: () => {
        win?.webContents.send('client-menu-check-update')
        // win.send('client-menu-check-update');
      }
    }
  ]
  return Menu;
}