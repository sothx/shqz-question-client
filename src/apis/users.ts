import http from '@/utils/Http';

export const getQuestionClientBersion = () => {
  return http({
    url: `/users/getQuestionClientVersion`,
    method: 'get'
  })
}