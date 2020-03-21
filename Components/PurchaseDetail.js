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

function sendNotification(user, status) {
  axios
    .post('http://saladetomateoignons.ddns.net:8088/bot/updateState', {
      username: user.id,
      status: status,
    })
    .then(function(response) {
      console.log(response);
    })
    .catch(function(error) {
      console.error(error);
    });
}

class PurchaseDetail extends React.Component {
  constructor() {
    super();

    this.state = {
      status: [
        {id: 'validate', name: 'Validée', checked: false},
        {id: 'in_preparation', name: 'En cours de préparation', checked: false},
        {id: 'ready', name: 'Préparée', checked: false},
        {id: 'delivered', name: 'Délivrée', checked: false},
      ],
    };
  }

  render() {
    let purchase = this.props.navigation.state.params;
    let user = purchase.user;
    let statusCheckbox = [];

    for (let i = 0; i < this.state.status.length; i++) {
      statusCheckbox.push(
        <CheckBox
          key={i}
          title={this.state.status[i].name}
          checked={this.state.status[i].checked}
          onPress={() => {
            let array = this.state.status;
            array[i].checked = !array[i].checked;
            // uncheck other
            array.map((item, index) => {
              if (index != i) {
                item.checked = false;
              }
            });
            this.setState({status: array});
            if (array[i].checked) {
              sendNotification(user, array[i].id);
            }
          }}>
          }}
        </CheckBox>,
      );
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
            <Text style={styles.line}>{purchase.status}</Text>
            <Text style={styles.line}>Montant: {purchase.total}€</Text>
          </View>

          <View style={styles.part}>
            <Text style={styles.line}>Menus</Text>
          </View>

          <View style={styles.part}>
            <Text style={styles.line}>Suppléments</Text>
          </View>

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
    backgroundColor: '#FDD7E4',
    alignSelf: 'stretch',
    textAlign: 'center',
    fontSize: 20,
  },
  part: {
    marginBottom: 20,
  },
});

export default PurchaseDetail;
