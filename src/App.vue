<script setup lang="ts">
import { ref, getCurrentInstance, onMounted, reactive, watch, onUnmounted } from 'vue'
import * as QuetionsApi from '@/apis/quetions'
import * as UsersApi from '@/apis/users'
import * as Helper from '@/utils/Helper'
import _ from 'lodash-es'
import type { Action } from 'element-plus'
import QQStarPetsMiniProgramCode from './assets/images/QQStarPetsMiniProgramCode.png'
import WechatStarPetsMiniProgramCode from './assets/images/WechatStarPetsMiniProgramCode.jpg'
let ipcRenderer: Electron.IpcRenderer

const fullscreenLoading = ref(false);

const currentData = reactive({
  page: {
    limit: 20,
    current: 1,
    total: 0
  },
  tableLoading: true,
  searchString: '',
  firstRadio: 1,
  secondRadio: 1,
  questionList: [],
  starPetsDialogVisible: false,
  currentStarPetsCodeType: 'Wechat',
})

const { proxy } = getCurrentInstance()!

const { $to, $message, $alert, $packageJSON, $confirm } = proxy!;

const versionData = reactive({
  currentVersion: $packageJSON.version,
  canCancel: true,
  updateVersionMessage: {}
});

const handleChangeStarPetsCodeType = (inputType: string) => {
  currentData.currentStarPetsCodeType = inputType;
  if (inputType === 'QQ') {

  }
}

const handleSendNewQuestion = () => {
  if (Helper.isClient) {
    ipcRenderer.send('open-url', 'https://docs.qq.com/form/fill/DQ2h6TGVxcXlCc3BN?_w_tencentdocx_form=1#/fill')
  } else {
    window.open('https://docs.qq.com/form/fill/DQ2h6TGVxcXlCc3BN?_w_tencentdocx_form=1#/fill')
  }
}

const handleJoinQQGroup = () => {
  if (Helper.isClient) {
    ipcRenderer.send('open-url', 'https://qm.qq.com/cgi-bin/qm/qr?k=80jOzciI86vgclIGWpDbD92CFG2MiZxb&jump_from=webapi')
  } else {
    window.open('https://qm.qq.com/cgi-bin/qm/qr?k=80jOzciI86vgclIGWpDbD92CFG2MiZxb&jump_from=webapi')
  }
}

const initClientUpdate = (inputType?: string) => {
  const updateVersionMessage: any = versionData.updateVersionMessage;
  const compareVersionRes = Helper.compareVersion(
    versionData.currentVersion,
    updateVersionMessage.versionNum
  )
  switch (compareVersionRes) {
    // 版本号相同，已经是最新版本，不需要升级
    case 0: {
      if (inputType === 'menu-btn') {
        $message.success('当前客户端已经是最新版本，不需要升级~')
      }
      break;
    }
    // 接口版本号比较旧，不需要升级版本
    case 1: {
      if (inputType === 'menu-btn') {
        $message.success('当前客户端已经是最新版本，不需要升级~')
      }
      break;
    }
    // 接口版本号更新，需要升级版本
    case -1: {
      const getLocalUpdateMsg = localStorage.getItem(`skipUpdateVersion`)
      if (getLocalUpdateMsg === `${updateVersionMessage.versionNum}` && !inputType) {
        return;
      }
      // 对比强制更新版本
      const compareForceVersionRes = Helper.compareVersion(
        versionData.currentVersion,
        updateVersionMessage.forceVersionNum
      )
      if (compareForceVersionRes === -1) {
        versionData.canCancel = false;
      }
      $confirm(
        updateVersionMessage.desc,
        `客户端版本升级提醒`,
        {
          dangerouslyUseHTMLString: true,
          showCancelButton: versionData.canCancel,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          showClose: false,
          cancelButtonText: '跳过当前版本',
          confirmButtonText: '立即升级',
          beforeClose: (action, instance, done) => {
            console.log(instance, 'instance')
            if (action === 'confirm') {
              ipcRenderer.send('update-clitent', 'init')
              fullscreenLoading.value = true;
              done()
              // ipcRenderer.send('open-url', updateVersionMessage.downloadUrl)
              return;
            }
            if (action === 'cancel') {
              localStorage.setItem(`skipUpdateVersion`, updateVersionMessage.versionNum)
              done()
              return;
            }
            done()
          }
        }
      )
      break;
    }
  }
}

