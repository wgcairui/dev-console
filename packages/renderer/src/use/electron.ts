
import { PortInfo, OpenOptions } from "serialport"
import { isReactive, isRef, toRaw, unref } from "vue";
import { ElMessageBox } from "element-plus"
import * as Electron from "electron"


const post = (url: string, data: { [x in string]: any } = {}) => {
  return fetch('https://uart.ladishb.com' + url, {
    method: "POST",
    body: JSON.stringify(data),

    headers: {
      "Content-Type": "application/json",


    },
    mode: "cors"

  })
}

/**
* 获取crc编码
* @param body 
* @returns 
*/
/* async crc(body: crcbody) {
  const rs = await this.post('https://uart.ladishb.com/api/open/CRC', body);
  return rs.status === 200 ? await rs.text() : Promise.resolve('crc请求出错')
}
*/
/**
* 获取协议数据
* @returns 
*/
export const protocols = async () => {
  const rs = await post('/api/open/protocol');
  return await rs.json() as Uart.protocol[]
}

export const protocolSetup = async (protocol: string) => {
  const rs = await post('/api/open/protocolSetup', { protocol });
  return await rs.json() as Uart.ProtocolConstantThreshold
}

export const electron = window.electron;

/**
 * 打开文件对话框
 * @param options 
 * @returns 
 */
export const dialogOpen = (options: Electron.OpenDialogOptions): Promise<string> => {
  return electron.invoke("openDialog", options)
}

/**
* 保存数据
* @param data 
* @param options 
*/
export const dialogSave = (data: string | Buffer | Uint8Array, options: Electron.SaveDialogOptions) => {
  electron.send('saveDialog', data, options)
}

/**
* 弹窗提醒
* @param msg 消息体
* @param title 标题
* @returns 
*/
export const Noti = (msg: string, title: string = 'Notifi') => {
  electron.send('noti', msg, title)
}

export const NotiErr = (err: Error | any) => {
  if (err) Noti(err.message || err)
}

/**
* 返回serialport列表
* @returns 
*/
export const serialPortList = (): Promise<PortInfo[]> => {
  return electron.invoke('seriallist')
}

/**
* buffer转字符串
* @param hex buffer
* @returns 
*/
export const bufferToString = (hex: Buffer | ArrayBuffer | SharedArrayBuffer | any, encoding?: BufferEncoding): string => {
  return electron.sendSync('bufferToString', hex, encoding)
}

/**
* hex字符串转字符串
* @param hex 
* @returns 
*/
export const hexToString = (hex: string) => {
  return electron.bufferFrom(hex, 'hex').toString('utf8')
}

/**
* hex转数字
* @param hex hex字符串
* @returns 
*/
export const hexToNumber = (hex: string) => {
  return electron.sendSync('hexToNumber', hex)
}

/**
* 格式化的时间
* @returns 
*/
export const formatTime = () => {
  const time = new Date()
  return `${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}:${time.getMilliseconds()}`
}

// 重写serial实例
export class Serial {
  isOpen: boolean;
  path: string;
  options: OpenOptions;
  constructor(path: string, options: OpenOptions) {
    this.path = path
    this.options = options
    this.isOpen = electron.sendSync('newSerial', path, options) as boolean
  }

  write(data: string | number[], encoding?: "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "binary" | "hex") {
    electron.send("serialWrite", this.path, data, encoding)
  }

  data(callback: (data: Buffer) => void) {
    electron.on(this.path + 'data', (event, data: number[]) => {
      callback(electron.bufferFrom(data))
    })
  }

  close() {
    electron.send('serialClose', this.path)
  }
}

/**
* 根据协议解析buffer数据
* @param data 
* @param instructs 
* @param Type 
* @returns 
*/
export const protocolParse = (data: Buffer, instructs: Uart.protocolInstruct, Type: 232 | 485): Promise<Uart.queryResultArgument[]> => {
  return electron.invoke("protocolParse", data, instructs, Type)
}

/**
* ArrayBuffer转string,Buffer
* @param data 
* @param encodeing 
* @returns 
*/
export const numberArrayToString = (data: number, encodeing: "ascii" | "utf8" | "utf16le" | "ucs2" | "base64" | "binary" | "hex" = 'hex') => {
  return electron.sendSync('numberArrayToString', data, encodeing)
}

/**
* crc转换
* @param address 地址
* @param instruct 指令
* @returns 
*/
export const crc = (address: number, instruct: string): string => {
  return electron.sendSync("crc", address, instruct)
}

/**
* 深克隆对象
* @param val 
* @param circular 
* @returns 
*/
export const clone = <T>(val: T, circular?: boolean | undefined): T => {
  const data = isRef<T>(val) ? unref(val) : (isReactive(val) ? toRaw(val) : val)
  return data
}

/**
* 弹窗输入新的值
* @param value 初始值
*/
export const inputValue = async <T extends number | string>(value: T): Promise<T | false> => {
  const isNumber = typeof value === "number"
  const result: any = await ElMessageBox.prompt('修改值', 'modify', { inputValue: String(value), inputPattern: isNumber ? /^\d+$/ : /.*/, inputErrorMessage: '只能输入数字' }).catch(e => false)
  return result ? isNumber ? Number(result.value) : result.value : result
}
