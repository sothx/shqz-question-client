import isElectron from 'is-electron';
/**
 * 对比版本号
 * @param version1 版本1 
 * @param version2 版本2
 * @returns 
 */
export const compareVersion = function (version1: string, version2: string) {
  const v1 = version1.split('.');
  const v2 = version2.split('.');
  for (let i = 0; i < v1.length || i < v2.length; ++i) {
      let x = 0, y = 0;
      if (i < v1.length) {
          x = parseInt(v1[i]);
      }
      if (i < v2.length) {
          y = parseInt(v2[i]);
      }
      if (x > y) {
          return 1;
      }
      if (x < y) {
          return -1;
      }
  }
  return 0;
};

export const isClient  = isElectron()