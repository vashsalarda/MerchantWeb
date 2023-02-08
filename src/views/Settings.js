import React from "react";
import { Link } from "react-router-dom";
import { getSession, setSession } from "../config/session";
import { connect } from "react-redux";  
import { getProviderInfo, updateProfile } from "../layouts/User/UserActions";
import { PulseLoader } from 'react-spinners';
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Nav,
  FormGroup,
  Form,
  Input,
  Row,
  Col
} from "reactstrap";

class Settings extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    let userInfo = {};
    if (userData != null) {
      userInfo = userData.info;
    }
    super(props);
    this.state = {
      userExist: false,
      isLoading: false,
      isSaving: false,
      submitted: false,
      user: {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userData.email,
        phoneNumber: userInfo.mobileNumber,
        homeAddress: userInfo.homeAddress,
        photos: userInfo.photos ? userInfo.photos : null,
      },
      validPhoneNumber: false
    };
  }

  handleChange = (e) => {
    let { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = e.target.checked;
      value = checked;
    }
    if(name === 'phoneNumber') {
      const OK = reg.exec(value);
      if (OK)  {
        this.setState({ validPhoneNumber: true });
      } else {
        this.setState({ validPhoneNumber: false });
      }
    }
    this.setState({
      user: {
        ...this.state.user,
        [name]: value
      }
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
    const userData = JSON.parse(getSession("userData"));
    
    let sessionToken = "";
    let user;
    const { validPhoneNumber } = this.state;
    
    if(userData) {
      sessionToken = userData.sessionToken;
      user = {...this.state.user};
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }

    if (user) {
      if (user.email && user.phoneNumber && user.firstName && user.lastName && validPhoneNumber) {
        if (!window.confirm("Do you want to save these changes?")) {
          return false;
        }
        this.setState({ submitted: true, isSaving: true });
        this.props.updateProfile(user, sessionToken, (error, result) => {
          if (result) {
            // Update userData in localStorage
            userData.firstName = this.state.user.firstName;
            userData.lastName = this.state.user.lastName;
            userData.email = this.state.user.email;
            userData.homeAddress = this.state.user.homeAddress;
            userData.info.firstName = this.state.user.firstName;
            userData.info.lastName = this.state.user.lastName;
            userData.info.name = this.state.user.firstName + " " + this.state.user.lastName;
            userData.info.homeAddress = this.state.user.homeAddress;
            setSession('userData',JSON.stringify(userData));
            setTimeout(() => {
              this.setState({ submitted: false, isSaving: false });
              if(result && result.message) {
                this.showNotification(result.message);
              }
            }, 1000);
          } else {
            if (error) {
              if(error.response && error.response.status && error.response.status === 403) {
                setTimeout(() => { 
                  this.setState({ submitted: false, isSaving: false });
                  this.props.history.push("/products");
                }, 1000);
                this.showNotificationError('You are not allowed to update this product.');
              } else {
                this.showNotificationError(error.error);
              }
            } else {
              setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
              this.showNotificationError('An unknown error occured. Please try again.');
            }
          }
        });
      } else {
        this.setState({ submitted: true });
        this.showNotificationError('Some fields are required. Please fill the required fields.');
      }
    } else {
      setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
      this.showNotificationError('Product information is missing.');
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
                    <h4 className="title">Account Settings</h4>
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
      return (
        <>
          <div className="content">
            <div className="react-notification-alert-container">
              <NotificationAlert ref="notify" />
            </div>
            <Row>
              <Col md="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">Account Settings</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        <Nav vertical >
                          <Link className="nav-link-vertical active-link" to="/settings">Profile <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                          <Link className="nav-link-vertical" to="/settings/change-password">Change Password <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                        </Nav>
                      </Col>
                      <Col className="pl-md-1" sm="8">
                        <Form>
                          <Row>
                            <Col className="pr-md-1" md="6">
                              <FormGroup>
                                <label className="control-label" htmlFor="email">
                                  Email address
                                </label>
                                <Input
                                  name="email"
                                  placeholder="Email"
                                  type="email"
                                  defaultValue={this.state.user.email}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                            <Col className="pl-md-1" md="6">
                              <FormGroup
                                className={
                                  this.state.submitted && !this.state.user.phoneNumber && !this.state.validPhoneNumber
                                    ? " has-danger"
                                    : ""
                                }
                              >
                                <label className="control-label" htmlFor="phoneNumber">Phone No.</label>
                                <Input
                                  name="phoneNumber"
                                  placeholder="Phone No."
                                  type="text"
                                  defaultValue={this.state.user.phoneNumber}
                                  onChange={this.handleChange}
                                />
                                {this.state.submitted && !this.state.validPhoneNumber && (
                                  <span className="text-danger">Phone No. is not valid</span>
                                )}
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col className="pr-md-1" md="6">
                              <FormGroup>
                                <label className="control-label" htmlFor="firstName">First Name</label>
                                <Input
                                  name="firstName"
                                  placeholder="First Name"
                                  type="text"
                                  defaultValue={this.state.user.firstName}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                            <Col className="pl-md-1" md="6">
                              <FormGroup>
                                <label className="control-label" htmlFor="lastName">Last Name</label>
                                <Input
                                  name="lastName"
                                  placeholder="Last Name"
                                  type="text"
                                  defaultValue={this.state.user.lastName}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label className="control-label" htmlFor="homeAddress">Living In</label>
                                <Input
                                  name="homeAddress"
                                  placeholder="Living In"
                                  type="text"
                                  defaultValue={this.state.user.homeAddress}
                                  onChange={this.handleChange}
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                        </Form>
                      </Col>
                    </Row>
                  </CardBody>
                  <CardFooter>
                    <Button className="btn-fill btn-round" color="info" type="submit" onClick={this.handleSubmit}>
                      Save
                    </Button>
                  </CardFooter>
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
  }
}

const reg = /^\(?([0-9]{11})$/; 
const mapStateToProps = () => ({});

export default connect(mapStateToProps,{getProviderInfo, updateProfile})(Settings);
