import React from "react";
import { Link } from "react-router-dom";
import { getSession, setSession } from "../config/session";
import { connect } from "react-redux";  
import { getPageById, updatePage } from "../layouts/Admin/actions/PageActions";
import { PulseLoader } from 'react-spinners';
import { FontAwesomeIcon as Fa } from '@fortawesome/react-fontawesome';
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  ListGroup,
  ListGroupItem,
  Row,
  Col
} from "reactstrap";

class Activate extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    let userInfo = {};
    if (userData !== null) {
      userInfo = userData.info;
    }
    super(props);
    this.state = {
      userExist: false,
      page:{},
      isLoading: false,
      isSaving: false,
      submitted: false,
      activateAccount: false,
      hasMissingInfo: false,
      user: {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userData.email,
        phoneNumber: userInfo.mobileNumber,
        homeAddress: userInfo.homeAddress,
        photos: userInfo.photos ? userInfo.photos : null,
      }
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const defaultPage = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
    if (defaultPage && userData && sessionToken) {
      this.props.getPageById(defaultPage, sessionToken, (error, result) => {
        if (error) {
          this.setState({ isLoading: false });
          if(error.response && typeof error.response === 'string' ) {
            this.showNotificationError(error.response);
          } else {
            this.showNotificationError('There is a error retrieving the page information');
          }
        } 
        if(result) {
          this.setState({ 
            activateAccount: result.page.isActive,
            page: result.page
          });
          setTimeout(() => {
            this.setState({isLoading: false});
          }, 3000);
        } else {
          this.setState({ isLoading: false });
        }
      });
    }
  }

  handleCheckActivate = (e) => {
    let { type } = e.target;
    let checked = false
    if (type === "checkbox") {
      checked = e.target.checked ? true : false;
    }
    this.setState({activateAccount:checked});
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

  handleSubmit = (e) => {
    e.preventDefault();
    let hasMissingInfo = false;
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let userData = JSON.parse(getSession("userData"));
    let hasProducts = JSON.parse(getSession("hasProducts"));
    let hasCategories = JSON.parse(getSession("hasCategories"));
    const place = { 
      isActive: this.state.activateAccount,
      hideTutorials: false
    }
    let sessionToken = "";
    if(userData) {
      sessionToken = userData.sessionToken;
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }

    if (pageInfo) {
      let bankName = '';
      let accountName = '';
      let accountNumber = '';
      if(pageInfo.bankaccount) {
        const { bankaccount } = pageInfo;
        bankName = bankaccount.bankName;
        accountName = bankaccount.accountName;
        accountNumber = bankaccount.accountNumber;
      }

      if(bankName === '' || accountName === '' || accountNumber === '') {
        hasMissingInfo = true;
      }
      if(hasCategories === false) {
        hasMissingInfo = true;
      }
      if(hasProducts === false) {
        hasMissingInfo = true;
      }
      if(this.state.activateAccount === true) {
        if(hasMissingInfo === false) {
          if (!window.confirm("Are you sure you want to activate your store?")) {
            return false;
          }
          this.setState({ submitted: true, isSaving: true });
          this.props.updatePage(place, pageInfo._id, sessionToken, (error, result) => {
            if (result) {
              const pageInfoUpdated = {
                _id: pageInfo._id,
                name: pageInfo.name,
                addressLine1: pageInfo.addressLine1,
                city: pageInfo.city,
                country: pageInfo.country,
                province: pageInfo.province,
                postalCode: pageInfo.postalCode,
                pageType: pageInfo.pageType,
                bankaccount: pageInfo.bankaccount,
                isVerified: pageInfo.isVerified,
                isActive: place.isActive,
                photos: pageInfo.photos,
                useCreatedProductCategory: pageInfo.useCreatedProductCategory,
                hideTutorials: false,
                productUploadXLSEnabled: pageInfo.productUploadXLSEnabled ? true : false,
                productVouchersEnabled: pageInfo.productVouchersEnabled ? true : false
              }
              setSession('pageInfo',JSON.stringify(pageInfoUpdated));
              this.showNotification('Your store has been activated. Complete the store information and add products to start selling.');
              setTimeout(() => {
                this.setState({submitted: false, isSaving: false,
                });
                this.props.history.push("/page");
                window.location.reload();
              }, 3000);
            } else {
              if (error) {
                if(typeof error.error === 'string') {
                  setTimeout(() => { 
                    this.setState({ submitted: false, isSaving: false }); 
                    this.showNotificationError(error.error);
                  }, 1000);
                }
              } else {
                setTimeout(() => { 
                  this.setState({ submitted: false, isSaving: false }); 
                  this.showNotificationError('An unknown error occured. Please try again.');
                }, 1000);
              }
            }
          });
        } else {
          this.setState({ submitted: true });
          this.showNotificationError('Cannot activate your store. Please complete all the requirements to proceed!');
        }
      } else {
        setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
        this.showNotificationError('Please check the box to activate you account!');
      }
    } else {
      setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
      this.showNotificationError('Page information not found.');
    }
  }

  renderActivatePage() {
    return(
      <>
        <div className="content">
          <div className="react-notification-alert-container">
            <NotificationAlert ref="notify" />
          </div>
          <Row>
            <Col md="12">
              <Card>
                <CardHeader>
                  <h4 className="title">Just One More  Step - Account Activation</h4>
                </CardHeader>
                <CardBody>
                  <Row>
                    <Col sm="12">
                      <Row>
                        <Col sm="12">
                          <FormGroup>
                            <label className="control-label">Great Job! Your almost done!</label>
                          </FormGroup>
                        </Col>
                      </Row>
                      <Row>
                        <Col sm="12" style={{marginBottom:'1rem'}}>
                          {this.renderChecklist(this.state.page)}
                        </Col>
                      </Row>
                      <Row>
                        <Col sm="12">
                          <p>
                            We at StreetBy is commited in giving  great customer  experience, with that said, we have prepare some articles, documents to you to study and learned how to accept order, manage orders, communicate with riders and how to handle different scenarios.
                          </p><br/>
                          <p>
                            Please have  a detail look on the links below and learned how to give great customers experience to our users.
                          </p>
                        </Col>
                      </Row>
                      <Row>
                        <Col md="12" style={{ marginTop: '15px' }}>
                          <Form>
                            <FormGroup>
                              <label style={{ marginTop: '15px' }}>
                                <Input
                                  type="checkbox"
                                  className="enable-disable-checkbox"
                                  id="activateAccount"
                                  name="activateAccount"
                                  checked={this.state.activateAccount}
                                  onChange={this.handleCheckActivate}
                                />
                                <span className="form-check-sign">
                                  <span className="check" />
                                </span>
                                <label className="control-label">I have read and understand all the topics above.</label>
                              </label>
                            </FormGroup>
                            <FormGroup>
                              <Button className="btn-fill btn-round" color="info" type="submit" onClick={this.handleSubmit}>
                                I’M READY TO ACCEPT ORDERS
                              </Button>
                            </FormGroup>
                          </Form>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
        <LoadingOverlay
          active={this.state.isSaving}
          spinner
          text='Saving...'
          >
        </LoadingOverlay>
      </>
    );
  }

  renderPageActive() {
    return (
      <>
        <div className="content">
          <div className="react-notification-alert-container">
            <NotificationAlert ref="notify" />
          </div>
          <Row>
            <Col sm="12" md="12" lg="12">
              <Card>
                <CardBody>
                  <Alert color="danger">
                    <h4 className="alert-heading">Store is already activated.</h4>
                    <hr />
                    <p className="mb-0">
                      You cannot activate this store because it is already activated. Click{" "} <Link to="/page">here</Link> {" "}to view the store information.
                    </p>
                  </Alert>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </div>
      </>
    );
  }

  renderNoProductsAdded() {
    return (
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col sm="12" md="12" lg="12">
            <Card>
              <CardBody>
                <Alert color="danger">
                  <h4 className="alert-heading">No Products Added</h4>
                  <hr />
                  <p className="mb-0">
                    You need to add a product before you can activate your store. Click{" "} <Link to="/products/new">here</Link> {" "}to add a product.
                  </p>
                </Alert>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  renderNoPageAdded() {
    return (
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col sm="12" md="12" lg="12">
            <Card>
              <CardBody>
                <Alert color="danger">
                  <h4 className="alert-heading">No Page Added</h4>
                  <hr />
                  <p className="mb-0">
                    You have not added a page yet. Click{" "} <Link to="/add-page">here</Link> {" "}to add a new page.
                  </p>
                </Alert>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  renderChecklist(page) {
    const hasCategories = JSON.parse(getSession("hasCategories"));
    const hasProducts = JSON.parse(getSession("hasProducts"));
    const bankaccount = page && page.bankaccount ? page.bankaccount : {}
    if(page && page.isVerified) {
      return(
        <ListGroup>
          {page && page.isVerified === true ?
            <ListGroupItem className="text-success-v2"><Fa icon="check-circle" /> Agreed to Terms & Policies</ListGroupItem> :
            <ListGroupItem className="text-danger-v2"><Fa icon="times-circle" /> Agreed to Terms & Policies</ListGroupItem> }
          {hasCategories ?
            <ListGroupItem className="text-success-v2"><Fa icon="check-circle" /> Categories</ListGroupItem> :
            <ListGroupItem className="text-danger-v2"><Fa icon="times-circle" /> Categories</ListGroupItem> }
          {hasProducts ?
            <ListGroupItem className="text-success-v2"><Fa icon="check-circle" /> Products</ListGroupItem> :
            <ListGroupItem className="text-danger-v2"><Fa icon="times-circle" /> Products</ListGroupItem> }
          {bankaccount && bankaccount.bankName && bankaccount.accountName && bankaccount.accountNumber ?
            <ListGroupItem className="text-success-v2"><Fa icon="check-circle" /> Bank Account</ListGroupItem> :
            <ListGroupItem className="text-danger-v2"><Fa icon="times-circle" /> Bank Account</ListGroupItem>}
        </ListGroup>
      );
    } else {
      return(
        <ListGroup>
          <ListGroupItem><Fa icon="question-circle" /> Agreed to Terms & Policies</ListGroupItem>
          <ListGroupItem><Fa icon="question-circle" /> Categories</ListGroupItem>
          <ListGroupItem><Fa icon="question-circle" /> Products</ListGroupItem>
          <ListGroupItem><Fa icon="question-circle" /> Bank Account</ListGroupItem>
        </ListGroup>
      );
    }
  }

  render() {
    const hasProducts = JSON.parse(getSession("hasProducts"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    if(this.state.isLoading) {
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
                    <h4 className="title">Activate Store</h4>
                  </CardHeader>
                  <CardBody>
                    <PulseLoader
                      sizeUnit={"px"}
                      size={15}
                      color={'#1d8cf8'}
                      loading={this.state.isLoading}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      );
    } else {
      if(pageInfo && pageInfo._id) {
        if(pageInfo.isActive === true) {
          return(this.renderPageActive());
        } else {
          if(hasProducts) {
            return (this.renderActivatePage());
          } else {
            return (this.renderNoProductsAdded());
          }
        }
      } else {
        return (this.renderNoPageAdded());
      }
    }
  }
}

const mapStateToProps = () => ({});

//export default UserProfile;
export default connect(mapStateToProps,{getPageById, updatePage})(Activate);