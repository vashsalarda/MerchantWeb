import React from 'react';
import { Router, Route, BrowserRouter, Switch, } from "react-router-dom";
import { Provider } from 'react-redux';
import { createBrowserHistory } from "history";
import store from './config/store';
import { getSession } from './config/session';
import Login from "layouts/User/Login.jsx";
import Register from "layouts/User/Register.js";
import AdminLayout from "layouts/Admin/Admin.jsx";
import { library } from '@fortawesome/fontawesome-svg-core'
import { faIgloo, faEdit, faAdjust, faCog, faCopy, faPlus, faPlusSquare, faMinusSquare, faTrash, faTrashAlt, 
  faTimes, faPrint, faArchive, faTimesCircle, faEyeSlash, faEye, faImage, faImages, faArrowUp, 
  faArrowDown, faChevronUp, faChevronDown, faChevronLeft, faChevronRight, faFile, faFilePdf, faFileAlt, faMap, faMapPin,
  faCube, faExclamationTriangle, faQuestionCircle, faCalendar, faCalendarAlt, faMobileAlt, faPhoneSquare, faEnvelope,
  faFileExcel, faMapMarkerAlt, faHome, faFlag, faMonument, faMapMarked, faLock, faCheckCircle
} from '@fortawesome/free-solid-svg-icons'
import { faSquare, faCheckSquare, faFolder, faFolderOpen } from '@fortawesome/free-regular-svg-icons'

import "assets/scss/black-dashboard-react.scss";
import "assets/demo/demo.css";
import "assets/css/nucleo-icons.css";

library.add(faIgloo, faEdit, faAdjust, faCog, faCopy, faPlus, faSquare, faCheckSquare, faPlusSquare, faMinusSquare, 
  faTrash, faTrashAlt, faTimes, faFolder, faFolderOpen, faFile, faFileAlt, faFilePdf, faPrint, faArchive, faTimesCircle, 
  faEyeSlash, faEye, faImage, faImages, faArrowUp, faArrowDown, faChevronUp, faChevronDown, faChevronLeft, 
  faChevronRight, faMap, faMapPin, faCube, faExclamationTriangle, faQuestionCircle, faCalendar, faCalendarAlt, faEnvelope, 
  faMobileAlt, faPhoneSquare, faFileExcel, faMapMarkerAlt, faHome, faFlag, faMonument, faMapMarked, faLock, faCheckCircle );

const hist = createBrowserHistory();

export default class App extends React.Component {

  state = {
    loggedIn: false,
  }

  componentDidMount() {
    if(getSession('userData') === null) {
      return this.setState({ loggedIn: false });
    }
    this.setState({ loggedIn: true });
  }

  render() {
    return (
      <Provider store={store}>
        <Router history={hist}>
          <BrowserRouter>
            {/* <Switch>
              {userData &&
                <Fragment>
                  <Route path="/" render={props => <AdminLayout {...props} />} />
                  <Route exact path="/" render={() => <Redirect to="/products"/>}/>
                  <Route exact path="/login" render={() => <Redirect to="/products"/>}/>
                </Fragment>
              }
              {!userData &&
                <Fragment>
                  <Route exact path="/" component={Login} />
                  <Route exact path="/login" component={Login} />
                  <Route exact path="/register" component={Register} />
                </Fragment>
              }
            </Switch> */}
            <Switch>
              <Route exact path="/" component={Login} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
              <Route path="/" render={props => <AdminLayout {...props} />} />
            </Switch>
          </BrowserRouter>
        </Router>
      </Provider>
    );
  }
}
