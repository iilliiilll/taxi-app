var express = require('express');
var router = express.Router();

const db = require('../database/db_connect');
const admin = require('firebase-admin');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

// fcm 토큰 처리
const updateFcm = (fcmToken, table, idColName, id) => {
    const queryStr = `UPDATE ${table} SET fcm_token="${fcmToken}" WHERE ${idColName}="${id}"`;
    console.log('>> updateFcm / queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (err) {
            console.log('updateFcm / err : ' + JSON.stringify(err));
        }
    });
};

// 기사에게 알람
const sendPushToAlldriver = () => {
    let queryStr = `SELECT fcm_token from tb_driver`;

    console.log('>> queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            for (row of rows) {
                console.log('allDriver - fcm_token = ' + row.fcm_token);
                if (row.fcm_token) {
                    sendFcm(row.fcm_token, '배차 요청이 있습니다.');
                }
            }
        }
    });
};

// 손님에게 알람
const sendPushToUser = (userId) => {
    let queryStr = `SELECT fcm_token FROM tb_user WHERE user_id="${userId}"`;
    console.log('>> push user - queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('>> push user - rows = ' + JSON.stringify(rows));
            if (Object.keys(rows).length > 0 && rows[0].fcm_token) {
                sendFcm(rows[0].fcm_token, '배차가 완료되었습니다.');
            } else {
                console.log('Push 전송 실패');
            }
        } else {
            console.log('> push user - err : ' + err);
        }
    });
};

// 테스트
router.get('/taxi/test', function (req, res, next) {
    db.query('select * from tb_user', (err, rows, fields) => {
        if (!err) {
            console.log('test / rows = ' + JSON.stringify(rows));
            res.json([{ code: 0, data: rows }]);
        } else {
            console.log('test / err:  ' + err);
            res.json([{ code: 1, data: err }]);
        }
    });
});

// 로그인
router.post('/taxi/login', function (req, res, next) {
    console.log('login / req.body ' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    let queryStr = `select * from tb_user where user_id = "${userId}" and user_pw = "${userPw}"`;
    console.log('login / queryStr = ' + queryStr);

    db.query(queryStr, (err, rows, fields) => {
        if (!err) {
            console.log('login / rows = ' + JSON.stringify(rows));
            let len = Object.keys(rows).length;
            console.log('login / len = ' + len);
            let code = len == 0 ? 1 : 0;
            let message = len == 0 ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';

            if (code == 0) {
                updateFcm(fcmToken, 'tb_user', 'user_id', userId);
            }

            res.json([{ code: code, message: message }]);
        } else {
            console.log('login / err : ' + err);
            res.json([{ code: 1, message: err }]);
        }
    });
});

// 회원가입
router.post('/taxi/register', function (req, res) {
    console.log('register / req.body ' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    console.log('register / userId = ' + userId + ', userPw = ' + userPw);

    if (!(userId && userPw)) {
        res.json([{ code: 1, message: '아이디 또는 비밀번호가 없습니다.' }]);
        return;
    }

    let queryStr = `insert into tb_user values ("${userId}", "${userPw}", "${fcmToken}")`;
    console.log('register / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('register / rows = ' + JSON.stringify(rows));
            res.json([{ code: 0, message: '회원가입이 완료되었습니다.' }]);
        } else {
            console.log('register / err : ' + JSON.stringify(err));
            if (err.code == 'ER_DUP_ENTRY') {
                res.json([{ code: 2, message: '이미 등록된 ID입니다.' }]);
            } else {
                res.json([{ code: 3, message: '알 수 없는 오류가 발생하였습니다.', data: err }]);
            }
        }
    });
});

