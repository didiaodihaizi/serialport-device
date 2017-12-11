 import Should from 'should';
 import Request from 'supertest-as-promised';
 import app from '../../dist/app';
 const request = Request(app.instance.listen());

 describe('Index Routers', () => {
   let token = null;

  it('should be get echo', (done) => {
    request
      .get('/echo')
      .expect(200)
      .then((res) => {
        res.body.data.should.be.equal('::ffff:127.0.0.1');
        done();
      });
  });

  it('should be login', (done) => {
    request
      .post('/login')
      .expect(200)
      .then((res) => {
        Should.exist(res.body.data);
        token = res.body.data;
        done();
      });
  });

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
 });

