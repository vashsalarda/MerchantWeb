import React from "react";
import { Link } from "react-router-dom";
import { getSession } from "../../config/session";
import { connect } from "react-redux";
import api from "../../config/api";
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

  handleSync = () => {
    this.setState({ submitted: true });
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
    this.setState({ isFetching: true });
    this.showNotification('Syncing categories. This may take a while. Please wait for few minutes');
    api(sessionToken).post(`/places/${pageId}/sync-product-categories-from-api`,{placeId:pageId})
      .then(resp => {
        if (resp && resp.data) {
          let added = 0;
          let updated = 0;
          const { categoriesUpdated, categoriesAdded } = resp.data;
          if(categoriesAdded instanceof Array && categoriesAdded.length > 0) {
            added = categoriesAdded.length;
          }
          if(categoriesUpdated && categoriesUpdated.nModified &&  categoriesUpdated.nModified > 0) {
            updated = categoriesUpdated.nModified;
          }
          this.showNotification(`Sync complete! ${added} added. ${updated} updated.`);
          this.setState({ isFetching: false });
        }
      })
      .catch(err => {
        console.log({err});
        this.showNotificationError('An error occured! Please try again.');
        this.setState({ isFetching: false });
      });
  }

  handleSyncParent = () => {
    this.setState({ submitted: true });
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
    this.setState({ isFetching: true });
    this.showNotification('Syncing categories. This may take a while. Please wait for few minutes');
    api(sessionToken).post(`/places/${pageId}/update-product-categories-parent-from-api`,{placeId:pageId})
      .then(resp => {
        if (resp && resp.data) {
          this.showNotification(`Sync completed.`);
          this.setState({ isFetching: false });
        }
      })
      .catch(err => {
        console.log({err});
        this.showNotificationError('An error occured! Please try again.');
        this.setState({ isFetching: false });
      });
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
        autoDismiss: 3
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
        autoDismiss: 3
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
                          <Link className="nav-link-vertical" to="/import-categories-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical active-link" to="/sync-product-categories">Sync Product Categories <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
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
                      <h4 className="title">Syc Product Categories from API</h4>
                    </CardHeader>
                    <CardBody>
                      <Row>
                        <Col className="pr-md-1" sm="4">
                          <Nav vertical >
                            <Link className="nav-link-vertical" to="/import-categories-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                            <Link className="nav-link-vertical active-link" to="/sync-product-categories">Sync Product Categories <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          </Nav>
                        </Col>
                        <Col className="pl-md-1" sm="8">
                          <Form>
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
                                    Product Categories URL
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
                            <Row>
                              <Col md="12" sm="12">
                                <Button className="btn-fill btn-round" color="info" type="button" onClick={this.handleSync}>
                                  Sync Categories
                                </Button>
                                <Button className="btn-fill btn-round" color="info" type="button" onClick={this.handleSyncParent}>
                                  Update Parent Categories
                                </Button>
                              </Col>
                            </Row>
                          </Form>
                        </Col>
                      </Row>
                    </CardBody>
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
                          <Link className="nav-link-vertical" to="/import-categories-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical active-link" to="/sync-product-categories">Sync Product Categories <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
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
