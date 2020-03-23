import React, {useEffect} from 'react';
import moment from 'moment';

import {
  Alert,
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

let today = moment();

let date = today.date();
if (date < 10) {
  date = '0' + date;
}
let month = today.month() + 1;
if (month < 10) {
  month = '0' + month;
}
let year = today.year();
let start = year + '-' + month + '-' + date;

let tomorrow = moment();
tomorrow.add(1, 'days');

let date_end = tomorrow.date();
if (date_end < 10) {
  date_end = '0' + date_end;
}
let month_end = tomorrow.month() + 1;
if (month_end < 10) {
  month_end = '0' + month_end;
}
let year_end = tomorrow.year();
let end = year_end + '-' + month_end + '-' + date_end;

const PURCHASE_GET_URL =
  `http://saladetomateoignons.ddns.net/api/purshases?deliveryHour[before]=${end}&deliveryHour[after]=${start}`;

function refresh(context) {
  axios.get(PURCHASE_GET_URL).then(res => {
    let body = res.data['hydra:member'];
    context.setState({purchases: sortAndFilterList(body)});
    context.setState({
      refresh: !context.state.refresh,
    });
  });
}

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

function Item({avatar_url, subtitle, navigation, item, context}) {
  if (item.trustScore < 5) {
    avatar_url = 'http://saladetomateoignons.ddns.net/images/red_score.png';
  } else if (item.trustScore < 8) {
    avatar_url = 'http://saladetomateoignons.ddns.net/images/orange_score.png';
  } else {
    avatar_url = 'http://saladetomateoignons.ddns.net/images/green_score.png';
  }
  return (
    <TouchableHighlight
      onPress={() =>
        navigation.navigate('PurchaseDetail', {
          item: item,
          onGoBack: () => refresh(context),
        })
      }>
      <ListItem
        key={`key-${item.id}`}
        title={`${item.user.firstname} ${item.user.lastname} - ${formatDate(
          item.deliveryHour,
        )} `}
        leftAvatar={{
          source: avatar_url && {uri: avatar_url},
          title: item.user.firstname,
        }}
        subtitle={`Passée à ${formatDate(item.date)}`}
      />
    </TouchableHighlight>
  );
}

function isToday(date) {
  const today = new Date();
  return (
    date.getDate() == today.getDate() &&
    date.getMonth() == today.getMonth() &&
    date.getFullYear() == today.getFullYear()
  );
}

function sortAndFilterList(list) {
  let filtered = list.filter(function(purchase) {
    let statusOk =
      purchase.status !== 'delivered' && purchase.status !== 'canceled';
    let dayOk = isToday(new Date(purchase.date));
    console.log(dayOk);
    return statusOk && dayOk;
  });

  let sorted = filtered.sort(function(a, b) {
    return new Date(a.deliveryHour) - new Date(b.deliveryHour);
  });

  return sorted;
}

export default class PurchasesList extends React.Component {
  state = {
    purchases: [],
    refresh: false,
  };

  constructor() {
    console.log(PURCHASE_GET_URL);
    super();
  }

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

    firebase.messaging().onMessage(payload => {
      Alert.alert(
        'Nouvelle Commande !',
        'Mettre à jour la liste ?',
        [
          {
            text: 'Non',
            onPress: () => {
              console.log('cancel');
            },
            style: 'cancel',
          },
          {
            text: 'Oui',
            onPress: () => {
              axios.get(PURCHASE_GET_URL).then(res => {
                let body = res.data['hydra:member'];
                this.setState({purchases: sortAndFilterList(body)});
                this.setState({
                  refresh: !this.state.refresh,
                });
              });
            },
          },
        ],
        {cancelable: false},
      );
    });
  };

  componentDidMount() {
    axios.get(PURCHASE_GET_URL).then(res => {
      let body = res.data['hydra:member'];
      this.setState({purchases: sortAndFilterList(body)});
    });
    this.registerForPushNotificationsAsync();
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        {
          <FlatList
            data={this.state.purchases}
            refreshing={this.state.refresh}
            renderItem={({item}) => (
              <Item
                avatar_url={''}
                navigation={this.props.navigation}
                context={this}
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
