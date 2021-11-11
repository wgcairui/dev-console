if (process.env.VITE_APP_VERSION === undefined) {
  const now = new Date;
  process.env.VITE_APP_VERSION = `${now.getUTCFullYear() - 2000}.${now.getUTCMonth() + 1}.${now.getUTCDate()}-${now.getUTCHours() * 60 + now.getUTCMinutes()}`;
}

/**
 * @type {import('electron-builder').Configuration}
 * @see https://www.electron.build/configuration/configuration
 */
const config = {

  appId: "com.electron.devConsole",
  productName: "设备控制",
  electronVersion: "15.3.0",
  nodeVersion: "16",
  compression: "store",
  asar: true,
  icon: "buildResources/icon.png",
  directories: {
    output: 'dist',
    buildResources: 'buildResources',
  },
  files: [
    'packages/**/dist/**',
  ],
  extraMetadata: {
    version: process.env.VITE_APP_VERSION,
  },
  mac: {
    target: "dmg",
    minimumSystemVersion: "11"

  },
  dmg: {
    title: "设备控制",
    backgroundColor:"#000000"
  },
  win: {
    target: "msi"
  },
  nsis:{
    oneClick:true,
    perMachine:true,
    allowToChangeInstallationDirectory:true,
    deleteAppDataOnUninstall:true,
    packElevateHelper:true,
    menuCategory:true,
    shortcutName:"设备控制"
  },
  extraResources: [""],
  /**
   * 使用已经编译好的本地依赖,github上没有预编译好的二进制文件
   * @see https://www.electron.build/configuration/configuration.html#configuration
   * @see https://serialport.io/docs/guide-installation#electron
   */
  "buildDependenciesFromSource": true,
  "npmRebuild": false
};

module.exports = config;
