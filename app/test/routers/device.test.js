import Should from 'should';
import Request from 'supertest-as-promised';
import app from '../../dist/app';
import defaults from 'defaults';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
const request = Request(app.instance.listen()); 

describe('devices Routers', () => {
  // 存储令牌
  let token = null;

  // 创建测试设备数据
  let DEVICE = {
    uuid: 12221,
    status: 1,
    name: 'onYHuvz-0-hvZwLYBR3m1EejFQbE111',
    code: '111111111111111',
    type: 1,
    settings: [{
        info: {
          MAC: '0A2B467F88C0',
          bat: 999,
          dID: '1',
          fw: 1,
          hw: 1,
          sdf: 100,
          sdt: 100,
          state: 1,
        },
        output: ['uart',
          'ble',
          'sd',
        ],
        rate: 1024,
        rateDiv: {
          acc: 1,
          ecg: 0,
          fss: 1,
          gyr: 1,
          mag: 1,
          sDk: 1,
        },
      },
      {
        info: {
          MAC: '0A2B467F88C0',
          bat: 999,
          dID: '2',
          fw: 1,
          hw: 1,
          sdf: 100,
          sdt: 100,
          state: 1,
        },
        output: ['uart',
          'ble',
          'sd',
        ],
        rate: 1024,
        rateDiv: {
          acc: 1,
          ecg: 0,
          fss: 1,
          gyr: 1,
          mag: 1,
          sDk: 1,
        },
      },
    ],
    connections: [{
      serial_number: 'C10B01-0A2B467F88C0',
      mac: '0A2B467F88C0',
      device_id: 1,
    }, {
      serial_number: 'C10B41-0A2B467F88C0',
      mac: 'RMAC',
      device_id: 2,
    }],
  };

  //
  let DEVICE1 = {
    uuid: 12342342,
    name: 'onYHuvz-0-hvZwLYBR3m1EejFQbE111',
    type: 1,
    status: 0,
    log_uuid: 111,
    client_uuid: 1,
    settings: [{
        info: {
          MAC: '0A2B467F88C0',
          bat: 999,
          dID: '1',
          fw: 1,
          hw: 1,
          sdf: 100,
          sdt: 100,
          state: 1,
        },
        output: ['uart',
          'ble',
          'sd',
        ],
        rate: 1024,
        rateDiv: {
          acc: 1,
          ecg: 0,
          fss: 1,
          gyr: 1,
          mag: 1,
          sDk: 1,
        },
      },
      {
        info: {
          MAC: '0A2B467F88C0',
          bat: 999,
          dID: '2',
          fw: 1,
          hw: 1,
          sdf: 100,
          sdt: 100,
          state: 1,
        },
        output: ['uart',
          'ble',
          'sd',
        ],
        rate: 1024,
        rateDiv: {
          acc: 1,
          ecg: 0,
          fss: 1,
          gyr: 1,
          mag: 1,
          sDk: 1,
        },
      },
    ],
    connections: [{
      serial_number: 'C10B01-0A2B467F88C0',
      mac: '0A2B467F88C0',
      device_id: 1,
    }, {
      serial_number: 'C10B41-0A2B467F88C0',
      mac: 'RMAC',
      device_id: 2,
    }],
  };

  // 创建运行记录数据
  let LOG = {
    'uuid': 1,
    'desc': '测试',
    'dir_code': 'tom',
    'begin_time': Date.now(),
    'storage': 1,
  };

  // 登录
  it('should be login', (done) => {
    request
      .post('/login')
      .expect(200)
      .send({ serial_no: 111, model: 'VivoV66' })
      .then((res) => {
        Should.exist(res.body.data);
        token = res.body.data;
        done();
      });
  });

  // 获得ip地址
  it('should be get ip addresss', (done) => {
    request
      .get('/pc')
      .set('Authorization', token)
      .expect(200)
      .then((res) => {
        Should.exist(res.body.data);
        done();
      });
  });

  // 添加一个设备
  it('should be save device ', (done) => {
    request
      .post('/my/devices/')
      .expect(200)
      .set('Authorization', token)
      .send(DEVICE)
      .then((res) => {
        res.body.success.should.be.equal(true);
        done();
      });
  });

    // 根据关键字设备名称获取移动终端设备列表
    it('should be get device list by name', (done) => {
      request
        .get(`/my/devices/list/111/1?keyword=${DEVICE.name}&size=30`)
        .expect(200)
        .set('Authorization', token)
        .then((res) => {
          res.body.success.should.be.equal(true);
          res.body.data.list[0].name.should.eql(DEVICE.name);
          res.body.data.list[0].type.should.eql(DEVICE.type);
          res.body.data.list[0].code.should.eql(DEVICE.code);
          res.body.data.list[0].connections.should.eql(DEVICE.connections);
          res.body.data.list[0].settings.should.eql(DEVICE.settings);
          done();
        });
    });

    // 根据设备主键修改设备 settings
    it('should be update device settings', (done) => {
      request
        .put(`/my/devices/${DEVICE.uuid}/settings/update`)
        .expect(200)
        .set('Authorization', token)
        .send({
          settings: DEVICE.settings,
        })
        .then((res) => {
          res.body.success.should.be.equal(true);
          res.body.data.name.should.eql(DEVICE.name);
          res.body.data.type.should.eql(DEVICE.type);
          res.body.data.code.should.eql(DEVICE.code);
          done();
        });
    });

  // 根据设备主键获取设备
  it('should be get device ', (done) => {
    request
      .get(`/my/devices/${DEVICE.uuid}`)
      .expect(200)
      .set('Authorization', token)
      .then((res) => {
        res.body.success.should.be.equal(true);
        res.body.data.name.should.eql(DEVICE.name);
        res.body.data.type.should.eql(DEVICE.type);
        res.body.data.code.should.eql(DEVICE.code);
        res.body.data.connections.should.eql(DEVICE.connections);
        res.body.data.settings.should.eql(DEVICE.settings);
        done();
      });
  });

    // 启动设备
    it('should be started of the device', (done) => {
      request
        .put(`/my/devices/${DEVICE.uuid}/start`)
        .expect(200)
        .set('Authorization', token)
        .send(LOG)
        .then((res) => {
          res.body.success.should.be.equal(true);
          Should.exist(res.body.data);
          done();
        });
    });

  // 停止设备
  it('should be stop of the device', (done) => {
    request
      .put(`/my/devices/${DEVICE.uuid}/stop`)
      .expect(200)
      .send({
        end_time: Date.now(),
      })
      .set('Authorization', token)
      .then((res) => {
        res.body.success.should.be.equal(true);
        done();
      });
  });

    // 根据关键字，设备名称，启动时间区间获取设备运行记录列表
    it('should be get logs list by device_name', (done) => {
      request
        .get(`/my/logs/list/1?keyword=${DEVICE.name}&size=30`)
        .expect(200)
        .set('Authorization', token)
        .then((res) => {
          res.body.success.should.be.equal(true);
          Should.exist(res.body.data);
         // res.body.data.count.should.eql(1);
          done();
        });
    });

  // 根据设备主键获取设备运行记录信息列表
  it('should be get log list by deviceid', (done) => {
    request
      .get(`/my/devices/${DEVICE.uuid}/logs/list/1?size=30`)
      .expect(200)
      .set('Authorization', token)
      .then((res) => {
        res.body.success.should.be.equal(true);
        Should.exist(res.body.data);
        // res.body.data.count.should.eql(1);
        done();
      });
  });

    // 根据关键字设备名称获取设备列表
    it('should be get all device list by name', (done) => {
      request
        .get(`/my/devices/list/1?keyword=${DEVICE.name}&size=30`)
        .expect(200)
        .set('Authorization', token)
        .then((res) => {
          res.body.success.should.be.equal(true);
          res.body.data.list[0].name.should.eql(DEVICE.name);
          res.body.data.list[0].type.should.eql(DEVICE.type);
          res.body.data.list[0].code.should.eql(DEVICE.code);
          res.body.data.list[0].connections.should.eql(DEVICE.connections);
          res.body.data.list[0].settings.should.eql(DEVICE.settings);
          done();
        });
    });

    // 删除设备
    it('should be deleted the devices(状态) ', (done) => {
      request
        .delete(`/my/devices/${DEVICE.uuid}`)
        .expect(200)
        .set('Authorization', token)
        .then((res) => {
          res.body.success.should.be.equal(true);
          done();
        });
    });

  // 同步设备列表
  it('should be sync devices ', (done) => {
    request
      .post('/my/devices/111/sync')
      .expect(200)
      .set('Authorization', token)
      .send({
        datas: [DEVICE1],
      })
      .then((res) => {
        res.body.success.should.be.equal(true);
        done();
      });
  });

    // 删除运行记录
    it('should be deleted the logs ', (done) => {
      request
        .delete(`/my/logs/${LOG.uuid}`)
        .expect(200)
        .set('Authorization', token)
        .then((res) => {
          res.body.success.should.be.equal(true);
          done();
        });
    });

    // 删除设备
    it('should be deleted the devices ', (done) => {
      request
        .delete(`/my/devices/delete/${DEVICE.uuid}`)
        .expect(200)
        .set('Authorization', token)
        .then((res) => {
          res.body.success.should.be.equal(true);
          done();
        });
    });

    // 删除快照
    it('should be deleted the devices_logs ', (done) => {
      request
        .delete(`/my/logs/devices/${DEVICE.uuid}`)
        .expect(200)
        .set('Authorization', token)
        .then((res) => {
          res.body.success.should.be.equal(true);
          done();
        });
    });
});

