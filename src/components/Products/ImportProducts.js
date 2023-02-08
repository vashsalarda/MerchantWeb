import React from "react";
import { Link } from "react-router-dom";
import { getSession } from "../../config/session";
import { connect } from "react-redux";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import {
  merchantApiLogin,
  importProductsFromApi,
  syncProductsFromAPI,
  addProduct,
} from "../../layouts/Admin/actions/ProductActions";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import { PulseLoader } from "react-spinners";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Nav,
  Row,
  Col,
} from "reactstrap";

class ImportProducts extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    super(props);
    this.state = {
      userExist: false,
      loginUrl: "",
      apiUsername: "",
      apiPassword: "",
      productsUrl: "",
      apiKey: "",
      payload: "",
      isLoading: true,
      submitted: false,
      isFetching: false,
      userData: userData
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
  
    if (userData != null && pageId) {
      this.props.getPageById(pageId, sessionToken, (error, result) => {
        if (result) {
          const pageObj = result.page;
          this.setState({
            pageExists: true,
            loginUrl: (pageObj.privateApiInfo && pageObj.privateApiInfo.loginUrl) ? pageObj.privateApiInfo.loginUrl : "",
            apiUsername: (pageObj.privateApiInfo && pageObj.privateApiInfo.username) ? pageObj.privateApiInfo.username : "",
            apiPassword: (pageObj.privateApiInfo && pageObj.privateApiInfo.password) ? pageObj.privateApiInfo.password : "",
            productsUrl: (pageObj.privateApiInfo && pageObj.privateApiInfo.productsUrl) ? pageObj.privateApiInfo.productsUrl : "",
            apiKey: (pageObj.privateApiInfo && pageObj.privateApiInfo.apiKey) ? pageObj.privateApiInfo.apiKey : "",
            isLoading: false
          });
        } else {
          if(error) {
            this.setState({ isLoading: false });
          }
        }
      });
    } else {
      this.setState({ isLoading: false });
    }
  }

  handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = e.target.checked;
      value = checked;
    }
    this.setState({
      [name]: value
    });
  }

  handleImport = () => {
    this.setState({ submitted: true });
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
    const state = this.state;
    if(state && state.loginUrl && state.apiUsername && state.apiPassword && state.productsUrl && state.apiKey) {
      if (!window.confirm("Are you sure you want to continue syncing the products?")) {
        return false;
      }
      this.setState({ isFetching: true });
      this.props.syncProductsFromAPI(state.productsUrl, state.apiKey, pageId, sessionToken, (err,res) => {
        if(err) {
          setTimeout(() => {
            this.showNotificationError(err.message);
          }, 100);
          this.setState({ isFetching: false, submitted: false });
        } else {
          if(res) {
            setTimeout(() => {
              this.showNotification('Updating the products. Please wait for few minutes');
            }, 100);
            this.setState({ isFetching: false, submitted: false });
          } else {
            setTimeout(() => {
              this.showNotificationError('There is an error in importing the product. Please try again.');
            }, 100);
            this.setState({ isFetching: false, submitted: false });
          }
        }
      });
    } else {
      this.showNotificationError('Some fields are required. Please fill the required fields.');
    }
  }

  showNotification(message) {
    if(message) {
      const notification = {
        place: 'tc',
        message: (
          <div>
            <div>
              {message}
            </div>
          </div>
        ),
        type: "success",
        icon: "",
        autoDismiss: 5
      }
      this.refs.notify.notificationAlert(notification);
    }
  }

  showNotificationError(message) {
    if(message) {
      
      const notification = {
        place: 'tc',
        message: (
          <div>
            <div>
              {message}
            </div>
          </div>
        ),
        type: "danger",
        icon: "",
        autoDismiss: 5
      }
      this.refs.notify.notificationAlert(notification);
    }
  }

  render() {
    if(this.state.isLoading) {
      return (
        <>
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">Import Products from API</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        <Nav vertical >
                          <Link className="nav-link-vertical active-link" to="/import-products">Sync using API <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical" to="/import-products-json">Sync using JSON <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical" to="/import-products-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                        </Nav>
                      </Col>
                      <Col className="pl-md-1" sm="8">
                        <PulseLoader
                          sizeUnit={"px"}
                          size={15}
                          color={'#1d8cf8'}
                          loading={this.state.isLoading}
                        />
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      );
    } else {
      if(this.state.pageExists) {
        return (
          <>
            <div className="content">
              <div className="react-notification-alert-container">
                <NotificationAlert ref="notify" />
              </div>
              <Row>
                <Col sm="12" md="12" lg="12">
                  <Card>
                    <CardHeader>
                      <h4 className="title">Import Products from API URL</h4>
                    </CardHeader>
                    <CardBody>
                      <Row>
                        <Col className="pr-md-1" sm="4">
                          <Nav vertical >
                            <Link className="nav-link-vertical active-link" to="/import-products">Sync using API <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                            <Link className="nav-link-vertical" to="/import-products-json">Sync using JSON <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                            <Link className="nav-link-vertical" to="/import-products-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          </Nav>
                        </Col>
                        <Col className="pl-md-1" sm="8">
                          <Form>
                            <Row>
                              <Col md="12" sm="12">
                                <FormGroup
                                  className={
                                    this.state.submitted &&
                                    !this.state.loginUrl
                                      ? " has-danger"
                                      : ""
                                  }
                                >
                                  <label htmlFor="loginUrl" className="control-label">
                                    URL
                                  </label>
                                  <Input
                                    id="loginUrl"
                                    name="loginUrl"
                                    placeholder="Login URL"
                                    type="text"
                                    defaultValue={this.state.loginUrl}
                                    onChange={this.handleChange}
                                    autoComplete="off"
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                            <Row>
                              <Col className="pr-md-1" md="6" sm="12">
                                <FormGroup
                                  className={
                                    this.state.submitted &&
                                    !this.state.apiUsername
                                      ? " has-danger"
                                      : ""
                                  }
                                >
                                  <label htmlFor="apiUsername" className="control-label">
                                    Username
                                  </label>
                                  <Input
                                    id="apiUsername"
                                    name="apiUsername"
                                    placeholder="API Username"
                                    type="text"
                                    value={this.state.apiUsername}
                                    onChange={this.handleChange}
                                    autoComplete="off"
                                  />
                                </FormGroup>
                              </Col>
                              <Col className="pl-md-1" md="6" sm="12">
                                <FormGroup
                                  className={
                                    this.state.submitted &&
                                    !this.state.apiPassword
                                      ? " has-danger"
                                      : ""
                                  }
                                >
                                  <label htmlFor="apiPassword" className="control-label">
                                    Password
                                  </label>
                                  <Input
                                    id="apiPassword"
                                    name="apiPassword"
                                    placeholder="Password"
                                    type="password"
                                    value={this.state.apiPassword}
                                    onChange={this.handleChange}
                                    autoComplete="off"
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                            <Row>
                              <Col md="12" sm="12">
                                <FormGroup
                                  className={
                                    this.state.submitted &&
                                    !this.state.productsUrl
                                      ? " has-danger"
                                      : ""
                                  }
                                >
                                  <label htmlFor="productsUrl" className="control-label">
                                    Products URL
                                  </label>
                                  <Input
                                    id="productsUrl"
                                    name="productsUrl"
                                    placeholder="Products URL"
                                    type="text"
                                    defaultValue={this.state.productsUrl}
                                    onChange={this.handleChange}
                                    autoComplete="off"
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                            <Row>
                              <Col md="12" sm="12">
                                <FormGroup
                                  className={
                                    this.state.submitted &&
                                    !this.state.apiKey
                                      ? " has-danger"
                                      : ""
                                  }
                                >
                                  <label htmlFor="apiKey" className="control-label">
                                    API Key
                                  </label>
                                  <Input
                                    id="apiKey"
                                    name="apiKey"
                                    placeholder="API Key"
                                    type="text"
                                    value={this.state.apiKey}
                                    onChange={this.handleChange}
                                    autoComplete="off"
                                  />
                                </FormGroup>
                              </Col>
                            </Row>
                          </Form>
                        </Col>
                      </Row>
                    </CardBody>
                    <CardFooter>
                      <Button className="btn-fill btn-round" color="info" type="button" onClick={this.handleImport}>
                        Sync Products
                      </Button>
                    </CardFooter>
                  </Card>
                </Col>
              </Row>
              <LoadingOverlay
                active={this.state.isFetching}
                spinner
                text='Syncing Products...'
                >
              </LoadingOverlay>
            </div>
          </>
        );
      } else {
        return(
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">No Page Added</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        <Nav vertical >
                          <Link className="nav-link-vertical active-link" to="/import-products">Sync using API <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical" to="/import-products-json">Sync using JSON <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical" to="/import-products-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                        </Nav>
                      </Col>
                      <Col className="pl-md-1" sm="8">
                        <p>You have not added a page yet. Please signup as a Provider/Merchant</p>
                      </Col>
                    </Row>    
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        );
      }
    }
  }
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps,
  {
    getPageById,
    merchantApiLogin,
    importProductsFromApi,
    syncProductsFromAPI,
    addProduct,
  }
)(ImportProducts);
