import {createStackNavigator} from 'react-navigation-stack';
import {createAppContainer} from 'react-navigation';
import {firebase, messaging} from '@react-native-firebase/messaging';

import PurchasesList from './Components/PurchasesList';
import PurchaseDetail from './Components/PurchaseDetail';

const screens = {
  PurchaseList: {
    screen: PurchasesList,
  },
  PurchaseDetail: {
    screen: PurchaseDetail,
  },
}
const HomeStack = createStackNavigator(screens);

export default createAppContainer(HomeStack);
