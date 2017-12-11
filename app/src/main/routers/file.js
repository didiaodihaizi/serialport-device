import {
  IPCServer,
  IPCRouter
} from 'electron-mvc-ipc'
import fs from 'fs-extra'
import path from 'path'
import dateUtils from 'date-utils'
import es from 'event-stream'
const router = new IPCRouter({
  prefix: ''
})

const writeMap = new Map()
const NUMBERFLAG = 1
const TIMEFLAG = 2
const MAXLINES = 61440 // 每一页文件最多行数
const ERROEKey1 = 50001 // 路径或启动时间不能为空
const ERROEKey2 = 50002 // 路径不能为空
const ERROEKey3 = 50003 // 文件夹内容为空
const ERROEKey4 = 50004 // 内容不符合要求
const ERROEKey5 = 50005 // 数据不符合要求，不予处理
const ERROEKey6 = 50006 // 没有需要关闭的文件
const ERROEValue1 = '路径或启动时间不能为空'
const ERROEValue2 = '路径不能为空'
const ERROEValue3 = '文件夹内容为空'
const ERROEValue4 = '内容不符合要求'
const ERROEValue5 = '数据不符合要求，不予处理'
const ERROEValue6 = '没有需要关闭的文件'

const ODPATTERN = /OD\d{14}.txt$/
const CRDPATTERN = /CRD\d{14}.txt$/
const HRDPATTERN = /HRD\d{14}.txt$/

function getArrayFromLine(data) {
  if (!data) {
    return []
  }
  let array = data.split('\t')
  return !array || array.length < 3 ? [] : array
}

function getNum(text) {
  return text.replace(/[^0-9]/ig, '')
}

function write(mapValue) {
  let datas = mapValue.datas
  let fileName = mapValue.fileName
  let dir = mapValue.dir
  fs.open(path.join(dir, fileName), 'a+', (err, fd) => {
    if (err) {
      console.log(err)
    }
    fs.write(fd, `${mapValue.head}\n` + datas.join('\n'), (err) => {
      if (err) {
        console.log(err)
      }
      fs.close(fd)
      datas = null
    })
  })
}

// 参数配置接口
router.post('/parameter', async(ctx, next) => {
  if (!ctx.request.body || !ctx.request.body.path || !ctx.request.body.begin_time) {
    ctx.throw(ERROEKey1, ERROEValue1)
    next()
    return
  }
  let jsonValue = `${(ctx.request.body.init_length).join(',')}\n` +
    `${(ctx.request.body.r_ratio).join(',')}\n` +
    `${(ctx.request.body.r_ratio2).join(',')}\n` +
    `${(ctx.request.body.p_ratio).join(',')}\n` +
    `${ctx.request.body.rate}\n` +
    `${ctx.request.body.duration}\n` +
    `${ctx.request.body.t_ambient}\n`
  let CFGFilename = ''

  if (ctx.request.body.isOriginal === 0) {
    let dir = path.join(ctx.request.body.path, ctx.request.body.begin_time + '')
    let ODDir = path.join(dir, `OD${ctx.request.body.begin_time}`)
    let RDir = path.join(dir, `RD${ctx.request.body.begin_time}`)
    CFGFilename = path.join(dir, `OD${ctx.request.body.begin_time}`, `CFG${ctx.request.body.begin_time}.txt`)
    if (!await fs.exists(dir)) {
      await fs.mkdirs(ODDir)
      await fs.mkdirs(RDir)
    }
  } else {
    let RDir = path.join(path.resolve(ctx.request.body.path, '..'), `RD${ctx.request.body.begin_time}`)
    CFGFilename = path.join(ctx.request.body.path, `CFG${ctx.request.body.begin_time}.txt`)
    if (!await fs.exists(RDir)) {
      await fs.mkdirs(RDir)
    }
  }

  fs.writeFile(CFGFilename, jsonValue)

  next()
})

