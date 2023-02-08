import React from "react";
import { connect } from "react-redux";
import { NavLink } from 'react-router-dom';
import { register } from "./UserActions";
import { addPage, getPageTypes} from "../Admin/actions/PageActions";
import { setSession, getSession } from "../../config/session";
import api from "../../config/api";
import LoadingOverlay from 'react-loading-overlay';

import logo from "assets/img/login-logo.png";

import { 
  Alert,
  Button,
  Col,
  Form,
  FormGroup,
  Input,
  Row
} from "reactstrap";

class Register extends React.Component {
  constructor(props) {
    super();
    this.state = {
      loggedIn: false,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      storeName: "",
      address: "",
      city: "",
      postalCode: "",
      numberOfEmployees: "",
      pageType: "",
      validPhoneNumber: false,
      submitted: false,
      isLoading: true,
      signingUp: false,
      pageTypes: [],
      cities: [],
      visible: false,
      alertText: "",
      alertColor: "primary",
      lat: 8.48479728734788,
      lng: 124.65104731086728,
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
      this.props.getPageTypes((error, result) => {
        if (!error && result) {
          this.setState({ pageTypes: result });
        }
      });
      api().get('/provider/supported-cities')
        .then(response => {
          if(response && response.data) {
              const cities = response.data;
              this.setState({cities});
            this.setState({isLoading:false});
          } else {
            this.setState({isLoading:false});
          }
        })
        .catch(error => {
          this.setState({isLoading:false});
        })
      return this.setState({ loggedIn: false });
    }
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    if(name === 'city' && value) {
      const { cities } = this.state;
      const selectedCity = cities && cities.length > 0 ? cities.find(item => item.name === value) : {};
      const { location: { coordinates } } = selectedCity && selectedCity.location ? selectedCity : {};
      if(coordinates && coordinates.length > 0 ) {
        const latVal = Number(coordinates[1]);
        const lngVal = Number(coordinates[0]);
        if(latVal > 0 && lngVal > 0) {
          this.setState({
            lat: latVal,
            lng: lngVal
          });
        } else {
          this.setState({
            lat: 8.48479728734788,
            lng: 124.65104731086728,
          });
          this.showNotificationError('Map coordinates values are invalid!');
        }
      }
    }
    this.setState({ [name]: value });
  }

  handleSubmit = (e) => {
    e.preventDefault();
    this.setState({ submitted: true, statusText: "" });
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      storeName,
      address,
      pageType,
      city,
      postalCode,
      numberOfEmployees,
      validPhoneNumber
    } = this.state;

    const user = {
      firstName,
      lastName,
      email,
      contactNumber: phone,
      password,
    }

    const place = {
      name: storeName, 
      addressLine1: address,
      pageType,
      city,
      postalCode,
      location: {
        coordinates: [this.state.lng,this.state.lat],
      },
      numberOfEmployees
    }

