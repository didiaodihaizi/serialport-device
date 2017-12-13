<template>
  <div class="layout" style="overflow:auto">
    <Row type="flex" class="fullheight" style="display: flex;">
      <Col  class=" fullheight">
        <div class="fullheight" style="padding-top: 10px;height: 100%;padding-left: 10px;">
          <Menu theme="light" active-name="1">
            <MenuGroup title="串口设置">
              <Form class="left-form" :label-width="80">
                <div @click="searchPorts">
                  <FormItem label="选择串口号">
                    <Select v-model="formItem.port" >
                        <Option v-for="item in port" :value="item.comName" :key="item.comName">{{ item.comName }}</Option>
                    </Select>
                  </FormItem>
                </div>
                <FormItem label="波特率">
                  <Input v-model="formItem.rate">
                  </Input>
                </FormItem>
              </Form>
              <div style="text-align: right; padding-right: 20px;">
              </div>
            </MenuGroup>
          </Menu>
        </div>
      </Col>
      <Col  class="right">
        <Card :dis-hover="true">
          <p slot="title" style="display: flex;">
            设备列表
            <span style="flex: 1;text-align: right;">
              <Button type="success" @click="start">启动</Button>
              <Button type="error" @click="stop">停止</Button>
              <Button type="info" @click="exportData">导出</Button>
            </span>
          </p>
          <Table border height="800" :columns="columns1" :data="data2" ref= "deviceTable"></Table>
        </Card>
        
      </Col>
    </Row>
  </div>
</template>

<script>
  import {
    AdvanproPiSerialport,
    BluetoothAdapter
  } from 'renderer/utils/proxy';

  import dateUtils from 'date-utils'
  
  export default {
    data() {
      return {
        instance: null,
        port: [],
        qualified: [],
        mac: '',
        adc: 0,
        rssi: 0,
        adcValid: false,
        bleValid: false,
        formItem: {
          port : '',
          rate: '115200',
        },
        columns1: [
          {
              title: 'ADC值',
              key: 'ADC_value',
 
          },
          {
              title: 'ADC合格',
              key: 'ADC_qualified',
              render: (h, params) => {
                return h('div', {
                          attrs: {
                            class: params.row.ADC_qualified === '合格' ? 'pass' : 'nopass'
                          }
                        }, [])
              }
 
          },
          {
              title: 'Mac',
              key: 'Mac',
 
          },
          {
              title: '信号量',
              key: 'signal',
 
          },
          {
              title: '信号合格',
              key: 'signal_qualified',
              render: (h, params) => {
                return h('div', {
                          attrs: {
                            class: params.row.signal_qualified === '合格' ? 'pass' : 'nopass'
                          }
                        }, [])
              }
 
          },
        ],
        data2: [ ]
      }
    },
    mounted() {
      this.searchPorts()
      for(let i = 0; i< 100; i++){
        this.data2.push({
              ADC_value: 'John Brown',
              ADC_qualified: '合格',
              Mac: 'New York No. 1 Lake Park',
              signal: '2016-10-03',
              signal_qualified: '不合格'
          },)
      }
    },
    methods: {
      searchPorts() {
        AdvanproPiSerialport.scan()
        .then(ports => {
          this.port = ports
        })
      },
      filters(){
        this.qualified = this.qualified.filter(ele => {
          return new Date().getSecondsBetween(ele.date) < 30
        })
      },

      findIndex(mac){
        return this.qualified.findIndex(ele => ele.mac === mac)
      },
      start() {
        this.filters()
        AdvanproPiSerialport.create({
          path: 'COM8'
        })
        .then(instance => {
          this.instance = instance
          return this.instance.connect()
        })
        .then(() => { 
          return new Promise((resolve, reject) => {
            setTimeout(() => {this.adcValid = false;reject(new Error('未找到设备mac地址'))},10000)
            this.instance.on('data', (err,res) => {
              let reg = /^&#\tmac=([0-9A-F]{12})\tadc=([0-9A-F]+)$/g
              let input = reg.exec(res)
              if(input && input[1] && input[2]){
                this.adc = parseInt(input[2], 16)
                this.mac = input[1]
                if(this.findIndex(this.mac) > -1){
                  reject(new Error('30S内已做过检测，请稍后再试'))
                }
                if(this.adc >= 30000 && this.adc < 35000){
                  //adc合格更新UI
                  this.adcValid = true
                  console.log('adc合格')
                }else{
                  //adc不合格更新UI
                  this.adcValid = false
                  console.log('adc不合格')
                }
                resolve()
              }
            })
          })
        })
        .then(() => {
          return new Promise((resolve, reject) => {
            setTimeout(() => {this.bleValid = false;reject(new Error('未找到设备蓝牙信号'))},20000)
            BluetoothAdapter.scan((record) => {
              if(record.address.toUpperCase().replace(/:/g,'') === this.mac){
                if(record.rssi >= -40){
                  this.bleValid = true
                  //合格更新UI
                  console.log('蓝牙合格')
                }else{
                  this.bleValid = false
                  //不合格更新UI
                  console.log('蓝牙不合格')
                }
                resolve()
              }
            })
          })
        })
        .then(() => {
          if(this.adcValid && this.bleValid){
            this.qualified.push({
              mac: this.mac,
              date: new Date()
            })
          }
        })
        .catch(err => {
          console.log('err:', err)
        })
      },
      stop() {
        if(this.instance){
          this.instance
          .disconnect()
          .then(res => {
            return BluetoothAdapter.stop()
          })
          .catch(err => {
            console.log('err:', err)
          })
        }
      },
      exportData () {
        this.$refs.deviceTable.exportCsv({
            filename: 'The original data',
        });
      }
    }
  }
</script>

<style lang="scss" >
@import "./assets/scss/main.scss";
  .ivu-menu-light{
    height: 100%;
  }
  .ivu-card-head p, .ivu-card-head-inner{
    height: 32px;
  }
  .left-form{
    height: 100%;
    padding-right: 20px;
    padding-top: 20px;
  }
  .right {
    padding:10px;
    flex: 1;
  }
  .pass{
    width: 10px;
    height: 10px;
    background-color: #09BB07;
    border-radius: 50%;
  }
  .nopass{
    width: 10px;
    height: 10px;
    background-color: #FF0000;
    border-radius: 50%;
  }
</style>