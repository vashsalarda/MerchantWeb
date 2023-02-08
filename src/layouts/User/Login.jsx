import React from "react";
import { connect } from "react-redux";
import { NavLink } from 'react-router-dom';
import { login, sendResetPasswordRequest } from "./UserActions";
import { setSession, getSession } from "../../config/session";
import { getProviderPlaces } from "../../layouts/User/UserActions";
import { getProductCategoriesAllV2 } from "../../layouts/Admin/actions/ProductCategoryActions";
import LoadingOverlay from 'react-loading-overlay';

import logo from "assets/img/login-logo.png";

import { 
  Button,
  Col,
  Modal,
  ModalBody,
  ModalFooter,
  FormGroup,
  Input,
  Row
} from "reactstrap";

class Login extends React.Component {
  constructor(props) {
    super();
    this.state = {
      loggedIn: false,
      email: "",
      emailReset: "",
      password: "",
      submitted: false,
      isLoading: true,
      loggingIn: false,
      resettingPassword: false,
      resetPasswordText: '',
      modal: false
    };
  }

  componentDidMount() {
    this.setState({isLoading: false});
    if (getSession("userData") !== null) {
      const userData = JSON.parse(getSession('userData'));
      const sessionToken = userData.sessionToken;
      const defaultPage = JSON.parse(getSession('defaultPage'));
      if(defaultPage==="") {
        this.props.getProviderPlaces(sessionToken,(error, result) => {
          if (!error && result) {
            let defaultPage = ''
            if(result.places && result.places instanceof Array && result.places.length > 0 ) {
              const defaultPlace = result.places.find(item => item.isDefault);
              if(defaultPlace && defaultPlace._id) {
                defaultPage = defaultPlace._id
              } else {
                defaultPage = result.places[0]._id
              }
            }
            setSession('defaultPage',JSON.stringify(defaultPage));
          }
        });
      }
      return this.setState({ loggedIn: true });
    } else {
      return this.setState({ loggedIn: false });
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
    if(name==="emailReset" && value.length > 0) {
      this.setState({ resetPasswordText: "" });
    }
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitted: true });
    const { email, password } = this.state;
    if (email && password) {
      this.setState({ loggingIn: true });
      this.props.login(email, password, (error, result) => {
        if (!error && result) {
          const userData = JSON.parse(getSession('userData'));
          const sessionToken = userData.sessionToken;
          let defaultPage = JSON.parse(getSession('defaultPage'));
          this.props.getProviderPlaces(sessionToken,(error, result) => {
            if (!error && result) {
              let pageInfo = {};
              if(result.places && result.places instanceof Array && result.places.length > 0 ) {
                if(defaultPage==="") {
                  const defaultPlace = result.places.find(item => item.isDefault);
                  if(defaultPlace && defaultPlace._id) {
                    defaultPage = defaultPlace._id;
                    pageInfo = defaultPlace;
                  } else {
                    defaultPage = result.places[0]._id;
                    pageInfo = result.places[0];
                  }
                  setSession('defaultPage',JSON.stringify(defaultPage));
                } else {
                  pageInfo = result.places.find(item => item._id.toString() === defaultPage);
                }
              }
              if(pageInfo && pageInfo._id) {
                setSession('pageInfo',JSON.stringify(pageInfo));
                this.props.getProductCategoriesAllV2(
                  {},
                  defaultPage,
                  sessionToken,
                  (error, result) => {
                    if(error) {
                      console.log({error});
                    }
                    if (result) {
                      setSession('hasCategories',true);
                      this.props.history.push("/products");
                      window.location.reload();
                    } else  {
                      setSession('hasCategories',false);
                      this.props.history.push("/products");
                      window.location.reload();
                    }
                    this.setState({ isLoading: false });
                  }
                );
              } else {
                this.props.history.push("/products");
                window.location.reload();
              }
            } else {
              this.props.history.push("/products");
              window.location.reload();
            }
          });
        } else {
          if (error) {
            if(error.response && error.response.status) {
              const status = error.response.status;
              const statusText = error.response.statusText;
              if (status === 401) {
                this.setState({ statusText: "Invalid username or password.", submitted: false, password: "" });
              } else {
                this.setState({ statusText: statusText });
              }
            } else {
              if(error.message==="Network Error") {
                this.setState({ statusText: "Network Error. Please check your connection." });
              }
            }
            this.setLoading();
          }
        }
      });
    }
  }

  toggleResetPasswordModal = () => {
    this.setState(prevState => ({
      modal: !prevState.modal
    }));
    this.setState({
      resettingPassword: false,
      emailReset: '',
      resetPasswordText: ''
    });
  }

  handleResetPassword = (e) => {
    e.preventDefault();
    this.setState({ resettingPassword: true });
    const { emailReset } = this.state;
    if(emailReset) {
      this.props.sendResetPasswordRequest(emailReset, (error, result) => {
        if (!error && result) {
          alert('A password reset link has been sent to your email');
          this.toggleResetPasswordModal();
        } else {
          if (error) {
            if(error.response && error.response.status) {
              const statusText = error.response.statusText;
              this.setState({ resetPasswordText: statusText });
            } else {
              if(error.message==="Network Error") {
                this.setState({ resetPasswordText: "Network Error. Please check your connection." });
              }
            }
          }
          this.toggleResetPasswordModal();
        }
      });
      this.setState({ resettingPassword: false });
    } else {
      this.setState({ 
        resetPasswordText: 'Please enter an email address', 
        resettingPassword: false 
      });
    }
  }

  setLoading() {
    this.setState(prevState => ({ loading: !prevState.loading }));
  }

  render() {
    const userData = JSON.parse(getSession("userData"));
    if(userData) {
      this.props.history.push("/products");
      window.location.reload();
    } else {
      const {
        email,
        password,
        submitted,
        loggingIn,
        statusText
      } = this.state;
      
      if(this.state.isLoading) {
        return(
          <LoadingOverlay
            active={true}
            spinner
            text='Loading...'
            >
          </LoadingOverlay>
        )
      } else {
        return (
          <div className="app">
            <div className="app-left">
              <div className="col-sm-12 col-lg-6" style={{margin:'0 auto', width:'300px', top:'25%'}}>
                <img className="login-logo" alt="Streetby" src={logo}
              /></div>
            </div>
            <div className="app-right">
              <div className="login-container">
                <div className="col-sm-12">
                  <h2 className="page-title">LOGIN</h2>
                  {!statusText ? (
                    <p className="welcome-text">
                      Welcome back! Please login to your account
                    </p>
                  ) : (
                    <p className="welcome-text text-danger">{statusText}</p>
                  )}
                  <form name="form" onSubmit={this.handleSubmit}>
                    <div
                      className={
                        "form-field-group" +
                        (submitted && !email ? " has-error text-danger" : "")
                      }
                    >
                      <input
                        type="text"
                        className={
                          "login-input" + (submitted && !email ? " has-error" : "")
                        }
                        name="email"
                        value={email}
                        onChange={this.handleChange}
                        placeholder="Email"
                      />
                      {submitted && !email && (
                        <div className="help-block">Username is required</div>
                      )}
                    </div>
                    <div
                      className={
                        "form-field-group" +
                        (submitted && !password ? " has-error text-danger" : "")
                      }
                    >
                      <input
                        type="password"
                        className={
                          "login-input" +
                          (submitted && !password ? " has-error" : "")
                        }
                        name="password"
                        value={password}
                        onChange={this.handleChange}
                        placeholder="Password"
                      />
                      {submitted && !password && (
                        <div className="help-block">Password is required</div>
                      )}
                    </div>
                    <Row>
                      <Col className="pr-md-1" lg="4" md="6" sm="6">
                        <FormGroup>
                          <button className="btn btn-round btn-primary-v2">
                            Login
                          </button>
                          {loggingIn && !statusText && (
                            <img
                              loading="lazy"
                              alt="loading"
                              src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
                            />
                          )}
                        </FormGroup>
                      </Col>
                      <Col className="pl-md-1" lg="8" md="6" sm="6">
                        <FormGroup style={{lineHeight:"3rem"}}>
                          <div className="forgot-password">
                            <NavLink to="#" onClick={this.toggleResetPasswordModal}>Forgot Password</NavLink>
                          </div>
                        </FormGroup>
                      </Col>
                      <Col className="p4-md-1" sm="12">
                        <FormGroup style={{lineHeight:"3rem"}}>
                          <div className="register">
                            Don't have an account? <NavLink to="/register" onClick={this.toggleResetPasswordModal}>Register</NavLink>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>
                  </form>
                </div>
              </div>
            </div>
            <div>
              <Modal isOpen={this.state.modal} toggle={this.toggleResetPasswordModal} backdrop="static" className={this.props.className}>
                <div className="modal-header">
                  <h4 className="modal-title">Forgot Password</h4>
                  <button type="button" className="close" onClick={this.toggleResetPasswordModal} aria-label="Close" style={{color:"rgba(0, 0, 0, 0.6)"}}><span aria-hidden="true">×</span></button>
                </div>
                <ModalBody>
                  <form action="">
                      <FormGroup>
                        <label htmlFor="emailReset">A reset link will be sent to your email address</label>
                        <p className="text-danger">{this.state.resetPasswordText}</p>
                        <Input type="text" name="emailReset" id="emailReset" placeholder="Email Address" onChange={this.handleChange} />
                      </FormGroup>
                  </form>
                </ModalBody>
                <ModalFooter>
                  <Button color="info" onClick={this.handleResetPassword}>Reset Password</Button>{' '}
                  {this.state.resettingPassword && (
                    <img
                      alt="loading"
                      src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
                    />
                  )}
                  <Button color="secondary" onClick={this.toggleResetPasswordModal}>Cancel</Button>
                </ModalFooter>
              </Modal>
            </div>
          </div>
        );
      }
    }
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    login,
    sendResetPasswordRequest,
    getProviderPlaces,
    getProductCategoriesAllV2
  }
)(Login);
