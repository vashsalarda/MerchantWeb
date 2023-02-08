import React from "react";
import { Link } from "react-router-dom";
import { getSession } from "../../config/session";
import { connect } from "react-redux";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import {
  merchantApiLogin,
  syncProductsFromJSON,
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
  Nav,
  Row,
  Col
} from "reactstrap";

class ImportProducts extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    super(props);
    this.state = {
      userExist: false,
      payload: "",
      invalidJsonText: "",
      products: [],
      totalItems: 0,
      isLoading: true,
      submitted: false,
      isFetching: false,
      userData: userData
    };
    this.validatePayload = this.validatePayload.bind(this);
    this.handleImport = this.handleImport.bind(this);
  }

  componentDidMount() {
    this.setState({ isLoading: false });
  }

  validatePayload(e) {
    let { name, value } = e.target;
    try  {
      const arr = (JSON.parse(value));
      if (arr) {
        const products = arr;
        const totalItems = products.length;
        this.setState({
          [name]: value,
          products,
          totalItems,
          invalidJsonText: ""
        });
      }
    } 
    catch (err){
      console.log({err});
      this.setState({invalidJsonText: "Invalid JSON Payload"});
    }
    
  }

  handleImport() {
    this.setState({ submitted: true });
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
    const { products } = this.state;
    if(this.state && this.state.products) {
      if (!window.confirm("Are you sure you want to continue syncing the products?")) {
        return false;
      }
      this.setState({ isFetching: true });
      this.props.syncProductsFromJSON(products, pageId, sessionToken, (err,res) => {
        if(err) {
          setTimeout(() => {
            this.showNotificationError(err.message);
          }, 100);
          this.setState({ isFetching: false, submitted: false });
        } else {
          if(res) {
            setTimeout(() => {
              this.showNotification('Product(s) successfully synced.');
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
                    <h4 className="title">Import Products using JSON Payload</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        <Nav vertical >
                          <Link className="nav-link-vertical" to="/import-products">Sync using API <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical active-link" to="/import-products-json">Sync using JSON <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
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
                                  !this.state.payload
                                    ? " has-danger"
                                    : ""
                                }
                              >
                                <label htmlFor="payload" className="control-label">Paste the JSON Payload</label>
                                <p className="text-danger">{this.state.invalidJsonText}</p>
                                <textarea
                                  style={{
                                    maxHeight:"450px",
                                    fontFamily: "Menlo, Monaco, Consolas, monospace"
                                  }}
                                  className="form-control"
                                  id="payload"
                                  rows="50"
                                  name="payload"
                                  defaultValue={this.state.payload}
                                  onChange={this.validatePayload}
                                  autoComplete="off"
                                />
                                <p className="text-info">{this.state.totalItems} item(s) selected</p>
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
    }
  }
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps,
  {
    getPageById,
    merchantApiLogin,
    syncProductsFromJSON,
    addProduct,
  }
)(ImportProducts);
