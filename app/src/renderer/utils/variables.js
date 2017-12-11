export const Colors = ['#c23531','#2f4554', '#61a0a8', '#d48265', '#91c7ae','#749f83',  '#ca8622', '#bda29a','#6e7074', '#546570']

export const ERROR_CODE = {
  '1': '未知命令',
  '2': '有非法参数',
  '3': '状态非法，即当前状态不允许发送此命令',
  '4': '接收缓冲区已满，请稍后再发送命令',
  '5': '文件夹已存在',
  '6': 'SD卡出错',
  '7': 'SD卡剩余空间不足，请清除SD卡数据后再操作',
  '8': '低电量，请保证充电10%以上，或者插着充电器',
  '-999' : '未知错误，启动失败'
};

//刷新图表的时间
export const UPDATEDTIME = 1000

//每个页面存的点数
export const DIOTNUM = 150

//处理数据模块一次性接收数据条数
export const DEAlDATARATE = 4992

//保存的历史数据数量
export const HISTORYLENGTH = 5000
