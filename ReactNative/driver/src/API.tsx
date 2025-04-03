import axios from 'axios';

const instance = axios.create({
  // baseURL: 'http://172.30.114.248:3000',
  baseURL: 'http://127.0.0.1:3000',
  timeout: 10000,
});

export default {
  login(id: string, pw: string) {
    return instance.post('/driver/login', {userId: id, userPw: pw});
  },
  register(id: string, pw: string) {
    return instance.post('/driver/register', {userId: id, userPw: pw});
  },
  list(id: string) {
    return instance.post('/driver/list', {userId: id});
  },

  accept(driverId: string, callId: string) {
    return instance.post('/driver/accept', {
      driverId: driverId,
      callId: callId,
    });
  },
};
