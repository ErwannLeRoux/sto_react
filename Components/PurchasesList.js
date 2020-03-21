import React, {useEffect} from 'react';
import {
  Text,
  TouchableHighlight,
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {List, ListItem, SearchBar} from 'react-native-elements';
import axios from 'axios';
import {firebase, messaging} from '@react-native-firebase/messaging';

const PUSH_ENDPOINT = 'http://saladetomateoignons.ddns.net/api/push_tokens';

const firebaseConfig = {
  apiKey: 'AIzaSyDxmzPK1-Qcn5CeBw9yXks4BI5EUb0v5r4',
  authDomain: 'saladetomateoignons-28252.firebaseapp.com',
  databaseURL: 'https://saladetomateoignons-28252.firebaseio.com',
  storageBucket: 'saladetomateoignons-28252.appspot.com',
  projectId: 'saladetomateoignons-28252',
  messagingSenderId: '425188071045',
  appId: '1:425188071045:android:5cf5097d60c98fb6177bec',
};

function formatDate(dateStr) {
  let date = new Date(dateStr);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  if (hours < 10) {
    hours = '0' + hours;
  }

  return `${hours}h${minutes}`;
}

function Item({avatar_url, subtitle, navigation, item}) {
  if (item.trustScore < 5) {
    avatar_url = 'http://saladetomateoignons.ddns.net/images/red_score.png';
  } else if (item.trustScore < 8) {
    avatar_url = 'http://saladetomateoignons.ddns.net/images/orange_score.png';
  } else {
    avatar_url = 'http://saladetomateoignons.ddns.net/images/green_score.png';
  }
  return (
    <TouchableHighlight
      onPress={() => navigation.navigate('PurchaseDetail', item)}>
      <ListItem
        key={`key-${item.id}`}
        title={`${item.user.firstname} ${item.user.lastname} - ${formatDate(
          item.date,
        )} `}
        leftAvatar={{
          source: avatar_url && {uri: avatar_url},
          title: item.user.firstname,
        }}
        subtitle={`Indice de confiance ${item.trustScore}/10`}
      />
    </TouchableHighlight>
  );
}

export default class PurchasesList extends React.Component {
  state = {
    purchases: [],
  };

  onPress = () => {
    this.props.navigation.navigate('PurchaseDetail');
  };

  registerForPushNotificationsAsync = async () => {
    if (!firebase.apps.length) {
      firebase.initializeApp({});
    }
    const fcmToken = await firebase.messaging().getToken();

    axios
      .get(PUSH_ENDPOINT)
      .then(function(res) {
        let tokens = res.data['hydra:member'];
        let result = tokens.filter(token => {
          return token.tokenStr === fcmToken;
        });

        if (result.length == 0) {
          axios
            .post(PUSH_ENDPOINT, {
              tokenStr: fcmToken,
            })
            .then(function(response) {
              // nothing
            })
            .catch(function(error) {
              console.error(error);
            });
        }
      })
      .catch(console.error);

    firebase.messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Message handled in the background!', remoteMessage);
    });

    firebase.messaging().onMessage(payload => {
      console.log('Message received. ', payload);
    });
  };

  componentDidMount() {
    axios.get('http://saladetomateoignons.ddns.net/api/purshases').then(res => {
      let body = res.data['hydra:member'];
      let promises = [];

      // fetch associated user
      body.forEach(purshase => {
        let promise = axios
          .get(`http://saladetomateoignons.ddns.net${purshase.user}`)
          .then(user => {
            purshase.user = {
              id: user.data.DiscordID,
              firstname: user.data.firstname,
              lastname: user.data.lastname,
              phone: user.data.phone,
            };
          });

        promises.push(promise);
      });

      Promise.all(promises).then(() => {
        this.setState({purchases: body});
      });
    });
    this.registerForPushNotificationsAsync();
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        {
          <FlatList
            data={this.state.purchases}
            renderItem={({item}) => (
              <Item
                avatar_url={""}
                navigation={this.props.navigation}
                item={item}
              />
            )}
            keyExtractor={item => `key-${item.id}`}
          />
        }
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
});
