import to from 'await-to-js'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import { ElMessage, ElMessageBox } from 'element-plus'
import packageJSON from '../../package.json'
import type { App } from 'vue'
export default {
    install: function (app: App<Element>, options: any): void {
        app.config.globalProperties.$to = to
        app.config.globalProperties.$message = ElMessage
        app.config.globalProperties.$messageBox = ElMessageBox
        app.config.globalProperties.$alert = ElMessageBox.alert
        app.config.globalProperties.$confirm = ElMessageBox.confirm
        app.config.globalProperties.$prompt = ElMessageBox.prompt
        app.config.globalProperties.$packageJSON = packageJSON
    }
}