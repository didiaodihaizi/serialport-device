
import lodash from './../../../../node_modules/lodash'

function RealTimeChart (options) {
  let requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback) {
              window.setTimeout(callback, 1000 / 60)
            }
  })()
  let width = options.width || window.innerWidth
  let height = options.height || window.innerHeight
    // let paddingX = 40 || options.paddingX
    // let paddingY = 40 || options.paddingY
//   let yAxisWidth = 50 || options.yAxisWidth

  let colors = options.colors || []

  let canvans = document.getElementById(options.source) // canvans

  canvans.width = width

  canvans.height = height

  let ctx = canvans.getContext('2d')

  let yCtx = [] // 存储y轴上下文环境

  let yCanvans = [] // 存储y轴画布

  let xCanvans = document.createElement('canvas')

  let xCtx = xCanvans.getContext('2d')

  let yAxis = options.yAxis || [[{x: 0, y: 0}]] // Axis Y values
  let data = options.data || [] // data

  let yPoints = [] // y轴坐标点纵坐标

  let xAxisShowNum = options.xAxisShowNum || data[0].length + 20 // x轴值显示最大个数

    // let zero_x = paddingX,zero_y = height // (0,0) (x,y)

  let zeroXY = []// 存储(0,0)坐标

  let reqFrame

  let disabled = options.disabled || []

  let defaultEvents = {
    ondblclick: () => {
      if (reqFrame) {
        this.stop()
        beforeResizePagePoints = lodash.cloneDeep(currentPagePoints)
        leftRelativeIndex = 0
        rightRelativeIndex = beforeResizePagePoints.xAxis.length - 1
      } else {
        this.restart()
      }
    },
    onMouseWheel: (e) => {
      if (!reqFrame) { // 滚动式不允许缩放
        e = e || window.event
        let value = e.wheelDelta || e.detail
        if (value > 0) {
          let resizeIndex = currentPagePoints.xAxis.findIndex(element => element.x >= e.offsetX)
          if (resizeIndex < 0) return
          upWheel(resizeIndex)
        } else {
          downWheel()
        }
      }
    },
    onMouseMove: (e) => {
      if (!reqFrame) {
            // ctx.clearRect(moveOnPoint.x,moveOnPoint.y,0.1,moveOnPoint.y - zeroXY[0].y)
        let moveIndex = currentPagePoints.xAxis.findIndex(element => e.offsetX >= element.x * 0.9 && e.offsetX <= element.x * 1.1)
            // moveOnPoint.x = currentPagePoints.xAxis[moveIndex].x
        let targetData = []// no:线号 y:y值
        if (moveIndex !== -1) {
          currentPagePoints.data.forEach((cdata, index) => {
            targetData.push({
              no: index,
              y: cdata[moveIndex].y
            })
                // yTemp = currentPagePoints.coord[index][moveIndex].y
                // moveOnPoint.y = yTemp > moveOnPoint.y ? yTemp : moveOnPoint.y
          })
        }
        if (typeof options.onMouseMoveCb === 'function') {
          options.onMouseMoveCb(targetData)
        }
            // ctx.fillRect(moveOnPoint.x,moveOnPoint.y,0.1,zeroXY[0].y - moveOnPoint.y)
      }
    }
  }

  let ondblclick = options.ondblclick || defaultEvents.ondblclick

  let onMouseWheel = options.onMouseWheel || defaultEvents.onMouseWheel

  let onMouseMove = options.onMouseMove || defaultEvents.onMouseMove

    /**
     * Y轴配置
     */
  let configY = [{
    tag: {
      padding_left: 0.95,
      text_padding_left: 0.85
    },
    height: 0.9,
    padding_bottom: 0.05,
    padding_top: 0.05,
    orientation: 1, // 左
    padding_left: 0.07// Y轴直线左边距
  }, {
    tag: {
      padding_left: 0.05,
      text_padding_left: 0.85
    },
    height: 0.9,
    padding_bottom: 0.05,
    padding_top: 0.05,
    orientation: -1, // 右
    padding_left: 0.93
  }]

  let spaceX

    // 当前页数据信息
  let currentPagePoints = {
    data: [], // 数据
    coord: [], // 坐标
    xAxis: []// x轴
  }

  let beforeResizePagePoints

    // 移动点
