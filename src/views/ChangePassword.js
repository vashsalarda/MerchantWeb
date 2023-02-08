import React from "react";
import { Link } from "react-router-dom";
import { getSession } from "../config/session";
import { connect } from "react-redux";  
import { getProviderInfo, changePassword } from "../layouts/User/UserActions";
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

class ChangePassword extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isSaving: false,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      oldPasswordReqText: "",
      newPasswordReqText: "",
      confirmPasswordReqText: ""
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    let { name, value } = e.target;
    this.setState({[name]: value});
    if(name==='oldPassword') {
      this.setState({oldPasswordReqText: ""});
    } else if(name==='newPassword') {
      this.setState({newPasswordReqText: ""});
    } else if(name==='confirmPassword') {
      this.setState({confirmPasswordReqText: ""});
    }
  }

  handleSubmit(e) {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    let { oldPassword, newPassword, confirmPassword } = this.state;
    if(oldPassword && newPassword && confirmPassword) {
      if(oldPassword === newPassword) {
        this.showNotificationError('New password is the same as the old password!');
      } else {
        if(newPassword === confirmPassword) {
          this.setState({isSaving:true});
          const payload = {
            oldPassword,
            password: newPassword,
            confirmPassword,
          }
          this.props.changePassword(payload, sessionToken, (error, result) => {
            if (!error && result) {
              if(result.status === 'success') {
                this.setState({isSaving:false, oldPassword: "", newPassword: "", confirmPassword: ""});
                this.showNotification(result.message);
                setTimeout(() => {
                  localStorage.clear();
                  if(getSession('userData') === null) {
                    this.props.history.push('/login');
                    window.location.reload();
                    return this.setState({ loggedIn: false });
                  }
                }, 2000);
              } else {
                setTimeout(() => {
                  this.setState({isSaving:false});
                  this.showNotificationError(result.message);
                }, 1000);
              }
            } else {
              if (error) {
                this.showNotificationError(error.response);
              }
              setTimeout(() => {
                this.setState({isSaving:false});
              }, 1000);
            }
          });
        } else {
          this.showNotificationError('New password did not match!');
        }
      }
    } else {
      if(!oldPassword) {
        this.setState({oldPasswordReqText: "Old Password is required"});
      } else {
        this.setState({oldPasswordReqText: ""});
      }
      if(!newPassword) {
        this.setState({newPasswordReqText: "Password is required"});
      } else {
        this.setState({newPasswordReqText: ""});
      }
      if(!confirmPassword) {
        this.setState({confirmPasswordReqText: "Password confirmation is required"});
      } else {
        this.setState({confirmPasswordReqText: ""});
      }
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
                        <Link className="nav-link-vertical" to="/settings">Profile  <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                        <Link className="nav-link-vertical active-link" to="/change-password">Change Password <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                      </Nav>
                    </Col>
                    <Col className="pl-md-1" sm="8">
                      <Form>
                        <Row>
                          <Col className="pr-md-1" md="6">
                            <FormGroup className={this.state.oldPasswordReqText ? "has-danger" : ""}>
                              <label htmlFor="oldPassword" className="control-label">
                                Old Password
                              </label>
                              <Input
                                id="oldPassword"
                                name="oldPassword"
                                type="password"
                                value={this.state.oldPassword}
                                onChange={this.handleChange}
                                style={{marginBottom:"10px"}}
                              />
                              <span className="text-danger">{this.state.oldPasswordReqText}</span>
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col className="pr-md-1" md="6">
                            <FormGroup className={this.state.newPasswordReqText ? "has-danger" : ""}>
                              <label htmlFor="newPassword" className="control-label">New Password</label>
                              <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={this.state.newPassword}
                                onChange={this.handleChange}
                                style={{marginBottom:"10px"}}
                              />
                              <span className="text-danger">{this.state.newPasswordReqText}</span>
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col className="pr-md-1" md="6">
                            <FormGroup className={this.state.confirmPasswordReqText ? "has-danger" : ""}>
                              <label htmlFor="confirmPassword" className="control-label">Confirm Password</label>
                              <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={this.state.confirmPassword}
                                onChange={this.handleChange}
                                style={{marginBottom:"10px"}}
                              />
                              <span className="text-danger">{this.state.confirmPasswordReqText}</span>
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
          <LoadingOverlay
            active={this.state.isSaving}
            spinner
            text='Saving...'
            >
          </LoadingOverlay>
        </div>
      </>
    );
  }
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps, {getProviderInfo, changePassword})(ChangePassword);