// 参数配置方法
async function setParameter(object) {
  if (!object || !object.path || !object.begin_time) {
    return false
  }
  let jsonValue = `${(object.init_length).join(',')}\n` +
    `${(object.r_ratio).join(',')}\n` +
    `${(object.r_ratio2).join(',')}\n` +
    `${(object.p_ratio).join(',')}\n` +
    `${object.rate}\n` +
    `${object.duration}\n` +
    `${object.t_ambient}\n`
  let CFGFilename = ''

  if (object.isOriginal === 0) {
    let dir = path.join(object.path, object.begin_time + '')
    let ODDir = path.join(dir, `OD${object.begin_time}`)
    let RDir = path.join(dir, `RD${object.begin_time}`)
    CFGFilename = path.join(dir, `OD${object.begin_time}`, `CFG${object.begin_time}.txt`)
    if (!await fs.exists(dir)) {
      await fs.mkdirs(ODDir)
      await fs.mkdirs(RDir)
    }
  } else {
    let RDir = path.join(path.resolve(object.path, '..'), `RD${object.begin_time}`)
    CFGFilename = path.join(object.path, `CFG${object.begin_time}.txt`)
    if (!await fs.exists(RDir)) {
      await fs.mkdirs(RDir)
    }
  }

  fs.writeFile(CFGFilename, jsonValue)
  return true
}

// 获取参数配置接口
router.get('/parameter', async(ctx, next) => {
  if (!ctx.query.path) {
    ctx.throw(ERROEKey2, ERROEValue2)
    next()
    return
  }
  let data = await fs.readFile(ctx.query.path, 'utf8')
  if (!data) {
    ctx.throw(ERROEKey3, ERROEValue3)
    next()
    return
  }
  let array = data.split('\n')
  if (array.length < 6) {
    ctx.throw(ERROEKey4, ERROEValue4)
    next()
    return
  }
  ctx.body = {
    init_length: array[0].split(','),
    r_ratio: array[1].split(','),
    r_ratio2: array[2].split(','),
    p_ratio: array[3].split(','),
    rate: array[4],
    duration: array[5],
    t_ambient: array[6]
  }
  next()
})

// 写文件接口
router.post('/write', async(ctx, next) => {
  let rawArrayData = getArrayFromLine(ctx.request.body.data)
  if (rawArrayData.length < 1) {
    ctx.throw(ERROEKey5, ERROEValue5)
    next()
    return
  }

  let key = ctx.request.body.path + ctx.request.body.type
  let mapValue = writeMap.get(key)
  if (!mapValue) {
    mapValue = {
      dir: ctx.request.body.path,
      type: ctx.request.body.type,
      head: ctx.request.body.head,
      datas: [],
      fileName: `${ctx.request.body.type}${getNum(rawArrayData[TIMEFLAG])}.txt`,
      maxLines: MAXLINES / doRate(ctx.request.body.rate)
    }
    writeMap.set(key, mapValue)
  }

  if (mapValue.datas.length >= mapValue.maxLines) {
    write(mapValue)
    mapValue.datas = null
    mapValue.datas = []
    mapValue.fileName = `${mapValue.type}${getNum(rawArrayData[TIMEFLAG])}.txt`
  }
  mapValue.datas.push(ctx.request.body.data)
  next()
})

// 写文件方法
function writeFile(object) {
  let rawArrayData = getArrayFromLine(object.data)
  if (rawArrayData.length < 1) {
    return
  }

  let key = object.path + object.type
  let mapValue = writeMap.get(key)
  if (!mapValue) {
    mapValue = {
      dir: object.path,
      type: object.type,
      head: object.head,
      datas: [],
      fileName: `${object.type}${getNum(rawArrayData[TIMEFLAG])}.txt`,
      maxLines: MAXLINES / doRate(object.rate)
    }
    writeMap.set(key, mapValue)
  }

  if (mapValue.datas.length >= mapValue.maxLines) {
    write(mapValue)
    mapValue.datas = null
    mapValue.datas = []
    mapValue.fileName = `${mapValue.type}${getNum(rawArrayData[TIMEFLAG])}.txt`
  }
  mapValue.datas.push(object.data)
}

// 关闭写文件方法
function closeFile() {
  if (!writeMap || writeMap.size < 1) {
    return
  }
  writeMap.forEach((value, key, map) => {
    write(value)
    value.datas = null
  })
  writeMap.clear()
}

// 关闭写文件接口
router.post('/writeClose', async(ctx, next) => {
  if (!writeMap || writeMap.size < 1) {
    ctx.throw(ERROEKey6, ERROEValue6)
    next()
    return
  }
  writeMap.forEach((value, key, map) => {
    write(value)
    value.datas = []
  })
  writeMap.clear()
  next()
})

/**
 * 是否是文件夹
 * @param {*} path
 */
async function isDir(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        reject(err)
      }
      stats.isDirectory() ? resolve(true) : resolve(false)
    })
  })
}

