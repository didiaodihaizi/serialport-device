import fs from 'fs'
import json2csv from 'json2csv'

const newLine = '\r\n'

let fields = ['ADC值', 'ADC合格', 'mac地址', '信号强度', '信号合格']
function appendCSV (path, content) {
  let toCsv = {
    data: content,
    fields: fields,
    hasCSVColumnTitle: false
  }
  fs.stat(path, function (err, stat) {
    if (err == null) {
      let csv = json2csv(toCsv) + newLine

      fs.appendFile(path, csv, function (err) {
        if (err) throw err
        console.log('The "data to append" was appended to file!')
      })
    } else {
      let headers = (fields + newLine)

      fs.writeFile(path, headers, function (err, stat) {
        if (err) throw err
      })
    }
  })
}

export default appendCSV
