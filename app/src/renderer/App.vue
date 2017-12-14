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
                  <FormItem label="波特率">
                    <Select v-model="formItem.baudRate" >
                        <Option v-for="item in baudRate" :value="item.value" :key="item.value">{{ item.label }}</Option>
                    </Select>
                  </FormItem>
                </div>
              </Form>
              <div style="text-align: right; padding-right: 20px;">
              </div>
            </MenuGroup>
          </Menu>
        </div>
      </Col>
      <Col span=20 class="right">
        <Card :dis-hover="true">
          <p slot="title" style="display: flex;">
            设备列表
            <span style="flex: 1;text-align: right;">
              <Button type="success" @click="start">检测</Button>
              <Dropdown @on-click="exportData">
                  <Button type="primary">
                      导出
                      <Icon type="arrow-down-b"></Icon>
                  </Button>
                  <DropdownMenu slot="list">
                      <DropdownItem  v-for="item in export_type" :name = "item.value">{{ item.label }}</DropdownItem>
                  </DropdownMenu>
              </Dropdown>
            </span>
          </p>
          <div style="position:relative">
            <Table border height="800" :columns="columns1" :data="data2" ref= "deviceTable">
            </Table>
            <Spin size="large" fix v-if="spin_loading">
                <Icon type="load-c"  class="demo-spin-icon-load"></Icon>
                <div>解析中</div>
            </Spin>
          </div>
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
  import fs from 'fs-extra'
  import path from 'path'
  import dateUtils from 'date-utils'
  
  export default {
    data() {
      return {
        instance: null,
        port: [],
        qualified: [],
        spin_loading: false,
        mac: '',
        adc: 0,
        rssi: 0,
        adcValid: false,
        bleValid: false,
        exportType: '',
        export_type: [
          {
            value: '1',
            label: '合格'
          },
          {
            value: '2',
            label: '不合格'
          },
          {
            value: '3',
            label: '全部'
          },
        ],
        formItem: {
          port : '',
          baudRate: 115200,
        },
        baudRate: [
          {
            value: 115200,
            label: 115200
          }
        ],
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
      // for(let i = 0; i< 100; i++){
      //   this.data2.push({
      //         ADC_value: 'John Brown',
      //         ADC_qualified: '合格',
      //         Mac: 'New York No. 1 Lake Park',
      //         signal: '2016-10-03',
      //         signal_qualified: '不合格'
      //     },)
      // }
    },
    methods: {
      searchPorts() {
        AdvanproPiSerialport.scan()
        .then(ports => {
          this.port = ports
          this.formItem.port = ports[0].comName
        })
      },
      filters(){
        this.qualified = this.qualified.filter(ele => {
          console.log(new Date().getSecondsBetween(ele.date))
          return new Date().getSecondsBetween(ele.date) > -30
        })
      },

      findIndex(mac){
        return this.qualified.findIndex(ele => ele.mac === mac)
      },
      start() {
        let testResult = {
              ADC_value: '',
              ADC_qualified: '',
              Mac: '',
              signal: '',
              signal_qualified: ''
          }
        this.spin_loading = true
        this.exportType = ''
        this.filters()
        AdvanproPiSerialport.create({
          path: this.formItem.port
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
                this.mac = this.insert_flg(input[1],':',2)
                testResult.ADC_value = this.adc
                testResult.Mac = this.mac
                if(this.findIndex(this.mac) > -1){
                  reject(new Error('30S内已做过检测，请稍后再试'))
                }
                if(this.adc >= 30000 && this.adc < 35000){
                  //adc合格更新UI
                  testResult.ADC_qualified = '合格'
                }else{
                  //adc不合格更新UI
                  testResult.ADC_qualified = '不合格'
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
              console.log(record)
              testResult.signal = record.rssi
              if(record.address.toUpperCase() === this.mac){
                if(record.rssi >= -40){
                  //合格更新UI
                   testResult.signal_qualified = '合格'
                  console.log('蓝牙合格')
                }else{
                  //不合格更新UI
                   testResult.signal_qualified = '不合格'
                  console.log('蓝牙不合格')
                }
                resolve()
              }
            })
          })
        })
        .then(() => {
          this.data2.push(testResult)

          this.stop()
          this.spin_loading = false
          this.qualified.push({
            mac: this.mac,
            date: new Date()
          })
          console.log(this.qualified)
        })
        .catch(err => {
          this.$Message.error(err.toString())
          this.spin_loading = false
          this.stop()
          console.log( err)
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
      exportData (type) {
        console.log(type)
        switch(type) {
          case '1': 

            this.$refs.deviceTable.exportCsv({
                filename: '合格',
                columns: this.columns1.filter((col, index) => index >= 0),
                data: this.data2.filter((data, index) => data.ADC_qualified === '合格' && data.signal_qualified === '合格' )
            })
            break
          case '2': 
            this.$refs.deviceTable.exportCsv({
                filename: '不合格',
                columns: this.columns1.filter((col, index) => index >= 0),
                data: this.data2.filter((data, index) => data.ADC_qualified === '不合格' && data.signal_qualified === '不合格')
            })
            break
          case '3': 
            this.$refs.deviceTable.exportCsv({
                filename: '全部',
            })
            break
        }
        
      },
      insert_flg(str,flg,sn){
        let newstr="";
        for(let i=0;i<str.length;i+=sn){
            let tmp=str.substring(i, i+sn);
            newstr+=tmp+flg;
        }
        return newstr.slice(0, newstr.length - 1);
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
  .exportSelect {
    position: absolute;
    right: 120px;
    width: 115px;
    z-index: 1;
    border: 1px solid #999;
    padding: 10px 0;
    li{
      padding: 0 10px;
      border-bottom: 1px solid #eee;
    }
    li:not-last-child{
      border-bottom:none
    }
  }
  .demo-spin-icon-load{
      animation: ani-demo-spin 1s linear infinite;
  }
  @keyframes ani-demo-spin {
      from { transform: rotate(0deg);}
      50%  { transform: rotate(180deg);}
      to   { transform: rotate(360deg);}
  }
</style>