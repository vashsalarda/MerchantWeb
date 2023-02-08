import React from "react";
import { connect } from "react-redux";
import { NavLink } from 'react-router-dom';

import { login, sendResetPasswordRequest } from "./UserActions";
import { setSession, getSession } from "../../config/session";

import logo from "assets/img/login-logo.png";

class ForgotPassword extends React.Component {
  constructor(props) {
    super(props);

    //reset login status
    //this.props.dispatch(userActions.logout());

    this.state = {
      loggedIn: false,
      email: "",
      password: "",
      submitted: false
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  }

  handleSubmit(e) {
    e.preventDefault();

    this.setState({ submitted: true });
    const { email } = this.state;
    if (email) {
      this.setState({ loggingIn: true });
      this.props.sendResetPasswordRequest(email, (error, result) => {
        if (!error && result) {
          this.setLoading();
          window.location.reload();
          this.props.history.push("/products");
        } else {
          if (error) {
            const { status, } = error.response;
            this.setState({ status: status });
          }
          this.setLoading();
        }
      });
    }
  }

  setLoading() {
    this.setState(prevState => ({ loading: !prevState.loading }));
  }

  render() {
    const {
      email,
      password,
      submitted,
      loggingIn,
      status,
      statusText
    } = this.state;
    return (
      <div className="app">
        <div className="app-left">
          <div
            className="col-sm-12 col-lg-6"
            style={{ margin: "0 auto", position: "absolute", top: "25%" }}
          >
            <img alt="sb-logo" src={logo} />
          </div>
        </div>
        <div className="app-right">
          <div className="login-container">
            <div className="col-sm-12">
              <h2 className="page-title">STREETBY</h2>
              {!status ? (
                <p className="welcome-text">
                  Enter your email and we will send you a password reset link.
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
                    <div className="help-block">Please enter your email address</div>
                  )}
                </div>
                
                <div className="form-group align-center">
                  <div className="login">
                    <NavLink to="/login">Proceed to Login</NavLink>
                  </div>
                </div>
                <div className="form-group align-center">
                  <button className="btn btn-round btn-primary-v2">
                    Send Request
                  </button>
                  {loggingIn && !status && (
                    <img
                      alt="loading"
                      src="data:image/gif;base64,R0lGODlhEAAQAPIAAP///wAAAMLCwkJCQgAAAGJiYoKCgpKSkiH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQJCgAAACwAAAAAEAAQAAADMwi63P4wyklrE2MIOggZnAdOmGYJRbExwroUmcG2LmDEwnHQLVsYOd2mBzkYDAdKa+dIAAAh+QQJCgAAACwAAAAAEAAQAAADNAi63P5OjCEgG4QMu7DmikRxQlFUYDEZIGBMRVsaqHwctXXf7WEYB4Ag1xjihkMZsiUkKhIAIfkECQoAAAAsAAAAABAAEAAAAzYIujIjK8pByJDMlFYvBoVjHA70GU7xSUJhmKtwHPAKzLO9HMaoKwJZ7Rf8AYPDDzKpZBqfvwQAIfkECQoAAAAsAAAAABAAEAAAAzMIumIlK8oyhpHsnFZfhYumCYUhDAQxRIdhHBGqRoKw0R8DYlJd8z0fMDgsGo/IpHI5TAAAIfkECQoAAAAsAAAAABAAEAAAAzIIunInK0rnZBTwGPNMgQwmdsNgXGJUlIWEuR5oWUIpz8pAEAMe6TwfwyYsGo/IpFKSAAAh+QQJCgAAACwAAAAAEAAQAAADMwi6IMKQORfjdOe82p4wGccc4CEuQradylesojEMBgsUc2G7sDX3lQGBMLAJibufbSlKAAAh+QQJCgAAACwAAAAAEAAQAAADMgi63P7wCRHZnFVdmgHu2nFwlWCI3WGc3TSWhUFGxTAUkGCbtgENBMJAEJsxgMLWzpEAACH5BAkKAAAALAAAAAAQABAAAAMyCLrc/jDKSatlQtScKdceCAjDII7HcQ4EMTCpyrCuUBjCYRgHVtqlAiB1YhiCnlsRkAAAOwAAAAAAAAAAAA=="
                    />
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  { login, sendResetPasswordRequest }
)(ForgotPassword);

//export default Login;
