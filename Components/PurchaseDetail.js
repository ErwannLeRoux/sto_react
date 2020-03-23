import React from 'react';
import {
  Text,
  View,
  Button,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import call from 'react-native-phone-call';
import {CheckBox} from 'react-native-elements';
import axios from 'axios';
const qs = require('querystring')

function callCustomer(phoneNumber) {
  const args = {
    number: phoneNumber,
    prompt: true,
  };

  call(args).catch(console.error);
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

function sendNotification(discordID, status) {
  if (status !== 'waiting' && discordID && discordID !== '') {
    axios
      .post('http://saladetomateoignons.ddns.net:8088/bot/updateState', {
        username: discordID,
        status: status,
      })
      .then(function(response) {})
      .catch(function(error) {
        console.error(error);
      });
  }
}

class PurchaseDetail extends React.Component {
  constructor() {
    super();

    this.state = {
      status: [
        {id: 'waiting', name: 'En attente de validation', checked: false},
        {id: 'validate', name: 'Validée', checked: false},
        {id: 'in_preparation', name: 'En cours de préparation', checked: false},
        {id: 'ready', name: 'Préparée', checked: false},
        {id: 'delivered', name: 'Délivrée', checked: false},
        {id: 'canceled', name: 'Refusée', checked: false},
      ],
    };
  }

  componentWillUnmount() {
    this.props.navigation.state.params.onGoBack();
  }

  render() {
    let purchase = this.props.navigation.state.params.item;
    let user = purchase.user;

    let currentStatus = this.state.status.find(status => {
      return status.id === purchase.status;
    });

    let copy = this.state.status;
    copy.map(status => {
      if (status === currentStatus) {
        status.checked = true;
      }
    });

    let statusCheckbox = [];
    let supplements = [];
    let menus = [];
    let paid = <Text style={[styles.line, styles.red]}>Non payée</Text>;

    if (purchase.paid) {
      paid = <Text style={[styles.line, styles.green]}>Payée en ligne</Text>;
    }

    for (let i = 0; i < this.state.status.length; i++) {
      statusCheckbox.push(
        <CheckBox
          key={i}
          title={this.state.status[i].name}
          checked={this.state.status[i].checked}
          onPress={() => {
            let array = this.state.status;
            array.map((item, index) => {
              if (index != i) {
                item.checked = false;
              } else {
                item.checked = true;
              }
            });

            this.setState({status: array});
            if (array[i].checked) {
              // call axios to update purchase
              let requestBody = {
                purchaseId: purchase.id,
                status: array[i].id,
              };

              const config = {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
              };

              axios
                .post(
                  'http://saladetomateoignons.ddns.net/updatePurchase',
                  qs.stringify(requestBody),
                  config,
                )
                .then(response => {
                  //console.log(response);
                });
              sendNotification(user.DiscordID, array[i].id);
              this.props.navigation.state.params.onGoBack();
              this.props.navigation.goBack();
            }
          }}>
          }}
        </CheckBox>,
      );
    }

    for (let i = 0; i < purchase.purshaseProducts.length; i++) {
      let purchaseProduct = purchase.purshaseProducts[i];
      supplements.push(
        <Text style={styles.supplements} key={i}>
          {purchaseProduct.qty}x {purchaseProduct.product.name}
        </Text>,
      );
    }

    for (let i = 0; i < purchase.purshaseMenuses.length; i++) {
      menus.push(
        <Text style={styles.menus} key={i}>
          1x {purchase.purshaseMenuses[i].formule.name}
        </Text>,
      );

      if (purchase.purshaseMenuses[i].ingredients != '') {
        menus.push(
          <Text style={styles.menus} key={i + '-ing'}>
            ( {purchase.purshaseMenuses[i].ingredients} )
          </Text>,
        );
      }

      if (purchase.purshaseMenuses[i].customerComment != '') {
        menus.push(
          <Text style={styles.menus} key={i + '-comment'}>
            ( commentaire : {purchase.purshaseMenuses[i].customerComment} )
          </Text>,
        );
      }
    }

    return (
      <SafeAreaView>
        <ScrollView>
          <View style={styles.part}>
            <Text style={styles.line}>Commande n°{purchase.id}</Text>
            <Text style={styles.line}>
              {user.firstname} {user.lastname}
            </Text>
            <Text style={styles.line}>{formatDate(purchase.date)}</Text>
            <Text style={styles.line}>{currentStatus.name}</Text>
            <Text style={styles.line}>
              Indice de confiance {purchase.trustScore}/10
            </Text>
          </View>

          <View style={styles.part}>
            <Text style={styles.line}>Montant: {purchase.total}€</Text>
            <Text style={styles.line}>
              Preparer pour: {formatDate(purchase.deliveryHour)}
            </Text>
          </View>

          <View style={styles.part}>
            <Text style={styles.line}>Menus</Text>
            {menus}
          </View>

          <View style={styles.part}>
            <Text style={styles.line}>Suppléments</Text>
            {supplements}
          </View>

          <View style={styles.part}>{paid}</View>

          <View style={styles.part}>{statusCheckbox}</View>

          <View style={styles.buttonContainer}>
            <Icon.Button
              name="phone"
              backgroundColor="#66be61"
              onPress={() => callCustomer(purchase.user.phone)}>
              <Text style={styles.phoneText}>Appeler le Client</Text>
            </Icon.Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    margin: 20,
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alternativeLayoutButtonContainer: {
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phoneText: {
    color: 'white',
  },
  line: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontSize: 20,
  },
  supplements: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontSize: 15,
  },
  menus: {
    alignSelf: 'stretch',
    textAlign: 'center',
    fontSize: 15,
  },
  part: {
    marginBottom: 20,
  },
  green: {
    color: 'green',
  },
  red: {
    color: 'red',
  },
});

export default PurchaseDetail;
