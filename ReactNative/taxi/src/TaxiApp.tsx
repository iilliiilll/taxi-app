import {SafeAreaView, StyleSheet, Text, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import messaging from '@react-native-firebase/messaging';
import {
  getMessaging,
  getToken,
  onMessage,
  setBackgroundMessageHandler,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import {getApp} from '@react-native-firebase/app';

import Intro from './Intro';
import Main from './Main';
import Login from './Login';
import Register from './Register';
import NickNameScreen from './Main_Setting_NickName';

// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log('[Background Remote Message]', remoteMessage);
// });
setBackgroundMessageHandler(getMessaging(getApp()), async remoteMessage => {
  console.log('[Background Remote Message]', remoteMessage);
});

function TaxiApp() {
  console.log('-- TaxiApp()');

  const Stack = createStackNavigator();

  // =======================================================================
  const requestNotificationPermission = async () => {
    const authStatus = await requestPermission(getMessaging(getApp()));

    if (authStatus === AuthorizationStatus.AUTHORIZED) {
      console.log('알림 권한이 허용되었습니다.');
    } else if (authStatus === AuthorizationStatus.PROVISIONAL) {
      console.log('알림 권한이 임시로 허용되었습니다.');
    } else {
      console.warn('알림 권한이 거부되었습니다.');
    }
  };
  // =======================================================================
  const getFcmToken = async () => {
    const messaging = getMessaging(getApp());
    const fcmToken = await getToken(messaging);

    if (fcmToken) {
      await AsyncStorage.setItem('fcmToken', fcmToken);
      console.log('>> fcmToken = ' + fcmToken);
    } else {
      console.warn('FCM 토큰을 생성하지 못했습니다.');
    }
  };

  // =======================================================================
  useEffect(() => {
    requestNotificationPermission();
    getFcmToken();

    // ✅ 최신 방식으로 변경
    onMessage(getMessaging(getApp()), remoteMessage => {
      console.log('[Remote Message] ', JSON.stringify(remoteMessage));

      let title = remoteMessage.notification?.title || '';
      let body = remoteMessage.notification?.body || '';

      if (remoteMessage) {
        Alert.alert(title, body, [{text: '확인', style: 'cancel'}]);
      }
    });
  }, []);
  // =======================================================================

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Intro"
          component={Intro}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Login"
          component={Login}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Register"
          component={Register}
          options={{headerShown: true, title: '회원가입'}}
        />
        <Stack.Screen
          name="Main"
          component={Main}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="NickName"
          component={NickNameScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  textBlack: {
    fontSize: 18,
    color: 'black',
  },
  textBlue: {
    fontSize: 18,
    color: 'blue',
  },
});

export default TaxiApp;
