import axios from 'axios';

const instance = axios.create({
  // baseURL: 'http://172.30.114.248:3000',
  baseURL: 'http://127.0.0.1:3000',
  timeout: 10000,
});

export default {
  test() {
    return instance.get('/taxi/test');
  },
  login(id: string, pw: string) {
    return instance.post('/taxi/login', {userId: id, userPw: pw});
  },
  register(id: string, pw: string) {
    return instance.post('/taxi/register', {userId: id, userPw: pw});
  },
  list(id: string) {
    return instance.post('/taxi/list', {userId: id});
  },
  cancel(
    id: string,
    startLat: string,
    startLng: string,
    endLat: string,
    endLng: string,
  ) {
    return instance.post('/taxi/cancel', {
      userId: id,
      startLat: startLat,
      startLng: startLng,
      endLat: endLat,
      endLng: endLng,
    });
  },
  call(
    id: string,
    startLat: string,
    startLng: string,
    startAddr: string,
    endLat: string,
    endLng: string,
    endAddr: string,
  ) {
    return instance.post('/taxi/call', {
      userId: id,
      startLat: startLat,
      startLng: startLng,
      startAddr: startAddr,
      endLat: endLat,
      endLng: endLng,
      endAddr: endAddr,
    });
  },
  geoCoding(coords: any, key: string) {
    let url = 'https://maps.googleapis.com/maps/api/geocode/json';
    let lat = coords.latitude;
    let lng = coords.longitude;

    return axios.get(`${url}?latlng=${lat},${lng}&key=${key}&language=ko`);
  },
};
