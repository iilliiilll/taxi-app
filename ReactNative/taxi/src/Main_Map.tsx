import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import {useState, useRef} from 'react';
import MapView, {PROVIDER_GOOGLE, Marker, Polyline} from 'react-native-maps';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import api from './API';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {StackNavigationProp} from '@react-navigation/stack';
import {useNavigation, ParamListBase} from '@react-navigation/native';
import 'react-native-get-random-values';

function Main_Map() {
  console.log('-- Main_Map()');

  const navigation = useNavigation<StackNavigationProp<ParamListBase>>();

  // 택시 호출 -----------------------------------------------
  const callTaxi = async () => {
    let userId = (await AsyncStorage.getItem('userId')) || '';
    let startAddr = autoComplete1.current.getAddressText();
    let endAddr = autoComplete2.current.getAddressText();

    let startLat = `${marker1.latitude}`;
    let startLng = `${marker1.longitude}`;
    let endLat = `${marker2.latitude}`;
    let endLng = `${marker2.longitude}`;

    if (!(startAddr && endAddr)) {
      Alert.alert('알림', '출발지/도착지가 모두 입력되어야 합니다.', [
        {text: '확인', style: 'cancel'},
      ]);
      return;
    }

    api
      .call(userId, startLat, startLng, startAddr, endLat, endLng, endAddr)
      .then(response => {
        let {code, message} = response.data[0];
        let title = '알림';

        if (code == 0) {
          navigation.navigate('Main_List');
        } else {
          title = '오류';
        }

        Alert.alert(title, message, [{text: '확인', style: 'cancel'}]);
      })
      .catch(err => {
        console.log(JSON.stringify(err));
      });
  };

  const [loading, setLoading] = useState(false);
  const [selectedLatLng, setSelectedLatLng] = useState({
    latitude: 0,
    longitude: 0,
  });
  const [selectedAddress, setSelectedAddress] = useState('');

  const mapRef: any = useRef(null);

  const [initialRegion, setInitialRegion] = useState({
    latitude: 37.5666612,
    longitude: 126.9783785,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [showBtn, setShowBtn] = useState(false);

  // 길게 누르기 -----------------------------------------------------
  const handleLongPress = async (event: any) => {
    const {coordinate} = event.nativeEvent;

    setSelectedLatLng(coordinate);

    setLoading(true);
    api
      .geoCoding(coordinate, query.key)
      .then(response => {
        setSelectedAddress(response.data.results[0].formatted_address);
        setShowBtn(true);
        setLoading(false);
      })
      .catch(err => {
        console.log(JSON.stringify(err));
        setLoading(false);
      });
  };

  const autoComplete1: any = useRef(null);
  const autoComplete2: any = useRef(null);

  // 마커 추가 ----------------------------------------------------
  const handleAddMarker = (title: string) => {
    if (selectedAddress) {
      if (title == '출발지') {
        setMarker1(selectedLatLng);
        if (autoComplete1.current) {
          autoComplete1.current.setAddressText(selectedAddress);
        }
      } else {
        setMarker2(selectedLatLng);
        if (autoComplete2.current) {
          autoComplete2.current.setAddressText(selectedAddress);
        }
      }
      setShowBtn(false);
    }
  };

  // 쿼리 ------------------------------------------
  let query = {
    key: '',
    language: 'ko',
    region: 'KR',
    types: 'geocode',
  };

  const [marker1, setMarker1] = useState({latitude: 0, longitude: 0});
  const [marker2, setMarker2] = useState({latitude: 0, longitude: 0});

  const onSelectAddr = (data: any, details: any, type: string) => {
    if (details) {
      let lat = details.geometry.location.lat;
      let lng = details.geometry.location.lng;

      if (type == 'start') {
        setMarker1({latitude: lat, longitude: lng});
        if (marker2.longitude == 0) {
          setInitialRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0073,
            longitudeDelta: 0.0064,
          });
        }
      } else {
        setMarker2({latitude: lat, longitude: lng});
        if (marker1.longitude == 0) {
          setInitialRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.0073,
            longitudeDelta: 0.0064,
          });
        }
      }
    }
  };

  if (marker1.latitude != 0 && marker2.latitude != 0) {
    if (mapRef.current) {
      mapRef.current.fitToCoordinates([marker1, marker2], {
        edgePadding: {top: 120, right: 50, bottom: 50, left: 50},
        animated: true,
      });
    }
  }

  const setMyLocation = () => {
    setLoading(true);

    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;

        let coords = {latitude, longitude};
        setMarker1(coords);
        setInitialRegion({
          latitude: 0,
          longitude: 0,
          latitudeDelta: 0,
          longitudeDelta: 0,
        });
        setInitialRegion({
          latitude: latitude,
          longitude: longitude,
          latitudeDelta: 0.0073,
          longitudeDelta: 0.0064,
        });

        api
          .geoCoding(coords, query.key)
          .then(response => {
            let addr = response.data.results[0].formatted_address;
            autoComplete1.current.setAddressText(addr);
            setLoading(false);
          })
          .catch(err => {
            console.log(JSON.stringify(err));
            setLoading(false);
          });
      },
      error => {
        console.log('Geolocation 오류 / error = ' + JSON.stringify(error));
      },
      {
        enableHighAccuracy: false,
        timeout: 100000,
        maximumAge: 1000,
      },
    );
  };

  // return ===================================================================================
  return (
    <SafeAreaView style={styles.container}>
      {/* 지도 */}
      <MapView
        style={styles.container}
        provider={PROVIDER_GOOGLE}
        region={initialRegion}
        ref={mapRef}
        onLongPress={handleLongPress}
        onPress={() => {
          setShowBtn(false);
        }}>
        <Marker coordinate={marker1} title="출발 위치" />
        <Marker coordinate={marker2} title="도착 위치" pinColor="blue" />

        {marker1.latitude != 0 && marker2.latitude != 0 && (
          <Polyline
            coordinates={[marker1, marker2]}
            strokeColor="blue"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          padding: 10,
        }}>
        <View style={{position: 'absolute', padding: wp(2)}}>
          <View style={{width: wp(75)}}>
            <GooglePlacesAutocomplete
              ref={autoComplete1}
              predefinedPlaces={[]}
              minLength={2}
              placeholder="출발지 검색"
              query={query}
              keyboardShouldPersistTaps={'handled'}
              fetchDetails={true}
              enablePoweredByContainer={false}
              onFail={error => console.log(error)}
              onNotFound={() => console.log('no results')}
              styles={autocompleteStyles}
              onPress={(data, details) => onSelectAddr(data, details, 'start')}
              textInputProps={{
                onFocus: () => {},
                onBlur: () => {},
              }}
              requestUrl={{
                url: `https://places.googleapis.com/maps/api/place/autocomplete/json?key=${query.key}&language=ko&region=KR&types=geocode`,
                useOnPlatform: 'all',
              }}
            />
          </View>
          <View style={{width: wp(75)}}>
            <GooglePlacesAutocomplete
              ref={autoComplete2}
              predefinedPlaces={[]}
              minLength={2}
              placeholder="도착지 검색"
              query={query}
              keyboardShouldPersistTaps={'handled'}
              fetchDetails={true}
              enablePoweredByContainer={false}
              onFail={error => console.log(error)}
              onNotFound={() => console.log('no results')}
              styles={autocompleteStyles}
              onPress={(data, details) => onSelectAddr(data, details, 'end')}
              textInputProps={{
                onFocus: () => {},
                onBlur: () => {},
              }}
              requestUrl={{
                url: `https://places.googleapis.com/maps/api/place/autocomplete/json?key=${query.key}&language=ko&region=KR&types=geocode`,
                useOnPlatform: 'all',
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            {
              position: 'absolute',
              width: wp(18),
              top: wp(2),
              right: wp(2),
              height: 90,
              justifyContent: 'center',
            },
          ]}
          onPress={callTaxi}>
          <Text style={styles.buttonText}>호출</Text>
        </TouchableOpacity>
      </View>

      {/* 내 위치 */}
      <TouchableOpacity
        style={[{position: 'absolute', bottom: 20, right: 20}]}
        onPress={setMyLocation}>
        <Icon name="crosshairs" size={40} color={'#3498db'} />
      </TouchableOpacity>

      {showBtn && (
        <View
          style={{
            position: 'absolute',
            top: hp(50) - 45,
            left: wp(50) - 75,
            height: 90,
            width: 150,
          }}>
          <TouchableOpacity
            style={[styles.button, {flex: 1, marginVertical: 1}]}
            onPress={() => handleAddMarker('출발지')}>
            <Text style={styles.buttonText}>출발지로 등록</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, {flex: 1}]}
            onPress={() => handleAddMarker('도착지')}>
            <Text style={styles.buttonText}>도착지로 등록</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal transparent={true} visible={loading}>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Icon name="spinner" size={50} color="blue" />
          <Text style={{backgroundColor: 'white', color: 'black', height: 20}}>
            Loading...
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// style =============================================================================
const autocompleteStyles = StyleSheet.create({
  textInputContainer: {
    width: '100%',
    backgroundColor: '#e9e9e9',
    borderRadius: 8,
    height: 40,
  },
  textInput: {
    height: 40,
    color: '#5d5d5d',
    fontSize: 16,
  },
  predefinedPlacesDescription: {
    color: '#1faadb',
    zIndex: 1,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonDisable: {
    backgroundColor: 'gray',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderWidth: 2,
    borderColor: 'gray',
    marginVertical: 1,
    padding: 10,
  },
});

export default Main_Map;