const handleClientUpdateMessage = () => {
  ipcRenderer.once('client-update-message', (event, inputPayload) => {
    const { type, data } = inputPayload;
    fullscreenLoading.value = false;
    // 如果下载完成
    if (type === 'update-downloaded') {
      $confirm(
        `新水浒Q传题库大全 ver.${data.version} 已经准备好更新包了，点击"立即安装"完成最后一步吧~`,
        `新版本已经准备好更新了`,
        {
          showCancelButton: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          showClose: false,
          confirmButtonText: '立即安装',
          beforeClose: (action, instance, done) => {
            ipcRenderer.send('update-clitent', 'confirm')
            if (action === 'confirm') {
              done()
              return;
            }
            done()
          }
        }
      )
    }
    // 如果出现异常
    if (type === 'update-error') {
      const updateVersionMessage: any = versionData.updateVersionMessage;
      $confirm(
        `由于系统权限或者其他未知原因，更新失败了，点击"手动更新"下载最新安装包进行升级吧~`,
        `系统更新错误`,
        {
          showCancelButton: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          showClose: false,
          confirmButtonText: '手动更新',
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              ipcRenderer.send('open-url', updateVersionMessage.downloadUrl)
              return;
            }
            done()
          }
        }
      )
    }
  })
}

const initSetupClientModal = () => {
  const updateVersionMessage: any = versionData.updateVersionMessage;
  $confirm(
    `水Q题库大全客户端已上线，点击"立即下载"按钮即可体验~`,
    `客户端版本上线提醒`,
    {
      showCancelButton: true,
      closeOnClickModal: true,
      closeOnPressEscape: true,
      showClose: true,
      cancelButtonText: '下次再说',
      confirmButtonText: '立即下载',
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          window.open(updateVersionMessage.downloadUrl)
        }
        done()
      }
    }
  )
}




onMounted(async () => {
  try {
    if (Helper.isClient) {
      ipcRenderer = (await import('electron')).ipcRenderer
    }
    const promiseArr = [getQuestionList({
      type: currentData.firstRadio,
      limit: currentData.page.limit,
      offset: currentData.page.limit * (currentData.page.current - 1),
    }), getVersionMessage()]

    await Promise.all(promiseArr)
  } catch (err: any) {
    $alert('网络连接异常，请检查网络连接是否正常！', '网络异常', {
      confirmButtonText: '刷新重试',
      showClose: false,
      callback: (action: Action) => {
        window.location.reload()
      }
    })
    throw new Error(err?.message);
  }
  if (Helper.isClient) {
    handleClientUpdateMessage()
  } else {
    initSetupClientModal()
  }

})

onUnmounted(async () => {
  ipcRenderer.removeListener('client-menu-check-update', () => {
    
  })
})



const getVersionMessage = async () => {
  const [resErr, res] = await $to(UsersApi.getQuestionClientBersion())
  if (resErr) {
    throw new Error(resErr.message);
  }
  switch ((res as any).statusCode) {
    case '000000': {
      versionData.updateVersionMessage = res.data;
      // 如果是客户端，则初始化客户端升级流程
      if (Helper.isClient) {
        initClientUpdate()
        ipcRenderer.on('client-menu-check-update', (event, inputPayload) => {
          initClientUpdate('menu-btn')
        })
      }
      break;
    }
    default: {
      $message.error('获取客户端升级信息失败！')
      break;
    }
  }
}

const getQuestionList = async (inputQuery: QuetionsApi.IQuestionListQuery) => {
  currentData.tableLoading = true
  const [resErr, res] = await $to(QuetionsApi.getQuestionList(inputQuery))
  if (resErr) {
    // $message.error('获取题库列表失败！')
    throw new Error(resErr.message);
  }

  switch ((res as any).statusCode) {
    case '000000': {
      currentData.tableLoading = false
      currentData.questionList = res.data.rows;
      currentData.page.total = res.data.count;
      break;
    }
    default: {
      $message.error('获取题库列表失败！')
      break;
    }
  }
}

const reflushQuetionList = () => {
  getQuestionList({
    type: currentData.firstRadio,
    limit: currentData.page.limit,
    offset: currentData.page.limit * (currentData.page.current - 1),
    queryString: currentData.searchString,
    ...currentData.firstRadio === 5 ? {
      heroType: currentData.secondRadio
    } : null,
  })
}

const handleStarPetsDialog = () => {
  currentData.starPetsDialogVisible = true
}

const updateCurrentPage = (currentPage: number) => {
  currentData.page.current = currentPage;
  reflushQuetionList()
}

watch([() => currentData.firstRadio, () => currentData.secondRadio], ([firstRadio, secondRadio]) => {
  currentData.page.current = 1;
  currentData.searchString = '';
  reflushQuetionList()
})

const handleSearch = _.debounce(() => {
  currentData.page.current = 1;
  reflushQuetionList()
}, 200)
</script>