// 배차 리스트
router.post('/taxi/list', function (req, res) {
    console.log('list / req.body = ' + JSON.stringify(req.body));
    let userId = req.body.userId; // 1. userId 가져오기
    console.log('list / userId = ' + userId);

    let queryStr = `select * from tb_call where user_id = "${userId}" order by id desc`; // 2. query문 작성
    console.log('list / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        // 3. db에 query문 적용
        if (!err) {
            // 3-1. 에러가 없다면
            console.log('list / rows = ' + JSON.stringify(rows));

            rows = rows.map((row) => {
                const requestTime = new Date(row.request_time);
                const today = new Date();
                const isToday = requestTime.toDateString() === today.toDateString();

                const formattedDate = requestTime.toISOString().split('T')[0]; // YYYY-MM-DD
                const formattedTime = requestTime.toTimeString().split(' ')[0].slice(0, 5); // HH:mm

                row.formatted_time = isToday ? formattedTime : formattedDate;

                console.log('=================== requestTime: ', requestTime);
                console.log('=================== today : ', today);
                console.log('=================== formattedDate : ', formattedDate);
                console.log('=================== formattedTime : ', formattedTime);
                console.log('=================== isToday: ', isToday);
                console.log('=================== formatted time: ', row.formatted_time);

                return row;
            });

            res.json([{ code: 0, message: '택시 호출 목록 호출 성공', data: rows }]);
        } else {
            // 3-2. 에러가 있다면
            console.log('err : ' + err);
            res.json([{ code: 1, message: '알 수 없는 오류가 발생하였습니다.', data: err }]);
        }
    });
});

// 택시 콜
router.post('/taxi/call', function (req, res) {
    console.log('call / req.body' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let startAddr = req.body.startAddr;
    let startLat = req.body.startLat;
    let startLng = req.body.startLng;
    let endAddr = req.body.endAddr;
    let endLat = req.body.endLat;
    let endLng = req.body.endLng;

    if (!(userId && startAddr && startLat && startLng && endAddr && endLat && endLng)) {
        // 하나라도 빠졌다면
        res.json([{ code: 1, message: '출발지 또는 도착지 정보가 없습니다.' }]);
        return;
    }

    let queryStr = `insert into tb_call values(NULL, "${userId}", 
    "${startLat}", "${startLng}", "${startAddr}", 
    "${endLat}", "${endLng}", "${endAddr}",
     "REQ", "", CURRENT_TIMESTAMP)`;

    console.log('call / queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('call / rows = ' + JSON.stringify(rows));

            sendPushToAlldriver();

            res.json([{ code: 0, message: '택시 호출이 완료되었습니다.' }]);
        } else {
            console.log('call / err : ' + JSON.stringify(err));
            res.json([{ code: 2, message: '택시 호출이 실패했습니다.', data: err }]);
        }
    });
});

// 택시 콜 취소
router.post('/taxi/cancel', function (req, res) {
    console.log('cancel / req.body' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let startLat = req.body.startLat;
    let startLng = req.body.startLng;
    let endLat = req.body.endLat;
    let endLng = req.body.endLng;

    if (!(userId && startLat && startLng && endLat && endLng)) {
        // 하나라도 빠졌다면
        res.json([{ code: 1, message: '출발지 또는 도착지 정보가 없습니다.' }]);
        return;
    }

    let queryStr = `DELETE FROM tb_call WHERE (
    user_id = '${userId}' AND
    start_lat = ${startLat} AND 
    start_lng = ${startLng} AND 
    end_lat = ${endLat} AND 
    end_lng = ${endLng} 
    )`;

    console.log('cancel / queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('cancel / rows = ' + JSON.stringify(rows));

            res.json([{ code: 0, message: '택시 호출을 취소하였습니다.' }]);
        } else {
            console.log('cancel / err : ' + JSON.stringify(err));
            res.json([{ code: 2, message: '택시 호출을 취소하지 못했습니다.', data: err }]);
        }
    });
});

