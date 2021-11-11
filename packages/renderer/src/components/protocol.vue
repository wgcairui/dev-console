<template>
  <el-row style="flex: 1;overflow: auto;">
    <el-col :span="8" :lg="6">
      <el-form label-width="100px" label-suffix=":" size="small">
        <el-form-item label="协议">
          <el-cascader
            :options="formatProtocol"
            :show-all-levels="false"
            v-model="protocolOpt.protocol"
          ></el-cascader>
        </el-form-item>
        <el-form-item label="调试指令">
          <el-select v-model="InstructItem" value-key="name" @focus="focusInstructs">
            <el-option
              v-for="instruct in Instructs"
              :key="instruct"
              :value="instruct.value"
              :label="instruct.label"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="设备地址">
          <el-select v-model="protocolOpt.pid" placeholder="选择设备的地址">
            <el-option v-for="n in 255" :key="n" :label="n" :value="n"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="loadConsole">载入调试</el-button>
        </el-form-item>
      </el-form>
    </el-col>
    <el-col :span="16" :lg="18" style="padding-left:2rem">
      <el-card style="height:100%;overflow:auto; overflow: auto;">
        <el-tabs v-model="tabActive">
          <el-tab-pane label="操作指令" name="1">
            <el-form label-width="100px" label-suffix=":" size="small" inline>
              <el-form-item v-for="val in protocolSetup.OprateInstruct" :key="val.name">
                <el-button type="primary" @click="oprate(val)">{{ val.name }}</el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>
          <el-tab-pane label="设备参数" v-if="InstructItem && InstructItem.formResize" name="2">
            <el-table :data="InstructItem.formResize" size="small" @cell-click="tableClick" stripe>
              <el-table-column prop="name" label="name" show-overflow-tooltip></el-table-column>
              <el-table-column prop="regx" label="字段/取值" width="100">
                <template
                  #default="scope"
                >{{ scope.row.regx }}{{ getArgumentValue(scope.row.name).regx }}</template>
              </el-table-column>
              <el-table-column prop="bl" label="bl" width="50"></el-table-column>
              <el-table-column prop="enName" label="值" width="100">
                <template #default="scope">{{ getArgumentValue(scope.row.name).value }}</template>
              </el-table-column>
              <el-table-column prop="unit" label="unit" show-overflow-tooltip width="50"></el-table-column>
            </el-table>
            <el-button type="text" @click="addIntructFrom">添加</el-button>
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </el-col>
  </el-row>
</template>

<script lang="ts">
import { ElMessageBox, ElMessage, CascaderOption } from "element-plus";
import { computed, defineComponent, onMounted, reactive, ref, unref, watch, PropType, Ref, isRef, watchEffect, toRaw } from "vue";
import { query } from "../../../main/src/plugins/ProtocolParse";
import { TableColumnCtx } from "element-plus/es/components/table/src/table-column/defaults";
import { crc, dialogOpen, dialogSave, inputValue, protocolSetup as setup, protocols as Protocols } from "../use/electron";

