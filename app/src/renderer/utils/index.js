export default {
  dateToTimestamp(date, ms = false) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    if (ms) {
      let millisec = date.getMilliseconds();
      return year + (month < 10 ? `0${month}` : month.toString()) + (day < 10 ? `0${day}` : day.toString()) + (hour < 10 ? `0${hour}` : hour.toString()) + (minute < 10 ? `0${minute}` : minute.toString()) + (second < 10 ? `0${second}` : second.toString() + millisec.toString());
    }
    return year + (month < 10 ? `0${month}` : month.toString()) + (day < 10 ? `0${day}` : day.toString()) + (hour < 10 ? `0${hour}` : hour.toString()) + (minute < 10 ? `0${minute}` : minute.toString()) + (second < 10 ? `0${second}` : second.toString());
  },
  dateToYYYYMMDDhhmmss(date, ms = false) {
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let second = date.getSeconds();
    if (ms) {
      let millisec = date.getMilliseconds();
      return year + '/' + (month < 10 ? `0${month}` : month.toString()) +'/' + (day < 10 ? `0${day}` : day.toString()) +' ' + (hour < 10 ? `0${hour}` : hour.toString()) + ':' + (minute < 10 ? `0${minute}` : minute.toString()) + ':' + (second < 10 ? `0${second}` : second.toString());
    }
    return year + '/' + (month < 10 ? `0${month}` : month.toString()) +'/' + (day < 10 ? `0${day}` : day.toString()) +' ' + (hour < 10 ? `0${hour}` : hour.toString()) + ':' + (minute < 10 ? `0${minute}` : minute.toString()) + ':' + (second < 10 ? `0${second}` : second.toString());
  },
}