/**
 * 定位文件
 * @param {*} dir 文件夹路径
 * @param {*} pattern 正则表达式
 * @param {*} begin 开始时间
 * @param {*} end 结束时间
 * @param {*} start 起始行号
 * @param {*} rate 获取频率
 */
async function location(dir, pattern, params) {
  let begin = params.begin
  let end = params.end
  let start = params.start
  let rate = params.rate
  let streams = []
  let format = 'YYYYMMDDHH24MISS'
  let beginStr = begin ? new Date(begin).toFormat(format) : new Date().toFormat(format)
  let endStr = end ? new Date(end).toFormat(format) : new Date().toFormat(format)
  let timeStr = ''
  let timePattern = /\d{14}/
  let head = 0
  let tail = 0
  let found = false
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (error, files) => {
      if (error) {
        reject(error)
      }
      let regexp = pattern ? new RegExp(pattern) : undefined
      files = files.filter(file => {
        if (!regexp || regexp.test(file)) {
          timeStr = file.match(timePattern)[0]
          return beginStr >= timeStr || endStr >= timeStr
        }
      })
      files.sort()
      files.forEach((file, index) => {
        if (start) { // 指定起始行号
          head = index * MAXLINES + 1
          tail = (index + 1) * MAXLINES
          if (!found) { // 未找到指定行号所在文件
            if (start >= head && start <= tail) {
              found = true
              streams.push(path.join(dir, file))
            }
          } else { // 已找到指定行号所在文件
            if (!rate || head - start < rate) { // 获取数据条数
              streams.push(path.join(dir, file))
            }
          }
        } else {
          streams.push(path.join(dir, file))
        }
      })
      resolve(streams)
    })
  })
}

/**
 * 遍历文件夹
 * @param {*} dir 文件夹路径
 * @param {*} pattern 正则表达式匹配
 */
async function iterator(dir, pattern) {
  let streams = []
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (error, files) => {
      if (error) {
        reject(error)
      }
      let regexp = pattern ? new RegExp(pattern) : undefined
      files.forEach(file => {
        if (!regexp || regexp.test(file)) {
          streams.push(fs.createReadStream(path.join(dir, file)))
        }
      })
      resolve(streams)
    })
  })
}

/**
 * 数据过滤
 * @param {*} chunk 单行数据
 * @param {*} params 过滤属性
 */
function filter(chunk, params) {
  let accord = false
  let _data = chunk.split('\t')
  let sequence = parseInt(_data[1])
  if (!isNaN(sequence)) {
    accord = params.start ? sequence >= params.start && sequence < (params.start + params.rate) : true
    if (accord) {
      accord = params.begin && params.end ? new Date(_data[2]).between(new Date(params.begin), new Date(params.end)) :
        params.begin && !params.end ? new Date(_data[2]).compare(new Date(params.begin)) >= 0 :
        !params.begin && params.end ? new Date(_data[2]).compare(new Date(params.end)) <= 0 :
        true
    }
  }
  return accord
}

/**
 * 文件读取promise
 * @param {*} file 文件路径
 * @param {*} filter 过滤函数
 * @param {*} params 过滤参数
 */
