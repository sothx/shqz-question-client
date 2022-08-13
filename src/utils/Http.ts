import axios from 'axios'
import { type AxiosRequestConfig, type AxiosResponse, type AxiosInstance, type AxiosRequestHeaders  } from 'axios'
import qs from 'qs'
import { assign } from 'lodash-es';

/**
 * 取消请求辅助函数
 */
 const pendingHelper = {
  data: new Map(),
  /**
   * 取消请求——生成每个请求唯一的键
   * @param {*} inputConfig 
   * @returns string
   */
  get(inputConfig:AxiosRequestConfig) {
    let {url, method, params, data} = inputConfig;
    if(typeof data === 'string') data = JSON.parse(data); // response里面返回的config.data是个字符串对象
    return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&');
  },
/**
 * 储存每个请求唯一值, 也就是cancel()方法, 用于取消请求
 * @param {*} inputConfig 
 */
  add(inputConfig:AxiosRequestConfig) {
    const pendingKey = pendingHelper.get(inputConfig);
    inputConfig.cancelToken = inputConfig.cancelToken || new axios.CancelToken((cancel) => {
      if (!pendingHelper.data.has(pendingKey)) {
        pendingHelper.data.set(pendingKey, cancel);
      }
    });
  },
  /**
   * 删除重复的请求
   * @param {*} inputConfig 
   */
  remove(inputConfig:AxiosRequestConfig) {
    const pendingKey = pendingHelper.get(inputConfig);
    if (pendingHelper.data.has(pendingKey)) {
       const cancelToken = pendingHelper.data.get(pendingKey);
       cancelToken(pendingKey);
       pendingHelper.data.delete(pendingKey);
    }
  }
}

interface ExtendConfig {
  repeatRequestCancel?: boolean; // 是否开启取消重复请求, 默认为 true
  reductDataFormat?: boolean; // 是否开启简洁的数据结构响应, 默认为true
}

function Http(axiosConfig?: AxiosRequestConfig, extendConfig?: ExtendConfig) {

  const assignExtendConfig = assign({
    repeatRequestCancel: true,
    reductDataFormat: true
  }, extendConfig)

  const instance = axios.create({
    baseURL: 'http://127.0.0.1:7001',
    timeout: 30 * 1000, // 最大网络超时30s
    withCredentials: true, // 跨域携带cookie凭证
  })
  
  // request 拦截器
  instance.interceptors.request.use(
    (config) => {
      pendingHelper.remove(config);
      assignExtendConfig.repeatRequestCancel && pendingHelper.add(config);
      // 如果是x-www-form-urlencoded格式，则使用qs库序列化内容
      config.transformRequest = [
        (data, headers ) => {
          if ((headers as AxiosRequestHeaders)['Content-Type'] === 'application/x-www-form-urlencoded') {
            data = qs.stringify(data)
          }
          return data;
        }
      ]
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  )
  
  // response 拦截器
  instance.interceptors.response.use(
    (response) => {
      pendingHelper.remove(response.config);
      return assignExtendConfig.reductDataFormat ? response.data : response;
    },
    (error) => {
      error.config && pendingHelper.remove(error.config);
      return Promise.reject(error);
    }
  )

  return instance(axiosConfig as AxiosRequestConfig);
}

export default Http;