export default defineComponent({
  name: 'protocol',
  emits: ['loadConsole', "updateInstructItem"],
  props: {
    result: {
      type: Array as PropType<query[]>,
      default: []
    }
  },
  setup(props, ctx) {
    const protocols = ref<Uart.protocol[]>([])
    // 可选择的协议
    const Instructs = reactive<{ label: string, value: any }[]>([])
    // 协议指令
    const InstructItem = ref<Uart.protocolInstruct | undefined>()
    // 协议
    const protocolOpt = reactive({
      protocol: ['th', '温湿度1'] as string[],
      pid: 1
    })

    const instructFrom = {
      name: '未命名',
      regx: '1-1',
      bl: '1',
      unit: "",
      isState: false
    }

    const tabActive = ref("1")

    const protocolSetup = reactive<Pick<Uart.ProtocolConstantThreshold, 'OprateInstruct'>>({ OprateInstruct: [] })

    const devs: { [x in string]: string } = {
      "air": "空调",
      "ups": "UPS",
      "io": "io",
      "th": "温湿度",
      "em": "电量仪"
    }



    // 格式化协议选择
    const formatProtocol = computed(() => {
      const protocolArray = unref(protocols)
      if (protocolArray) {
        const types = new Set(protocolArray.map(el => el.ProtocolType))
        return [...types].map<CascaderOption>(el => ({
          label: devs[el] || el, value: el, children: protocolArray
            .filter(el1 => el1.ProtocolType === el)
            .map(el2 => ({ label: el2.Protocol, value: el2.Protocol }))
        }))

      } else return []
    })

    // 协议解析结果集Map
    const resultMap = computed(() => {
      return new Map(props.result.map(el => [el.name, el]))
    })

    // 监听指令解析实例,有修改就推送到
    watch(InstructItem, val => {
      if (val) {
        loadConsole()
        tabActive.value = '2'
        ctx.emit('updateInstructItem', val)
        focusInstructs()
      }
    }, {
      deep: true
    })

    watchEffect(() => {
      setup(protocolOpt.protocol[1]).then(el => {
        protocolSetup.OprateInstruct = el.OprateInstruct
      })
    }, {

    })

    watch(protocolOpt, newVal => {
      const opt = toRaw(newVal)
      localStorage.setItem('protocolOpt', JSON.stringify(opt))
    })


    /**
     * 刷新指令列表
     */
    const focusInstructs = () => {
      const protocol = protocolOpt.protocol
      const items = protocol ? protocols.value?.find(el => el.ProtocolType === protocol[0] && el.Protocol === protocol[1])?.instruct.map(el => ({ label: el.name, value: el })) || [] : []
      Instructs.splice(0, Instructs.length, ...items)
    }

    /**
     * 载入调试
     */
    const loadConsole = async () => {
      const protocol = protocols.value.find(el => el.Protocol === protocolOpt.protocol[1] && el.ProtocolType === protocolOpt.protocol[0])!
      if (protocol.Type === 485) {
        ctx.emit("loadConsole", crc(protocolOpt.pid, unref(InstructItem)!.name), 'hex')
      } else {
        ctx.emit("loadConsole", unref(InstructItem)!.name + '\r', 'utf8')
      }
    }

    /**
  * 转换参数值系数
  * @param fun 转换函数
  * @param val 待转换的值
  */
    const ParseCoefficient = (fun: string, val: number) => {
      if (Number(fun)) return Number(fun) * val as number
      else {
        const args = fun.replace(/(^\(|\)$)/g, '').split(',')
        const Fun = new Function(args[0], `return ${args[1]}`)
        return Fun(val) as number
      }
    }

    /**
     * 
     */
    const oprate = async (oprate: Uart.OprateInstruct) => {
      const protocol = protocols.value.find(el => el.Protocol === protocolOpt.protocol[1] && el.ProtocolType === protocolOpt.protocol[0])!
      if (oprate.value.includes("%i")) {
        const val = await ElMessageBox.prompt("输入想要修改的值:").then((el: any) => el.value).catch(e => false)
        if (Number(val)) {
          console.log(val);
          oprate.val = val
        } else {
          ElMessage.warning("取消输入")
          return
        }
      }
      //
      //ctx.emit("oprate",)
      if (protocol.Type === 485) {
        // 检查操作指令是否含有自定义参数
        if (/(%i)/.test(oprate.value)) {
          // 如果识别字为%i%i,则把值转换为四个字节的hex字符串,否则转换为两个字节
          if (/%i%i/.test(oprate.value)) {
            const b = Buffer.allocUnsafe(2)
            b.writeIntBE(ParseCoefficient(oprate.bl, Number(oprate.val)), 0, 2)
            oprate.value = oprate.value.replace(/(%i%i)/, b.slice(0, 2).toString("hex"))
          } else {
            const val = ParseCoefficient(oprate.bl, Number(oprate.val)).toString(16)
            oprate.value = oprate.value.replace(/(%i)/, val.length < 2 ? val.padStart(2, '0') : val)
          }
        }
        ctx.emit("loadConsole", crc(protocolOpt.pid, oprate.value), 'hex')
      } else {
        ctx.emit("loadConsole", oprate.value + '\r', 'utf8')
      }
    }



    /**
     * 保存所有协议
     */
    const saveProtocol = async () => {
      const ps = unref(protocols)
      const el = await ElMessageBox.confirm(`是否保存全部协议,取消则仅保存 (${protocolOpt.protocol[1]}) 协议!!`,
        {
          cancelButtonText: protocolOpt.protocol[1],
          confirmButtonText: '全部',
          type: "info",
          lockScroll: false,
          roundButton: true
        })
        .catch(() => false)
      dialogSave(JSON.stringify(el ? ps : ps.find(el => el.Protocol === protocolOpt.protocol[1] && el.ProtocolType === protocolOpt.protocol[0])), {
        title: '保存透传协议',
        filters: [
          { name: 'json', extensions: ['json'] }
        ]
      })
    }

    /**
     * 载入协议
     */
    const loadProtocol = () => {
      dialogOpen({
        title: '载入透传设备协议',
        filters: [
          { name: 'json', extensions: ['json'] }
        ]
      }).then(data => {
        try {
          const loadProtocols = JSON.parse(data) as Uart.protocol[]
          if (loadProtocols[0]?.Protocol) {
            loadProtocols.forEach(el => {
              const index = protocols.value?.findIndex(el2 => el2.Protocol === el.Protocol && el.ProtocolType === el2.ProtocolType)
              if (index !== -1) {
                protocols.value?.splice(index, 1, el)
              } else {
                protocols.value?.push(el)
              }
            })
          } else {
            alert('文件格式错误')
          }
        } catch (error) {
          alert(error)
        }
      })
    }

    // 返回对应的参数解析值
    const getArgumentValue = (name: string) => {
      const arg = resultMap.value.get(name)
      return {
        value: arg?.parseValue || 'null',
        regx: `[${arg?.value || 'null'}]`
      }
    }

    // 修改头尾的值
    const setShiftPopNum = async (obj: Ref<any> | any, name: string) => {
      const value = unref(obj)[name]
      inputValue(value).then(val => {
        if (val) {
          if (isRef(obj)) {
            (obj.value as any)[name] = val
          } else obj[name] = val
        }
      })
    }

    /**
     * 修改表格中的参数
     */
    const tableClick = (row: Uart.protocolInstructFormrize, column: TableColumnCtx<any>) => {
      // console.log({ row, column });
      const property = column.property
      const value = (<any>row)[property] as string
      if (property !== 'enName') {
        inputValue(value).then(el => {
          if (el) {
            if (property === 'unit') {
              row.isState = /^{.*}$/.test(el)
              // 替换可能出现的全角字符
              el = el.replaceAll("：", ":")
              el = el.replaceAll("，", ",")
            }
            (<any>row)[property] = el
            const item = unref(InstructItem)!
            item.resize = item.formResize.map(el => Object.values(el).join("+")).join("&\n")
          }
        })
      }
    }

    /**
     * 添加新的指令
     */
    const addInstruct = async () => {
      const result = await ElMessageBox.prompt('写入指令字符:', '添加新的指令').catch(() => false)
      if (result) {
        const value = (result as any).value as string
        const protocol = protocols.value.find(el => el.Protocol === protocolOpt.protocol[1])!
        // 如果指令名称不重复
        if (protocol.instruct.findIndex(el => el.name === value) === -1) {
          const isModbus = protocol.Type === 485
          const newInstruct: Uart.protocolInstruct = {
            name: value,
            resultType: isModbus ? 'hex' : 'utf8',
            shift: true,
            shiftNum: isModbus ? 3 : 1,
            pop: true,
            popNum: isModbus ? 2 : 0,
            isUse: true,
            isSplit: true,
            resize: '未命名+1-1+1&\n',
            formResize: [instructFrom],
            noStandard: false,
            scriptStart: '',
            scriptEnd: ''
          }
          // 加入到指令列表
          protocol.instruct.push(newInstruct)
          // 手动更新指令列表
          focusInstructs()
          // 替换现有实例
          InstructItem.value = newInstruct
        } else {
          await ElMessageBox.alert("指令名称重复!!!", { type: "warning" })
          addInstruct()
        }

      }
    }

    /**
     * 添加指令新的参数
     */
    const addIntructFrom = () => {
      InstructItem.value?.formResize.push(instructFrom)
    }

    onMounted(async () => {
      await Protocols()
        .then(el => {
          protocols.value = el
          localStorage.setItem('protocols', JSON.stringify(el))

          /* el.map(p=>{
            
          }) */
        })
        .catch(() => {
          const ps = localStorage.getItem('protocols')
          if (ps) {
            protocols.value = JSON.parse(ps)
          } else {
            ElMessageBox.alert('连接网络失败,请第一次连接网络缓存数据后使用')
          }
        })

      const opt = localStorage.getItem('protocolOpt')
      if (opt) {
        const { protocol, pid } = JSON.parse(opt) as { protocol: string[], pid: number }
        protocolOpt.protocol = protocol
        protocolOpt.pid = pid

        setup(protocol[1])
          .then(el => {
            protocolSetup.OprateInstruct = el.OprateInstruct
            localStorage.setItem(protocol[1], JSON.stringify(el.OprateInstruct))
          })
          .catch(() => {
            const pst = localStorage.getItem(protocol[1])
            if (pst) {
              protocolSetup.OprateInstruct = JSON.parse(pst)
            }
          })


      }
    })

    return { protocols, tabActive, loadConsole, Instructs, InstructItem, protocolSetup, focusInstructs, setShiftPopNum, formatProtocol, protocolOpt, addInstruct, addIntructFrom, saveProtocol, loadProtocol, getArgumentValue, tableClick, oprate }
  }
})


</script>

<style>
</style>