    if (firstName && lastName && email && phone && password && confirmPassword && storeName && address && pageType && numberOfEmployees && city && postalCode  && validPhoneNumber) {
      if(password !== confirmPassword) {
        this.setState({ statusText: "Your password confirmation did not match passwords did not match." });
      } else {
        this.setState({ signingUp: true });
        this.props.register(user, (error, result) => {
          if (!error && result) {
            if(result.sessionToken && result.userId && result.email) {
              if (storeName && address && pageType && city && postalCode) {
                this.props.addPage(place, result.sessionToken, (error, resultPage) => {
                  if (error) {
                    console.error({error});
                    this.setState({ submitted:false, signingUp:false });
                    if(error instanceof String) {
                      this.showNotificationError(error);
                    } else if(error.response && error.response instanceof String) {
                      this.showNotificationError(error.response);
                    } else {
                      this.showNotificationError('There is an problem saving the page. Please try again!');
                    }
                  } else {
                    this.setState({ 
                      submitted:false, 
                      signingUp:false,
                      loggedIn: false,
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      password: "",
                      confirmPassword: "",
                      storeName: "",
                      address: "",
                      city: "",
                      postalCode: "",
                      numberOfEmployees: "",
                      pageType: "",
                      validPhoneNumber: false
                    });
                    this.showNotification('You successfully created your merchant account. You will be redirected to activation.');
                    const userData = {
                      info: result.info,
                      email: result.email,
                      userId: result.userId,
                      isGuest: result.isGuest ? result.isGuest : false,
                      isAdmin: result.isAdmin ? result.isAdmin : false,
                      isSBTours: result.isSBTours ? result.isSBTours : false,
                      sessionToken: result.sessionToken,
                      createdAt: result.createdAt,
                    }
                    if(resultPage && resultPage.place) {
                      const { place } = resultPage;
                      const pageInfo = {
                        _id: place._id,
                        name: place.name,
                        addressLine1: place.addressLine1,
                        city: place.city,
                        country: "",
                        province: "",
                        postalCode: place.postalCode,
                        pageType: place.pageType,
                        bankaccount: {},
                        isVerified: false,
                        isActive: false,
                        photos: {},
                        useCreatedProductCategory: false,
                        hideTutorials: true,
                        productUploadXLSEnabled: place.productUploadXLSEnabled ? true : false,
                        productVouchersEnabled: place.productVouchersEnabled ? true : false
                      }
                      setSession('pageInfo',JSON.stringify(pageInfo));
                      setSession('defaultPage',JSON.stringify(place._id));
                    }
                    setSession('userData',JSON.stringify(userData));
                    setSession('hasCategories',false);
                    setSession('hasProducts',false);
                    setTimeout(() => {
                      this.props.history.push("/statement-of-agreement");
                      window.location.reload();
                    }, 3000);
                  }
                });
              } else {
                this.setState({ submitted:true, signingUp:false  });
                this.showNotificationError('Some field are required! Please fill the missing fields.');
              }
            }
          } else {
            if (error) {
              this.setState({ submitted:false, signingUp:false });
              if(error.status==='error') {
                if(error.message==="Network Error") {
                  this.showNotificationError('Network Error. Please check your connection.');
                } else {
                  this.showNotificationError(error.message);
                }
              } else if (error.response && error.response.data && error.response.data.message) {
                const message = error.response.data.message;
                if(message && typeof message === 'string') {
                  this.showNotificationError(message);
                } else {
                  this.showNotificationError('There is an error in signing up. Please try again.');
                }
              }
              this.setLoading();
            }
          }
        });
      }
    } else {
      this.showNotificationError('Some fields are missing. Please complete the form to continue.');
    }
  }

  handlePhoneNumber = (e) => {
    const { value } = e.target;
    this.setState({ phone: value });
    const OK = reg.exec(value);
    if (OK)  {
      this.setState({ validPhoneNumber: true });
    } else {
      this.setState({ validPhoneNumber: false });
    } 
  }  

  setLoading() {
    this.setState(prevState => ({ loading: !prevState.loading }));
  }

  onDismiss = () => {
    this.setState({ visible: false, alertText: "", alertColor: "primary" });
  }

  showNotification = (text) => {
    this.setState({ visible: true, alertText: text , alertColor: "success" });
  }

  showNotificationError = (text) => {
    this.setState({ visible: true, alertText: text, alertColor: "danger"  });
  }

  renderPageTypes() {
    if (this.state.pageTypes !== undefined || this.state.pageTypes !== null) {
      const activePageTypes = this.state.pageTypes.filter(
        item => (item.isActive = !false)
      );

      return activePageTypes.map((item, index) => (
        <option key={index} value={item._id}>
          {item.name}
        </option>
      ));
    }
  }

  renderCities(cities) {
    if (cities && cities.length > 0) {
      const activePageTypes = cities.filter(
        item => (item.isActive = !false)
      );
      return activePageTypes.map((item, index) => (
        <option key={index} value={item.name}>
          {item.name}
        </option>
      ));
    }
  }

  render() {
    const userData = JSON.parse(getSession("userData"));
    if(userData) {
      this.props.history.push("/products");
      window.location.reload();
    } else {
      const {
        firstName,
        lastName,
        email,
        phone,
        password,
        confirmPassword,
        storeName,
        address,
        city,
        postalCode,
        numberOfEmployees,
        pageType,
        submitted,
        statusText,
        validPhoneNumber
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
              <div className="register-container">
                <div className="col-lg-12">
                  <h2 className="page-title">Sign Up as New Merchant</h2>
                  {!statusText ? (
                    <p className="welcome-text">&nbsp;</p>
                  ) : (
                    <p className="welcome-text text-danger">{statusText}</p>
                  )}
                  <Alert color={this.state.alertColor} isOpen={this.state.visible} toggle={this.onDismiss} fade={false}>
                    {this.state.alertText}
                  </Alert>
                  <Form name="form" onSubmit={this.handleSubmit}>
                    <Row>
                      <div
                        className={"form-field-group col-md-6 col-sm-6" + (submitted && !firstName ? " has-error text-danger" : "")}
                      >
                        <Input
                          type="text"
                          bsSize="lr"
                          className={(submitted && !firstName ? " has-error " : "")}
                          name="firstName"
                          value={firstName}
                          onChange={this.handleChange}
                          placeholder="First Name"
                        />
                        {submitted && !firstName && (<div className="help-block">First Name is required</div>)}
                      </div>
                      <div
                        className={"form-field-group col-md-6 col-sm-6" + (submitted && !lastName ? " has-error text-danger" : "")}
                      >
                        <Input
                          type="text"
                          bsSize="lr"
                          className={(submitted && !lastName ? " has-error" : "")}
                          name="lastName"
                          value={lastName}
                          onChange={this.handleChange}
                          placeholder="Last Name"
                        />
                        {submitted && !lastName && (
                          <div className="help-block">Last Name is required</div>
                        )}
                      </div>
                    </Row>
                    <Row>
                      <div
                        className={"form-field-group col-sm-12" + (submitted && !storeName ? " has-error text-danger" : "")}
                      >
                        <Input
                          type="text"
                          bsSize="lr"
                          className={(submitted && !storeName ? " has-error " : "")}
                          name="storeName"
                          value={storeName}
                          onChange={this.handleChange}
                          placeholder="Store Name"
                        />
                        {submitted && !storeName && (<div className="help-block">Store Name is required</div>)}
                      </div>
                    </Row>
                    <Row>
                      <div
                        className={"form-field-group col-md-6 col-sm-6" + (submitted && !email ? " has-error text-danger" : "")}
                      >
                        <Input
                          type="text"
                          bsSize="lr"
                          className={(submitted && !email ? " has-error " : "")}
                          name="email"
                          value={email}
                          onChange={this.handleChange}
                          placeholder="Email"
                        />
                        {submitted && !email && (<div className="help-block">Email is required</div>)}
                      </div>
                      <div
                        className={"form-field-group col-md-6 col-sm-6" + (submitted && (!phone || !validPhoneNumber) ? " has-error text-danger" : "")}
                      >
                        <Input
                          type="text"
                          bsSize="lr"
                          className={(submitted && !phone && !validPhoneNumber ? " has-error" : "")}
                          name="phone"
                          value={phone}
                          onChange={this.handlePhoneNumber}
                          placeholder="Phone"
                        />
                        {submitted && !phone && (
                          <div className="help-block">Phone No. is required</div>
                        )}
                        {submitted && !validPhoneNumber && (
                          <div className="help-block">Phone No. is not valid</div>
                        )}
                        
                      </div>
                    </Row>
                    <Row>
                      <FormGroup
                        className={"form-field-group col-sm-12" + (submitted && !address ? " has-error text-danger" : "")}
                      >
                        <Input
                          type="text"
                          bsSize="lr"
                          className={(submitted && !address ? " has-error " : "")}
                          name="address"
                          value={address}
                          onChange={this.handleChange}
                          placeholder="Address"
                        />
                        {submitted && !address && (<div className="help-block">Address is required</div>)}
                      </FormGroup>
                    </Row>
                    <Row>
                      <Col md="6">
                        <FormGroup
                          className={"form-field-group" + (submitted && !city ? " has-error text-danger" : "")}
                        >
                          <Input
                            id="city"
                            bsSize="lr"
                            name="city"
                            placeholder="City/Town"
                            type="select"
                            value={city}
                            onChange={this.handleChange}
                          >
                            <option value="">City/Town</option>
                            {this.renderCities(this.state.cities)}
                          </Input>
                          {submitted && !city && (<div className="help-block">City/Town is required</div>)}
                        </FormGroup>
                      </Col>
                      <Col md="6">
                        <FormGroup
                          className={"form-field-group" + (submitted && !postalCode ? " has-error text-danger" : "")}
                        >
                          <Input
                            bsSize="lr"
                            name="postalCode"
                            placeholder="Postal Code"
                            type="text"
                            value={postalCode}
                            onChange={this.handleChange}
                          />
                          {submitted && !postalCode && (<div className="help-block">Postal Code is required</div>)}
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>
                      <Col sm="12" md="6">
                        <FormGroup
                          className={"form-field-group" + (this.state.submitted && !pageType ? " has-error text-danger" : "")}
                        >
                          <Input
                            id="pageType"
                            bsSize="lr"
                            name="pageType"
                            placeholder="Select Industry"
                            type="select"
                            value={pageType}
                            onChange={this.handleChange}
                          >
                            <option value="">Select Industry</option>
                            {this.renderPageTypes()}
                          </Input>
                          {submitted && !pageType && (<div className="help-block">Industry is required</div>)}
                        </FormGroup>
                      </Col>
                      <Col sm="12" md="6">
                        <FormGroup
                          className={"form-field-group" + (submitted && !numberOfEmployees ? " has-error text-danger" : "")}
                        >
                          <Input
                            bsSize="lr"
                            name="numberOfEmployees"
                            placeholder="No. of Employees"
                            type="number"
                            value={numberOfEmployees}
                            onChange={this.handleChange}
                          />
                          {submitted && !numberOfEmployees && (<div className="help-block">No. of Employees is required</div>)}
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row>  
                      <div
                        className={"form-field-group col-md-6 col-sm-6" + (submitted && !password ? " has-error text-danger" : "")}
                      >
                        <Input
                          type="password"
                          bsSize="lr"
                          className={(submitted && !password ? " has-error " : "")}
                          name="password"
                          value={password}
                          onChange={this.handleChange}
                          placeholder="Password"
                        />
                        {submitted && !password && (
                          <div className="help-block">Password is required</div>
                        )}
                      </div>
                      <div
                        className={"form-field-group col-md-6 col-sm-6" + (submitted && !confirmPassword ? " has-error text-danger" : submitted && password !== "" && password !== confirmPassword ? " has-error text-danger" : "")}
                      >
                      <Input
                        type="password"
                        bsSize="lr"
                        className={(submitted && !confirmPassword ? " has-error" : submitted && password !== confirmPassword ? " has-error" : "")}
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={this.handleChange}
                        placeholder="Confirm Password"
                      />
                      {submitted && !confirmPassword && (<div className="help-block">Please confirm password</div>)}
                      {submitted && password !== "" && password !== confirmPassword && (<div className="help-block">Confirm Password did not match</div>)}
                    </div>
                    </Row>
                    <Row>
                      <Col className="pr-md-1" lg="4" md="6" sm="6">
                        <FormGroup>
                          <Button className="btn-lg btn-round btn-primary-v2">
                            Sign Up
                          </Button>
                        </FormGroup>
                      </Col>
                      <Col className="p4-md-1" sm="12">
                        <FormGroup style={{lineHeight:"3rem"}}>
                          <div className="login">
                            Have an account?  <NavLink to="/login">Log in</NavLink>
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>
                  </Form>
                </div>
              </div>
            </div>
            <LoadingOverlay
              active={this.state.signingUp}
              spinner
              text='Saving...'
              >
            </LoadingOverlay>
          </div>
        );
      }
    }
  }
}

const reg = /^\(?([0-9]{11})$/;
const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    register,
    addPage,
    getPageTypes
  }
)(Register);
