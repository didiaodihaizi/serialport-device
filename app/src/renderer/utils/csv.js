import fs from 'fs'
import json2csv from 'json2csv'

const newLine = '\r\n'

let fields = ['Total', 'Name']

function appendCSV (path, content) {
  let toCsv = {
    data: content,
    fields: fields,
    hasCSVColumnTitle: false
  }
  fs.stat('G:\\data\\file.csv', function (err, stat) {
    if (err == null) {
      let csv = json2csv(toCsv) + newLine

      fs.appendFile('G:\\data\\file.csv', csv, function (err) {
        if (err) throw err
        console.log('The "data to append" was appended to file!')
      })
    } else {
      fields = (fields + newLine)

      fs.writeFile('G:\\data\\file.csv', fields, function (err, stat) {
        if (err) throw err
      })
    }
  })
}

export default appendCSV