function readFile(file, cb, params, format) {
  let result = []
  return new Promise((resolve, reject) => {
    try {
      fs.createReadStream(file).pipe(es.split('\n'))
        .on('data', chunk => {
          if (chunk && !chunk.includes('Time') && cb(chunk, params)) {
            format && format.add ? format.add(chunk) : result.push(chunk)
          }
        })
        .on('end', () => {
          resolve(result)
        })
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 条件获取文件内容
 * @param {*} streams 目标检索流
 * @param {*} begin 开始时间
 * @param {*} end  结束时间
 * @param {*} start  开始行号
 * @param {*} rate 频率(获取条数)
 */
async function find(files, params, format) {
  let promises = []
  let slice
  let res = []
  files.forEach(file => {
    promises.push(readFile(file, filter, params, format))
  })
  await Promise.all(promises).then(result => {
    result.forEach(data => {
      if (params.rate) {
        if (res.length < params.rate) {
          if (res.length + data.length > params.rate) {
            slice = data.slice(0, params.rate - res.length)
            res = res.concat(slice)
          } else {
            res = res.concat(data)
          }
        }
      } else {
        res = res.concat(data)
      }
    })
  })
  return res
}

async function getData(paths, pattern, params, format) {
  let files = await location(paths, pattern, params)
  let result = await find(files, params, format)
  return result
}

async function getDataFromMemory(memoryObj, params, result) {
  if (memoryObj && memoryObj.datas) {
    memoryObj.datas.forEach(chunk => {
      if (filter(chunk, params)) {
        result.add(chunk)
      }
    })
  }
}

router.get('/playback', async(ctx, next) => {
  if (!ctx.query.path) {
    ctx.throw(ERROEKey2, ERROEValue2)
    next()
    return
  }

  let params = {
    begin: null,
    end: null,
    start: isNaN(parseInt(ctx.query.start)) ? 1 : parseInt(ctx.query.start),
    rate: isNaN(parseInt(ctx.query.rate)) ? Number.MAX_VALUE : parseInt(ctx.query.rate)
  }
  let crdData = new ChartLineData()
  let hrdData = new ChartLineData()
  await getData(ctx.query.path, CRDPATTERN, params, crdData)

  await getData(ctx.query.path, HRDPATTERN, params, hrdData)

  ctx.body = {
    crd: crdData.data,
    hrd: hrdData.data
  }
  next()
})

router.get('/statistics', async(ctx, next) => {
  if (!ctx.query.path || !ctx.query.type) {
    ctx.throw(ERROEKey2, ERROEValue2)
    next()
    return
  }

  if (!ctx.query.begin || !ctx.query.end) {
    ctx.throw(ERROEKey5, ERROEValue5)
    next()
    return
  }
  let params = {
    begin: ctx.query.begin,
    end: ctx.query.end,
    start: isNaN(parseInt(ctx.query.start)) ? 1 : parseInt(ctx.query.start),
    rate: isNaN(parseInt(ctx.query.rate)) ? Number.MAX_VALUE : parseInt(ctx.query.rate)
  }
  try {
    let result = new ChartLineData()
    let pattern = ctx.query.type == 1 ? CRDPATTERN : HRDPATTERN
    let type = ctx.query.type == 1 ? 'CRD' : 'HRD'
    await getData(ctx.query.path, pattern, params, result)
    if (result.length < params.rate) {
      let memoryObj = writeMap.get(`${ctx.query.path}${type}`)
      await getDataFromMemory(memoryObj, params, result)
    }
    ctx.body = result.data
  } catch (e) {
    console.log(e)
  }
  let format = 'YYYYMMDDHH24MISS'
  fs.appendFile(path.join(path.resolve(ctx.query.path, '..'), 'statistics.txt'), [new Date().toFormat(format), ctx.query.type, new Date(ctx.query.begin).toFormat(format), new Date(ctx.query.end).toFormat(format),
      ctx.query.condition, ctx.query.output
    ].join('\t') + '\n',
    err => {
      if (err) {
        throw err
      }
    })
  // ctx.body = []
  next()
})

router.get('/zoom', async(ctx, next) => {
  if (!ctx.query.path || !ctx.query.type) {
    ctx.throw(ERROEKey2, ERROEValue2)
    next()
    return
  }

  let params = {
    begin: ctx.query.begin,
    end: ctx.query.end,
    start: isNaN(parseInt(ctx.query.start)) ? 1 : parseInt(ctx.query.start),
    rate: isNaN(parseInt(ctx.query.rate)) ? Number.MAX_VALUE : parseInt(ctx.query.rate)
  }
  try {
    let result = new ChartLineData()
    let pattern = ctx.query.type == 1 ? CRDPATTERN : HRDPATTERN
    let type = ctx.query.type == 1 ? 'CRD' : 'HRD'
    await getData(ctx.query.path, pattern, params, result)
    if (result.length < params.rate) {
      let memoryObj = writeMap.get(`${ctx.query.path}${type}`)
      await getDataFromMemory(memoryObj, params, result)
    }
    ctx.body = result.data
  } catch (e) {
    console.log(e)
  }
  next()
})

router.get('/secondary', async(ctx, next) => {
  if (!ctx.query.path) {
    ctx.throw(ERROEKey2, ERROEValue2)
    next()
    return
  }
  let params = {
    begin: ctx.query.begin,
    end: ctx.query.end,
    start: isNaN(parseInt(ctx.query.start)) ? 1 : parseInt(ctx.query.start),
    rate: isNaN(parseInt(ctx.query.rate)) ? Number.MAX_VALUE : parseInt(ctx.query.rate)
  }
  let result = new AlgorithmData()
  await getData(ctx.query.path, ODPATTERN, params, result)
  ctx.body = result.getData
  next()
})

class ChartLineData {
  constructor() {
    for (let i = 0; i < 10; i++) {
      this[`F${i}`] = []
      this[`T${i}`] = []
      this[`fss${i}`] = []
    }
    this.Time = []
    this.lineNO = []
    this.rate = 64
    this.Max = {
      f: this.fillMax(),
      t: this.fillMax(),
      fss: this.fillMax()
    }

    this.Min = {
      f: this.fillMin(),
      t: this.fillMin(),
      fss: this.fillMin()
    }
    this.Avg = {
      f: new Array(10).fill(0),
      t: new Array(10).fill(0),
      fss: new Array(10).fill(0)
    }
    this.total = 0
  }

  fillMax() {
    let array = []
    for (let i = 0; i < 10; i++) {
      let obj = {
        value: Number.NEGATIVE_INFINITY,
        indexx: 0
      }
      array.push(obj)
    }
    return array
  }

  fillMin() {
    let array = []
    for (let i = 0; i < 10; i++) {
      let obj = {
        value: Number.MAX_VALUE,
        indexx: 0
      }
      array.push(obj)
    }
    return array
  }

  setMax(prop, index, value) {
    if (value > this.Max[prop][index].value) {
      this.Max[prop][index].value = value
      this.Max[prop][index].indexx = this.total
    }
  }

  setMin(prop, index, value) {
    if (value < this.Min[prop][index].value) {
      this.Min[prop][index].value = value
      this.Min[prop][index].indexx = this.total
    }
  }

  setAvg(prop, index, value) {
    this.Avg[prop][index] += value
  }

  add(chunk) {
    let _data = chunk.split('\t')
    this.Time.push(_data[2])
    this.lineNO.push(_data[1])
    let d
    for (let index = 3; index < 33; index++) {
      d = _data[index]
      let value = parseFloat(_data[index])
      if (index <= 12) {
        this[`F${index - 3}`].push(d)
        this.setMax('f', index - 3, value)
        this.setMin('f', index - 3, value)
        this.setAvg('f', index - 3, value)
      } else if (index <= 22) {
        this[`T${index - 13}`].push(d)
        this.setMax('t', index - 13, value)
        this.setMin('t', index - 13, value)
        this.setAvg('t', index - 13, value)
      } else {
        this[`fss${index - 23}`].push(d)
        this.setMax('fss', index - 23, value)
        this.setMin('fss', index - 23, value)
        this.setAvg('fss', index - 23, value)
      }
    }
    this.total += 1
  }

  get data() {
    let count = this.total === 0 ? 1 : this.total
    this.Avg['f'] = this.Avg['f'].map(value => value / count)
    this.Avg['t'] = this.Avg['t'].map(value => value / count)
    this.Avg['fss'] = this.Avg['fss'].map(value => value / count)
    return this
  }

  get length() {
    return this['F1'].length
  }
}

class AlgorithmData {
  constructor() {
    this.data = []
  }

  add(chunk) {
    let obj = {}
    let _data = chunk.split('\t')
    obj['NO'] = _data[1]
    obj['Time'] = _data[2]
    obj['usaFssADArry'] = []
    obj['usaFADArry'] = []
    obj['daTADArry'] = []
    _data.forEach((d, index) => {
      d = parseFloat(d)
      if (index >= 3 && index <= 12) {
        obj['usaFADArry'].push(d)
      } else if (index >= 13 && index <= 22) {
        obj['daTADArry'].push(d)
      } else if (index >= 23 && index <= 32) {
        obj['usaFssADArry'].push(d)
      }
    })
    this.data.push(obj)
  }

  get getData() {
    return this.data
  }
}

function doRate(str) {
  if (!str) {
    return 1
  }
  let data = 1
  switch (str) {
  case '64':
    data = 1
    break

  case '32':
    data = 2
    break

  case '16':
    data = 4
    break

  case '8':
    data = 8
    break

  case '4':
    data = 16
    break

  case '2':
    data = 32
    break

  case '1':
    data = 64
    break

  case '1/2':
    data = 128
    break

  case '1/4':
    data = 256
    break

  case '1/8':
    data = 512
    break

  case '1/16':
    data = 1024
    break

  default:
    data = 1
  }
  return data
}
export default router