//   let moveOnPoint = {
//     x: Number.MIN_VALUE,
//     y: Number.MIN_VALUE
//   }

  this.getY = (c) => {
    return configY[c]
  }

  this.setY = (c, v) => {
    configY[c] = v
  }

    /**
     * 停止刷新
     */
  this.stop = () => {
    cancelAnimationFrame(reqFrame)
    reqFrame = null
  }

    /**
     * 重启刷新
     */
  this.restart = () => {
    reqFrame = requestAnimFrame(render)
  }

  this.resize = (w, h) => {
        // if(reqFrame)
        //   cancelAnimationFrame(reqFrame)
    width = w
    height = h
    canvans.width = w
    canvans.height = h
    init()
  }

  this.populate = (points) => {
    data = points
  }
  this.populateX = (points) => {
  }
  this.populateY = (points) => {
    yAxis = points
  }

    /**
     * 隐藏线
     */
  this.disable = (line) => {
    disabled.push(line)
  }

    /**
     * 取消隐藏
     */
  this.cancelDisable = (line) => {
    disabled = disabled.filter(value => value !== line)
  }

    /**
     * 添加数据
     */
  this.add = (ndata) => {
    if (!ndata || ndata.length === 0) { return }
    let old
    let count = NaN
    ndata.forEach((line, index) => {
      if (!line || line.length === 0) { return }

      old = data[index] ? data[index] : []

      count = old.length + line.length
      if (count > xAxisShowNum) {
        old.splice(0, count - xAxisShowNum)
      }
      data[index] = old.concat(line)
    })
  }

    /**
     * 渲染坐标轴
     */
  function render () {
    draw()
    reqFrame = requestAnimFrame(render)
  }

    /**
     * 计算X轴点间距
     */
  function calSpaceX (xAxisShowNum) {
    if (!yAxis || yAxis.length === 0) {
      spaceX = width / (xAxisShowNum - 1)
    } else if (yAxis.length === 1) {
      spaceX = (width - zeroXY[0].x) / (xAxisShowNum - 1)
    } else {
      spaceX = (zeroXY[zeroXY.length - 1].x - zeroXY[zeroXY.length - 2].x) / (xAxisShowNum - 1)
    }
  }

    /**
     * 初始化
     */
  function init () {
    if (!ctx || !xCtx) { throw new Error('canvas initialization failed') }
    initY()
    drawY()
    bindEvents()
  }

    /**
     * 初始化Y轴
     */
  function initY () {
    if (yAxis && yAxis.length !== 0) {
      yCanvans = []
      yCtx = []
      yAxis.forEach((axis, index) => {
        let canvans = document.createElement('canvas')
        canvans.width = width * (index * 1 + configY[index].padding_left * configY[index].orientation)
        canvans.height = height
        yCanvans.push(canvans)
        yCtx.push(canvans.getContext('2d'))
      })
    }
  }

    /**
     * 画Y轴
     */
  function drawY () {
    if (!yAxis || yAxis.length === 0) { return }
    zeroXY = []
    yPoints = []
    yAxis.forEach((ydata, pindex) => {
      let ydataTemp = lodash.cloneDeep(ydata)
      let length = ydata.length
      ydataTemp.unshift(Number.MIN_VALUE)
      ydataTemp.push(Number.MAX_VALUE)
      let zeroX = width * configY[pindex].padding_left
      let smallestY = height * configY[pindex].padding_bottom// y轴最小刻度纵坐标
      if (!zeroXY[pindex]) {
        zeroXY.push({x: zeroX, y: smallestY})
      }
      if (!yPoints[pindex]) {
        yPoints[pindex] = []
      }
      let space = Math.floor(height * configY[pindex].height / (length - 1)) // y轴相邻刻度间距

      yCtx[pindex].clearRect(0, 0, yCanvans[pindex].width, yCanvans[pindex].height)

      yCtx[pindex].save()

      let yx = yCanvans[pindex].width * (1 + pindex * configY[pindex].orientation)// 画布中y轴x坐标
      drawLine(
            yCtx[pindex],
            yx,
            0,
            yx,
            height
        )

      ydataTemp.reverse()

      let tagEndX = yCanvans[pindex].width * configY[pindex].tag.padding_left

      let y

      ydataTemp.forEach((value, index) => {
        if (index !== 0 && index !== ydataTemp.length - 1) {
          y = (index - 1) * space + smallestY
          drawLine(yCtx[pindex], yx, y, tagEndX, y)
          yCtx[pindex].textAlign = configY[pindex].orientation > 0 ? 'right' : 'left'// y轴文字靠右写
          yCtx[pindex].textBaseline = 'middle'// 文字的中心线的调整
          yCtx[pindex].fillText(value, tagEndX, y)
          if (value === 0) {
            zeroXY[pindex].y = y
          }
        }
        if (index === 0) {
          yPoints[pindex].push({
            min: ydataTemp[index + 1],
            max: value,
            minY: 0,
            maxY: smallestY,
            first: true
          })
        } else if (index === length) {
          yPoints[pindex].push({
            min: ydataTemp[index + 1],
            max: value,
            minY: y,
            maxY: height,
            last: true
          })
        } else if (index === ydataTemp.length - 1) {

        } else {
          yPoints[pindex].push({
            min: ydataTemp[index + 1],
            max: value,
            minY: y,
            maxY: index * space + smallestY
          })
        }
      })
      yCtx[pindex].restore()
    })
  }

    /**
     * 初始化X轴
     */
  function initX () {
    if (zeroXY.length > 0) {
      ctx.beginPath()
      ctx.moveTo(zeroXY[0].x, zeroXY[0].y)
      if (zeroXY.length > 1) {
        ctx.lineTo(zeroXY[zeroXY.length - 1].x, zeroXY[zeroXY.length - 1].y)
      } else {
        ctx.lineTo(width, zeroXY[0].y)
      }
      ctx.stroke()
    }
  }
    /**
     * 画X轴
     * @param {*} xAxis
     */
  function drawX (xAxis) {
    ctx.beginPath()
    ctx.strokeStyle = '#000000'
    ctx.textAlign = 'center'// y轴文字靠右写
    ctx.textBaseline = 'middle'// 文字的中心线的调整
    xAxis.forEach((element) => {
      ctx.moveTo(element.x, zeroXY[0].y)
      ctx.lineTo(element.x, zeroXY[0].y + height * configY[0].padding_bottom * 0.1)
      ctx.fillText(element.value, element.x, zeroXY[0].y + height * configY[0].padding_bottom * 0.25)
    })
    ctx.stroke()
  }

    /**
     * 数据画图
     */
  function drawData (data) {
    currentPagePoints.data = lodash.cloneDeep(data)
    let xAxis = []
    let x = Number.NaN
    let y = Number.NaN
    let next_x = Number.NaN
    let next_y = Number.NaN
    let middle = Number.NaN
    let strokeX = false
    data.forEach((points, lindex) => {
      if (!colors[lindex]) {
        colors.push(`rgb(${parseInt(Math.random() * 256)},${parseInt(Math.random() * 256)},${parseInt(Math.random() * 256)})`)
      }
      ctx.strokeStyle = colors[lindex]
      ctx.beginPath()
      strokeX = lindex === 0
      points.forEach((point, index) => {
        if (isNaN(x) && isNaN(y)) {
          x = getCoordX(index)
          y = getCoordY(point.y, point.no)
        } else {
          x = next_x
          y = next_y
        }
        if (strokeX) xAxis.push({x: x, value: point.x})
        if (!currentPagePoints.coord[lindex]) currentPagePoints.coord[lindex] = []
        currentPagePoints.coord[lindex].push({
          x: x,
          y: y
        })
        if (!disabled.includes(lindex)) {
          ctx.moveTo(x, y)
          if (index < points.length - 1) {
            next_x = getCoordX(index + 1)
            next_y = getCoordY(points[index + 1].y, point.no)
                // ctx.lineTo(next_x,next_y)
            middle = (x + next_x) / 2
            ctx.bezierCurveTo(middle, y, middle, next_y, next_x, next_y)
          }
        }
      })
      ctx.stroke()
      x = y = next_x = next_y = middle = Number.NaN
    })
    currentPagePoints.xAxis = lodash.cloneDeep(xAxis)
    return xAxis
  }

  let leftRelativeIndex// 放大时左边减少点数
  let rightRelativeIndex// 放大时后边减少点数

  function isUpAcme () {
    return currentPagePoints.xAxis.length === 2 || currentPagePoints.xAxis.length === 1
  }

  function isDownAcme () {
    return currentPagePoints.xAxis.length === beforeResizePagePoints.length
  }

  function reduceRight () {
    currentPagePoints.data.forEach(cdata => cdata.pop())
    resizeDraw()
    rightRelativeIndex -= 1
  }

  function addRight () {
    currentPagePoints.data.forEach((cdata, index) => {
      cdata.push(beforeResizePagePoints.data[index][rightRelativeIndex + 1])
    })
    resizeDraw()
    rightRelativeIndex += 1
  }

  function reduceLeft () {
    currentPagePoints.data.forEach(cdata => cdata.shift())
    resizeDraw()
    leftRelativeIndex += 1
  }

  function addLeft () {
    if (leftRelativeIndex > 0) {
      currentPagePoints.data.forEach((cdata, index) => {
        cdata.unshift(beforeResizePagePoints.data[index][leftRelativeIndex - 1])
      })
      resizeDraw()
      leftRelativeIndex -= 1
    }
  }

  function reduceBoth () {
    currentPagePoints.data.forEach(cdata => {
      cdata.shift()
      cdata.pop()
    })
    resizeDraw()
    rightRelativeIndex -= 1
    leftRelativeIndex += 1
  }

  function addBoth () {
    currentPagePoints.data.forEach((cdata, index) => {
      cdata.unshift(beforeResizePagePoints.data[index][leftRelativeIndex - 1])
      cdata.push(beforeResizePagePoints.data[index][rightRelativeIndex + 1])
    })
    resizeDraw()
    leftRelativeIndex -= 1
    rightRelativeIndex += 1
  }

  function upWheel (resizeIndex) {
    if (isUpAcme()) { return }
    let spaceDiffreence = currentPagePoints.length - 1 - resizeIndex - resizeIndex
    if (spaceDiffreence > 0) {
      reduceRight()
    } else if (spaceDiffreence === 0) {
      reduceBoth()
    } else {
      reduceLeft()
    }
  }

  function downWheel () {
    if (isDownAcme()) { return }
    let spaceDiffreence = beforeResizePagePoints.length - 1 - rightRelativeIndex - leftRelativeIndex
    if (spaceDiffreence === 0) {
      addBoth()
    } else if (spaceDiffreence > 0) {
      addRight()
    } else {
      addLeft()
    }
  }

    /**
     * 事件绑定
     */
  function bindEvents () {
    canvans.ondblclick = ondblclick

    canvans.onmousewheel = onMouseWheel

    canvans.onmousemove = onMouseMove
  }

    /**
     * 初始化当前页
     */
  function initCuurentPagePoints () {
    currentPagePoints.data = []
    currentPagePoints.xAxis = []
    currentPagePoints.coord = []
  }

    /**
     * 画图
     */
  function draw () {
    calSpaceX(xAxisShowNum)

    initCuurentPagePoints()

    ctx.clearRect(0, 0, width, height)

    yCanvans.forEach((canvans, index) => {
      ctx.drawImage(canvans, index * width * configY[index].padding_left, 0)
    })
    initX()// 画X轴

    ctx.save()

    let xAxis = drawData(data)

    drawX(xAxis)

    ctx.restore()
  }

  let resized = true

  function resizeDraw () {
    if (!reqFrame && resized) {
      resized = false

      let resizeData = currentPagePoints.data

      let resizeXshow = currentPagePoints.data[0].length

      initCuurentPagePoints()

      calSpaceX(resizeXshow)

      ctx.clearRect(0, 0, width, height)

      yCanvans.forEach((canvans, index) => {
        ctx.drawImage(canvans, index * width * configY[index].padding_left, 0)
      })

      initX()// 画X轴

      ctx.save()

      let xAxis = drawData(resizeData)

      drawX(xAxis)

      ctx.restore()

      resized = true
    }
  }

    /**
     * 画线
     * @param {*} ctx
     * @param {*} x0
     * @param {*} y0
     * @param {*} x1
     * @param {*} y1
     */
  function drawLine (ctx, x0, y0, x1, y1) {
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.stroke()
  }

    /**
     * 计算Y轴坐标
     * @param {*} y y轴值
     * @param {*} l 参照Y轴(从左至右0,1...)
     */
  function getCoordY (y, l) {
    let section = yPoints[l].find((element) => {
      return y >= element.min && y < element.max
    })
    if (section.first) {
      return section.minY - 10
    } else if (section.last) {
      return section.maxY + 10
    } else {
      return Math.round(section.maxY - (section.maxY - section.minY) / (section.max - section.min) * (y - section.min))
    }
  }

    /**
     * 计算X轴坐标
     * @param {*} index x轴数据索引
     */
  function getCoordX (index) {
    if (!data || !data[0]) { return 0 }
    return index * spaceX + zeroXY[0].x
  }
  init()
  render()
}

export default RealTimeChart
