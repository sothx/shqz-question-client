import http from '@/utils/Http';
export interface IQuestionListQuery {
  type: number //	题库类型，默认为1
  heroType?: number // 侠义情缘题库类型，默认为1
  queryString?: string // 搜索关键词
  offset?: number // 偏移量，默认为0
  limit: number // 每页多少条，默认为10
}

export const getQuestionList = (inputQuery: IQuestionListQuery) => {
  return http({
    url: `/questions`,
    method: 'get',
    params: inputQuery
  })
}