<template>
  <div class="common-layout">
    <el-container v-loading.fullscreen.lock="fullscreenLoading">
      <el-header class="common-header">
        <div>
          <img src="./assets/images/logo.png" />
        </div>
      </el-header>
      <el-main>
        <div class="common-main">
          <div>
            <el-radio-group v-model="currentData.firstRadio">
              <el-radio-button :label="1">乡试/猜灯谜</el-radio-button>
              <el-radio-button :label="2">会试/殿试</el-radio-button>
              <el-radio-button :label="3">屈原寻梦</el-radio-button>
              <el-radio-button :label="4">赛龙舟</el-radio-button>
              <el-radio-button :label="5">侠义情缘</el-radio-button>
              <el-radio-button :label="6">召唤兽转生</el-radio-button>
              <el-radio-button :label="7">七夕活动</el-radio-button>
              <el-radio-button :label="8">如何成为学霸</el-radio-button>
            </el-radio-group>
          </div>
          <div>
            <el-radio-group v-show="currentData.firstRadio === 5" class="mt20" size="small"
              v-model="currentData.secondRadio">
              <el-radio-button :label="1">宋江</el-radio-button>
              <el-radio-button :label="2">关胜</el-radio-button>
              <el-radio-button :label="3">杨志</el-radio-button>
              <el-radio-button :label="4">徐宁</el-radio-button>
              <el-radio-button :label="5">柴进</el-radio-button>
            </el-radio-group>
          </div>
          <div class="mt20">
            <el-button type="success" @click="handleSendNewQuestion">提交题库(收集表)</el-button>
            <el-button type="danger" @click="handleJoinQQGroup">加入官方Q群</el-button>
            <el-button type="primary" @click="handleStarPetsDialog">星灵计算器(小程序)</el-button>
            <el-button type="info" v-if="Helper.isClient"
              :disabled="!Boolean(Object.keys(versionData.updateVersionMessage).length)"
              @click="initClientUpdate('menu-btn')">检测更新</el-button>
            <el-button type="warning" v-if="!Helper.isClient" @click="initSetupClientModal()">下载客户端</el-button>
          </div>
          <div class="mt20">
            <el-input @input="handleSearch" v-model="currentData.searchString" placeholder="请输入题目任意关键字" clearable>
            </el-input>
          </div>
          <div class="mt20">
            <el-table v-loading="currentData.tableLoading" :data="currentData.questionList" stripe empty-text="结果为空">
              <el-table-column prop="title" label="题目">
              </el-table-column>
              <el-table-column prop="answer" label="答案">
              </el-table-column>
            </el-table>
            <div class="mt20">
              <el-pagination @update:current-page="updateCurrentPage" :default-page-size="currentData.page.limit"
                :current-page="currentData.page.current" background layout="prev, pager, next"
                :total="currentData.page.total" />
            </div>
          </div>
        </div>
      </el-main>
      <el-dialog v-model="currentData.starPetsDialogVisible" title="星灵计算器(小程序)">
        <el-container>
          <el-header>
            <el-button type="success" @click="handleChangeStarPetsCodeType('Wechat')"
              :plain="currentData.currentStarPetsCodeType === 'QQ'">微信小程序</el-button>
            <el-button type="primary" @click="handleChangeStarPetsCodeType('QQ')"
              :plain="currentData.currentStarPetsCodeType === 'Wechat'">QQ小程序</el-button>
          </el-header>
          <el-main>
            <div>
              <img width="258" height="258"
                :src="currentData.currentStarPetsCodeType === 'QQ' ? QQStarPetsMiniProgramCode : WechatStarPetsMiniProgramCode" />
            </div>
            <div class="mt20">{{ `${currentData.currentStarPetsCodeType === 'QQ' ? 'QQ' : '微信'}扫一扫，即可打开~` }}</div>
          </el-main>
        </el-container>
      </el-dialog>
    </el-container>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

html,
body {
  margin: 0;
  padding: 0;
  min-width: 1100px;
}

.common-header {
  height: 100px;
}

body {
  width: 100%;
  height: 100%;
  background: #fff url(./assets/images/background.jpg);
  background-repeat: no-repeat;
  background-size: cover;
  background-attachment: fixed;
}

.common-main {
  margin: 0 auto;
  margin-top: 30px;
  width: 980px;
  height: 100%;
  background-color: #000;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 20px;
}

.update-desc {
  &__title {
    font-weight: bold;
  }

  &__main {
    margin: 0;
    padding: 0;
    line-height: 25px;
    list-style: none;
  }
}
</style>
