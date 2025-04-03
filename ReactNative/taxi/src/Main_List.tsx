import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useState} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './API';

function Main_List() {
  console.log('-- Main_List()');

  const [callList, setCallList] = useState([]);
  const [loading, setLoading] = useState(false);

  // 택시 취소 ==================================================
  const cancelTaxi = () => {
    Alert.alert('취소', '배차를 취소하였습니다.', [
      {
        text: '확인',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
    ]);
  };

  useFocusEffect(
    React.useCallback(() => {
      requestCallList();
    }, []),
  );

  const requestCallList = async () => {
    setLoading(true);

    let userId = (await AsyncStorage.getItem('userId')) || '';

    api
      .list(userId)
      .then(response => {
        let {code, message, data} = response.data[0];
        if (code == 0) {
          setCallList(data);
        } else {
          Alert.alert('오류', message, [
            {
              text: '확인',
              onPress: () => console.log('cancel pressed'),
              style: 'cancel',
            },
          ]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        setLoading(false);
      });
  };

  const Header = () => (
    <View style={styles.header}>
      <Text style={[styles.headerText, {width: wp(80)}]}>출발지 / 도착지</Text>
      <Text style={[styles.headerText, {width: wp(20)}]}>상태</Text>
    </View>
  );

  const ListItem = (row: any) => {
    console.log('row = ' + JSON.stringify(row));

    return (
      <View style={{flexDirection: 'row', marginBottom: 30, width: wp(100)}}>
        <View style={{width: wp(80)}}>
          <Text style={styles.textForm}>{row.item.start_addr}</Text>
          <Text style={[styles.textForm, {borderTopWidth: 0}]}>
            {row.item.end_addr}
          </Text>
          <Text style={styles.textForm}>{row.item.formatted_time}</Text>
        </View>
        <View
          style={{
            width: wp(20),
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>{row.item.call_state}</Text>
          {/* 취소 버튼 ============================================ */}
          {row.item.call_state === 'REQ' && (
            <TouchableOpacity style={styles.button} onPress={cancelTaxi}>
              <Text style={styles.button}>취소</Text>
            </TouchableOpacity>
          )}
          {/* 취소 버튼 ============================================ */}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        style={{flex: 1}}
        data={callList}
        ListHeaderComponent={Header}
        renderItem={ListItem}
        keyExtractor={(item: any) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={requestCallList} />
        }
      />

      <Modal transparent={true} visible={loading}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Icon name="spinner" size={50} color={'#3498db'} />
          <Text style={{color: 'black'}}>Loading...</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// styles =============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    height: 50,
    marginBottom: 5,
    backgroundColor: '#3498db',
    color: 'white',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'white',
  },
  textForm: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#3498db',
    height: hp(5),
    paddingLeft: 10,
    paddingRight: 10,
  },
  button: {
    backgroundColor: '#f44',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Main_List;
