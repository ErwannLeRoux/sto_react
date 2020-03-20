import React from 'react';
import { Text, TouchableHighlight, SafeAreaView, View, FlatList, StyleSheet, ActivityIndicator  } from 'react-native';
import { List, ListItem, SearchBar } from 'react-native-elements';
//import { Notifications } from 'expo';
//import * as Permissions from 'expo-permissions';
import axios from 'axios';
//import Constants from 'expo-constants';

const PUSH_ENDPOINT = 'http://saladetomateoignons.ddns.net/api/push_tokens';

function formatDate(dateStr) {
  let date = new Date(dateStr);
  let hours = date.getHours();
  let minutes = date.getMinutes();
  if(minutes < 10) {
    minutes = "0"+minutes;
  }
  if(hours < 10) {
    hours = "0"+hours;
  }

  return `${hours}h${minutes}`;
}

function Item({avatar_url, subtitle, navigation, item}) {
    return (
        <TouchableHighlight onPress={() => navigation.navigate('PurchaseDetail', item)}>
            <ListItem
                key={`key-${item.id}`}
                title={`${formatDate(item.date)} ${item["user"].firstname} ${item["user"].lastname}`}
                leftAvatar={{
                    source: avatar_url && { uri: avatar_url },
                    title: item["user"].firstname
                }}
                subtitle={subtitle}
            />
        </TouchableHighlight>
    );
}

export default class PurchasesList extends React.Component {
    state = {
        purchases: [],
        kebab_url: "https://www.snackdelmondo.com/binary_resources/10166438",
    }

    onPress = () => {
        this.props.navigation.navigate('PurchaseDetail')
    }

    registerForPushNotificationsAsync = async() => {
        //const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);

        /*if (status !== 'granted') {
            alert('No notification permissions!');
            return;
        }

        let token = await Notifications.getExpoPushTokenAsync();

        axios.get(PUSH_ENDPOINT).then(function(res) {
            let tokens = res["data"]["hydra:member"];
            tokens.filter(token => {return token.token_str === token})
            if(tokens.length == 0) {
                axios.post(PUSH_ENDPOINT, {
                    tokenStr: token
                }).then(function (response) {
                    // nothing
                })
                .catch(function (error) {
                    console.error(error);
                });
            }
        }).catch(console.error)*/
    }

    componentDidMount() {
        axios.get('http://saladetomateoignons.ddns.net/api/purshases')
          .then(res => {
            let body = res["data"]["hydra:member"];
            let promises = [];

            // fetch associated user
            body.forEach(purshase => {
                let promise = axios.get(`http://saladetomateoignons.ddns.net${purshase.user}`)
                  .then(user => {
                    purshase.user = {
                        id: user["data"]["DiscordID"],
                      firstname: user["data"].firstname,
                      lastname: user["data"].lastname,
                      phone: user["data"].phone
                    }
                  })

                promises.push(promise);
            });

            Promise.all(promises).then(() => {
                this.setState({ purchases: body });
            })
          })
        this.registerForPushNotificationsAsync()
    }

    render() {
        return (
          <SafeAreaView style={styles.container}>
          {
              <FlatList
                  data={this.state.purchases}
                  renderItem={({item}) => <Item
                      avatar_url={this.state.kebab_url}
                      subtitle={"yo"}
                      navigation={this.props.navigation}
                      item={item}
                  />}
                  keyExtractor={item => `key-${item.id}`}
              />
          }
          </SafeAreaView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
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