// 드라이버 --------------------------------------------------
// 회원가입
router.post('/driver/register', function (req, res) {
    console.log('driver-register / req.body ' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    console.log('driver-register / userId = ' + userId + ', userPw = ' + userPw);

    if (!(userId && userPw)) {
        res.json([{ code: 1, message: '아이디 또는 비밀번호가 없습니다.' }]);
        return;
    }

    let queryStr = `INSERT INTO tb_driver VALUES("${userId}", "${userPw}", "${fcmToken}")`;
    console.log('driver-register / queryStr = ' + queryStr);

    db.query(queryStr, function (err, rows, ffields) {
        if (!err) {
            console.log('driver-register / rows = ' + JSON.stringify(rows));
            res.json([{ code: 0, message: '회원가입이 완료되었습니다.' }]);
        } else {
            console.log('driver-register / err : ' + JSON.stringify(err));
            if (err.code == 'ER_DUP_ENTRY') {
                res.json([{ code: 2, message: '이미 등록된 ID입니다.' }]);
            } else {
                res.json([{ code: 3, message: '알 수 없는 오류가 발생하였습니다.', data: err }]);
            }
        }
    });
});

// 로그인
router.post('/driver/login', function (req, res) {
    console.log('driver-login / req.body = ' + JSON.stringify(req.body));

    let userId = req.body.userId;
    let userPw = req.body.userPw;
    let fcmToken = req.body.fcmToken || '';

    let queryStr = `SELECT * FROM tb_driver WHERE driver_id="${userId}" AND driver_pw="${userPw}"`;
    console.log('driver-login / queryStr = ' + queryStr);
    db.query(queryStr, (err, rows, fields) => {
        if (!err) {
            console.log('driver-login / rows = ' + JSON.stringify(rows));
            let len = Object.keys(rows).length;
            console.log('driver-login / len = ' + len);
            let code = len == 0 ? 1 : 0;
            let message = len == 0 ? '아이디 또는 비밀번호가 잘못 입력되었습니다.' : '로그인 성공';

            if (code == 0) {
                updateFcm(fcmToken, 'tb_driver', 'driver_id', userId);
            }

            res.json([{ code: code, message: message }]);
        } else {
            console.log('driver-login / err : ' + err);
            res.json([{ code: 1, message: err }]);
        }
    });
});

// 배차 리스트
router.post('/driver/list', function (req, res) {
    console.log('driver-list / req.body = ' + JSON.stringify(req.body));

    let userId = req.body.userId;

    console.log('driver-list / userId = ' + userId);

    let queryStr = `SELECT * FROM tb_call WHERE driver_id="${userId}" OR call_state="REQ" ORDER BY id DESC`;

    console.log('driver-list / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fieldds) {
        if (!err) {
            console.log('driver-list / rows = ' + JSON.stringify(rows));
            res.json([{ code: 0, message: '택시 호출 목록 호출 성공', data: rows }]);
        } else {
            console.log('driver-list / err : ' + err);
            res.json([{ code: 1, message: '알 수 없는 오류가 발생하였습니다.', data: err }]);
        }
    });
});

// 배차 수락
router.post('/driver/accept', function (req, res) {
    console.log('driver-accept / req.body = ' + JSON.stringify(req.body));

    let callId = req.body.callId;
    let driverId = req.body.driverId;
    let userId = req.body.userId;

    console.log('driver-accept / callId = ' + callId + ', driverId = ' + driverId);

    if (!(callId && driverId)) {
        res.json([{ code: 1, message: 'callId 또는 driverId가 없습니다.' }]);
        return;
    }

    let queryStr = `UPDATE tb_call SET driver_id="${driverId}", call_state="RES" WHERE id=${callId}`;
    console.log('driver-accept / queryStr = ' + queryStr);
    db.query(queryStr, function (err, rows, fields) {
        if (!err) {
            console.log('driver-accept / rows = ' + JSON.stringify(rows));
            if (rows.affectedRows > 0) {
                sendPushToUser(userId);
                res.json([{ code: 0, message: '배차가 완료되었습니다.' }]);
            } else {
                res.json([{ code: 2, message: '이미 완료되었거나 존재하지 않는 콜입니다.' }]);
            }
        } else {
            console.log('driver-accept / err : ' + JSON.stringify(err));
            res.json([{ code: 3, message: '알 수 없는 오류가 발생하였습니다.', data: err }]);
        }
    });
});

// 푸시 테스트
router.post('/push/text', function (req, res, next) {
    console.log('push-test / req.body = ' + JSON.stringify(req.body));

    let fcmToken = req.body.fcmToken;
    let message = req.body.message;

    sendFcm(fcmToken, message);

    res.json([{ code: 0, message: '푸시 테스트' }]);
});

// 알림 보내기
const sendFcm = (fcmToken, msg) => {
    const message = { notification: { title: '알림', body: msg }, token: fcmToken };

    admin
        .messaging()
        .send(message)
        .then((response) => {
            console.log('-- push 성공');
        })
        .catch((error) => {
            console.log('-- push error / ' + JSON.stringify(error));
        });
};

module.exports = router;
