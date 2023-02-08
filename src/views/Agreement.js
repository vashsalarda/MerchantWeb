import React from "react";
import { Link } from "react-router-dom";
import { getSession, setSession } from "../config/session";
import { connect } from "react-redux";  
import { getPageById, updatePage } from "../layouts/Admin/actions/PageActions";
import { PulseLoader } from 'react-spinners';
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
  Nav,
  NavItem,
  NavLink,
  Row,
  Col
} from "reactstrap";

class Agreement extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    let userInfo = {};
    if (userData !== null) {
      userInfo = userData.info;
    }
    super(props);
    this.state = {
      pageInfo: {},
      userExist: false,
      isLoading: false,
      isSaving: false,
      submitted: false,
      iAgree: false,
      user: {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        email: userData.email,
        phoneNumber: userInfo.mobileNumber,
        homeAddress: userInfo.homeAddress,
        photos: userInfo.photos ? userInfo.photos : null,
      },
      activeStep: 'step0',
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
            this.showNotificationError('There is an error retrieving the page information.');
          }
        } 
        if(result) {
          this.setState({
            pageInfo: result.page,
            isLoading: false, 
            iAgree: result.page.isVerified ? result.page.isVerified : false
          });
        } else {
          this.setState({ isLoading: false });
        }
      });
    }
  }

  handleCheckAgree = (e) => {
    let { type } = e.target;
    let checked = false
    if (type === "checkbox") {
      checked = e.target.checked ? true : false;
    }
    this.setState({iAgree:checked});
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
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let userData = JSON.parse(getSession("userData"));
    const place = { 
      isVerified: this.state.iAgree,
      isActive: this.state.activateAccount,
      dateAgreed: new Date().toISOString()
    }
    let sessionToken = "";
    if(userData) {
      sessionToken = userData.sessionToken;
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }

    if (pageInfo) {
      if(this.state.iAgree === true) {
        if (!window.confirm("Do you want to save these changes?")) {
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
              isVerified: place.isVerified,
              isActive: pageInfo.isActive,
              photos: pageInfo.photos,
              useCreatedProductCategory: pageInfo.useCreatedProductCategory,
              hideTutorials: pageInfo.hideTutorials,
              productUploadXLSEnabled: pageInfo.productUploadXLSEnabled ? true : false,
              productVouchersEnabled: pageInfo.productVouchersEnabled ? true : false
            }
            setSession('pageInfo',JSON.stringify(pageInfoUpdated));
            this.showNotification('You successfully agreed to our Terms & Conditions. You proceed creating your produt categories!');
            setTimeout(() => {
              this.setState({
                submitted: false,
                isSaving: false
              });
              this.props.history.push("/page");
            }, 1000);
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
        this.showNotificationError('You must agree with our Terms & Conditions to proceed!');
      }
    } else {
      setTimeout(() => { this.setState({ submitted: false, isSaving: false }); }, 1000);
      this.showNotificationError('Page information not found.');
    }
  }

  renderVerticalNavBar() {
    return(
      <Nav vertical >
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step0' ? " active-link" : "")} href="#intro" 
            onClick={() => { this.setState({activeStep: 'step0' } ) }}
          >
            Introduction
          </NavLink> 
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step1' ? " active-link" : "") } href="#step1" 
            onClick={() => { this.setState({ activeStep: 'step1' } ); }}
          >
            1&middot;  Mobile App Service
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step2' ? " active-link" : "") } href="#step2" 
            onClick={() => { this.setState({ activeStep: 'step2' } ); }}
          >
            2&middot; Provider Page Creation, Verification, and Activation
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step3' ? " active-link" : "") } href="#step3" 
            onClick={() => { this.setState({ activeStep: 'step3' } ); }}
          >
            3&middot; Publication of Products and Services
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step4' ? " active-link" : "") } href="#step4" 
            onClick={() => { this.setState({ activeStep: 'step4' } ); }}
          >
            4&middot; Payment Methods
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step5' ? " active-link" : "") } href="#step5" 
            onClick={() => { this.setState({ activeStep: 'step5' } ); }}
          >
            5&middot; Orders and User Payments
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step6' ? " active-link" : "") } href="#step6" 
            onClick={() => { this.setState({ activeStep: 'step6' } ); }}
          >
            6&middot; StreetBy Pay - Discounts, Promos, Points, and Wallet
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step7' ? " active-link" : "") }    href="#step7" 
            onClick={() => { this.setState({ activeStep: 'step7' } ); }}
          >
            7&middot; Other Charges
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step8' ? " active-link" : "") }    href="#step8" 
            onClick={() => { this.setState({ activeStep: 'step8' } ); }}
          >
            8&middot; Delivery
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step9' ? " active-link" : "") }    href="#step9" 
            onClick={() => { this.setState({ activeStep: 'step9' } ); }}
          >
            9&middot; StreetBy Commission and Billing
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step10' ? " active-link" : "") }    href="#step10" 
            onClick={() => { this.setState({ activeStep: 'step10' } ); }}
          >
            10&middot; Infractions
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step11' ? " active-link" : "") }    href="#step11" 
            onClick={() => { this.setState({ activeStep: 'step11' } ); }}
          >
            11&middot; App Limitations
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step12' ? " active-link" : "") }    href="#step12" 
            onClick={() => { this.setState({ activeStep: 'step12' } ); }}
          >
            12&middot; Version Updates
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step13' ? " active-link" : "") }    href="#step13" 
            onClick={() => { this.setState({ activeStep: 'step13' } ); }}
          >
            13&middot; Termination
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink className={"nav-link-vertical" + (this.state.activeStep && this.state.activeStep === 'step14' ? " active-link" : "") }    href="#step14" 
            onClick={() => { this.setState({ activeStep: 'step14' } ); }}
          >
            14&middot; Amendments
          </NavLink>
        </NavItem>
      </Nav>
    );
  }

  renderStep0() {
    return(
      <>
        <p id="intro">
          These Terms and Conditions ("Terms") constitute a legally binding agreement (“Agreement”) between Agila Innovations, Inc., a 
          company incorporated pursuant to the laws of the Philippines, with principal office address at Unit 301 3rd Floor, Starry Bldg., 
          Max Y. Suniel St., Carmen, Cagayan de Oro City, Philippines, in its capacity as the provider of the mobile application lifestyle 
          platform "StreetBy", and [Full Business Name]  duly organized and existing under the laws of the Philippines, with principal 
          address at [Complete Primary Address]  represented herein by its [Position of the Representative], [Name of Representative] for 
          the provision of the following services:
        </p>
        <p>In this Agreement, the words:</p>
        <p>"we," "us," "our" and "StreetBy" are used to refer to Agila Innovations, Inc. registered  under SEC registration number 
          CS201705224 and developer of the StreetBy mobile application;
        </p>  
        <p>"you" or "your", “Provider” and “merchant” is used to refer to [Full Business Name];</p>
        <p>
          "consumer", “customer” and  “user”  are used to refer to a natural person who uses the StreetBy mobile application (StreetBy 
          Mobile App”) and purchases products and services made available by the Provider via the StreetBy mobile application;
        </p>
        <p>“page” is used to refer to the business page created by [Full Business Name] for their Provider page;</p>
        <p>“products and services” is used to refer to the products or services of the Provider published and sold on the StreetBy platform;</p>
        <p>"prices” or “rates” are used to refer to the selling price of the product or service of the Merchant;</p>
        <p>“PayPal” is the online payment gateway for online credit and debit card payments;</p>
        <p>
          “payment gateway” is used to refer to a service which facilitates a payment transaction by the transfer of information between a 
          payment portal (such as a website, mobile phone or interactive voice response service) and the front end processor or acquiring 
          bank;
        </p>  
        <p>“Platform” is used to refer to the StreetBy Online platform service; an online marketplace that places one party in touch with 
          another, such as the Provider and the consumers.
        </p>
      </>
    )
  }

  renderStep1() {
    return(
      <>
        <h3 id="step1">1&middot; Mobile App Service</h3>
        <ul>
          <li>
            <span className="txt-bold">1.1</span>&middot; StreetBy Mobile App is a marketplace platform for various products and services published by partner 
            merchants and features a StreetBy Provider Solution, by which partner merchants can publish their products and services.
          </li>
          <li>
            <span className="txt-bold">1.2</span>&middot; Your usage of this StreetBy Provider Solution signifies you’ve agreed to the StreetBy User Terms and 
            Conditions pertaining to the Ratings and Reviews, Refunds and Returns, Notifications, Trademarks and Copyrights, Prohibited 
            Activities, Cookies, and Privacy Policy.
          </li>
          <li>
            <span className="txt-bold">1.3</span>&middot; StreetBy shall charge Provider a transactional fee equivalent to a percentage commission for every paid  
            transaction booked through the StreetBy Mobile App.
          </li>
          <li>
            <span className="txt-bold">1.4</span>&middot; StreetBy will assist User regarding StreetBy Mobile App technical issues.
          </li>
          <li>
            <span className="txt-bold">1.5</span>&middot; StreetBy shall carry out maintenance measures that ensure the proper or improved functioning of StreetBy 
            Mobile App. StreetBy may improve, enhance and modify the StreetBy Provider Solution and introduce new StreetBy services from 
            time to time;
          </li>
          <li>
            <span className="txt-bold">1.6</span>&middot; If you access or download the mobile application from the Apple App Store, you agree to Apple’s Licensed Application 
            End User License Agreement.
          </li>
        </ul>
      </>
    )
  }

  renderStep2() {
    return(
      <>
        <h3 id="step2">2&middot; Provider Page Creation, Verification, and Activation</h3>
        <ul>
          <li>
            <span className="txt-bold">2.1</span>&middot; The account (email and password) used upon registering as a User will serve as your account as a Provider.
          </li>
          <li>
            <span className="txt-bold">2.2</span>&middot; You agree to provide, maintain and update true, accurate, current, active, and complete information about your business as 
            prompted by the page creation process.
          </li>
          <li>
            <span className="txt-bold">2.3</span>&middot; You are allowed to create multiple pages under one Provider account.
          </li>
          <li>
            <span className="txt-bold">2.4</span>&middot; You are required to provide complete business information upon page creation. The following information required on page 
            setup will include but are not limited to, the following:
          </li>
            <ul>
              <li>
                Page name – name of business;
              </li>
              <li>
                Email address – active email address;
              </li>
              <li>
                Contact number/s – active mobile and landline numbers;
              </li>
              <li>
                Bank account – bank account details (account name, number, and bank name);
              </li>
            </ul>
          <li>
            <span className="txt-bold">2.5</span>&middot; You will be provided a verification code via short messaging service after submitting your mobile number.
          </li>
          <li>
            <span className="txt-bold">2.6</span>&middot; You may not impersonate any person or entity or misrepresent your identity or affiliation with any person or entity, 
            including using another person’s username, password, or other account information.
          </li>
          <li>
            <span className="txt-bold">2.7</span>&middot; You are entirely responsible for maintaining the confidentiality of your password and account and for all the activity you 
            made. If you believe that your account has been compromised, you must immediately contact us by email at: support@streetby.com.
            You agree to hold harmless StreetBy for losses incurred by you or another party due to someone else using your account as a 
            result of your failure to safeguard your password.
          </li>
          <li>
            <span className="txt-bold">2.8</span>&middot; StreetBy shall conduct page verification after initial page setup. For this purpose, you may be requested to submit 
            documents necessary to verify your business existence and ownership.
          </li>
          <li>
            <span className="txt-bold">2.9</span>&middot; StreetBy shall activate the page once the setup and verification process are complete.
          </li>
        </ul>
      </>
    );
  }

  renderStep3() {
    return(
      <>
        <h3 id="step3">3&middot; Publication of Products and Services</h3>
        <ul>
          <li>
            <span className="txt-bold">3.1</span>&middot; You may add products and services you intend to sell on the StreetBy Mobile App. 
          </li>
          <li>
            <span className="txt-bold">3.2</span>&middot; Mark-up will be allowed, provided that prices will remain reasonable and competitive in the market.
          </li>
          <li>
            <span className="txt-bold">3.3</span>&middot; You shall update the accurate information of the published product and services as necessary.
          </li>
          <li>
            <span className="txt-bold">3.4</span>&middot; StreetBy shall render the necessary assistance in setting up the Provider’s pages, or in publishing products and 
            information, as requested by the Provider.
          </li>  
          <li>
            <span className="txt-bold">3.5</span>&middot; You shall ensure that the product information, related content materials, and the offer and subsequent sale of any of the 
            products and services, comply with applicable Laws (including all minimum age, marking and labelling requirements, product 
            warranties, specifications, drawings, samples, and performance criteria) and do not contain any sexually explicit and implicit 
            (except to the extent expressly permitted in written form by StreetBy and allowed under applicable Laws), defamatory, or obscene 
            materials.
          </li>
        </ul>
      </>
    );
  }

  renderStep4() {
    return(
      <>
        <h3 id="step4">4&middot; Payment Methods</h3>
        <ul>
          <li>
            <span className="txt-bold">4.1</span>&middot; You are required to accept from three (3) modes of payment for StreetBy Mobile App transactions: (a) cash; (b) credit or 
            debit card through a payment gateway; and (c) PayPal account through PayPal gateway (d) GCash., in accordance with Section 9 
            hereof. Charges of 3.84% for global pay and paynamics, and 4.4%+15PHP Paypal fee will be charged from the merchant.
          </li>
        </ul>
      </>
    );
  }

  renderStep5() {
    return(
      <>
        <h3 id="step5">5&middot; Orders and User Payments</h3>
        <ul>
          <li>
            <span className="txt-bold">5.1</span>&middot; StreetBy is a platform for the sale of your products and services to consumers. Issues regarding damage, poor quality, and 
            false representation of your products and services are between you and the User, except in case of spoilage or adulteration of 
            the product due to any mishaps in delivery by StreetBy.
          </li>
          <li>
            <span className="txt-bold">5.2</span>&middot; You understand that Users’ booking options (dine-in, pick-up, delivery, booking for accommodation or service) are dependent 
            on your product application settings.
          </li>
          <li>
            <span className="txt-bold">5.3</span>&middot; You shall respond to Users’ bookings of products and services. You understand that User transaction fulfillment requires 
            either the confirmation or cancellation of an order. You shall coordinate with User and StreetBy support for application 
            transaction-related matters beyond the current application features or services, if any.
          </li>
          <li>
            <span className="txt-bold">5.4</span>&middot; The merchant shall provide the User with products consistent with the order details. StreetBy will consider paid 
            transactions as true and legitimate. Provided that StreetBy shall reimburse any commission billed in case of refunds of payment 
            by User due to glitches in the StreetBy Mobile App system.
          </li>
          <li>
            <span className="txt-bold">5.5</span>&middot; You are expected to only receive the total net amount for cash-on-delivery transactions (Price of product plus any related 
            fees less StreetBy Commission) and non-delivery cash transactions (Price of product plus any related fees less merchant or 
            StreetBy- initiated discounts, wallet or points used, if any) indicated on the order payment details, no more, no less. 
            Transactions through online gateway will be remitted as provided in Section 9.2.
          </li>
          <li>
            <span className="txt-bold">5.6</span>&middot; Unless provided with valid reason by both parties (User and provider), series of successive order cancellations by either 
            User or Provider may cause StreetBy to temporarily suspend account of either User or Provider, as the case maybe.
          </li>
          <li>
            <span className="txt-bold">5.7</span>&middot; StreetBy does not display the decimal values on home feed, search feed, and merchant pages for aesthetic purposes. The exact 
            value including the decimal value will be taken into account upon booking. 
          </li>
        </ul>
      </>
    );
  }

  renderStep6() {
    return(
      <>
        <h3 id="step6">6&middot; StreetBy Pay - Discounts, Promos, Points, and Wallet</h3>
        <ul>
          <li>
            <span className="txt-bold">6.1</span>&middot; You understand that StreetBy may occasionally extend discounts and promos to Users for promotional activities tagged as 
            StreetBy Pay on the application. The cost of said discounts and promotions shall be exclusively borne by StreetBy.
          </li>
          <li>
            <span className="txt-bold">6.2</span>&middot; These discounts and promos may or may not be used in conjunction with other promos. 
          </li>
          <li>
            <span className="txt-bold">6.3</span>&middot; You understand as well that User may earn points for their paid bookings. Orders still for confirmation and pending for 
            payment will not entitle User to earn points. Points earned are equivalent to the total worth of their paid order excluding 
            PayPal fee and other charges StreetBy may permit as excluded. 
          </li>
          <li>
            <span className="txt-bold">6.4</span>&middot; You understand that User may use points for payment or as deduction from their order payment before delivery charges:  Two 
            hundred (200) points is equal to One Peso (Php 1.00). 
          </li>
          <li>
            <span className="txt-bold">6.5</span>&middot; You understand that StreetBy allows User to use their StreetBy Wallet credits (i.e. Gift card credits) as payment for their 
            orders. 
          </li>
          <li>
            <span className="txt-bold">6.6</span>&middot; You understand that User will only pay the total amount indicated on the application - Gross price less the StreetBy Pay 
            (Discounts, Promos, Wallet, and Points) if any. In case of cash payment and the delivery is done by the Provider, as provided in 
            Sections 8.2 and 8.3, the total amount (including the Delivery fee)  indicated on the StreetBy Mobile App  should be collected 
            by you or your staff-in-charge, unless additional charges are agreed between User and Provider.
          </li>
        </ul>
      </>
    );
  }

  renderStep7() {
    return(
      <>
        <h3 id="step7">7&middot; Other Charges</h3>
        <ul>
          <li>
            <span className="txt-bold">7.1</span>&middot; You are required to accept from three (3) modes of payment for StreetBy Mobile App transactions: (a) cash; (b) credit or 
            debit card through a payment gateway; and (c) PayPal account through PayPal gateway (d) GCash., in accordance with Section 9 
            hereof. Charges of 3.84% for global pay and paynamics, and 4.4%+15PHP Paypal fee will be charged from the merchant.
          </li>
        </ul>
      </>
    );
  }

  renderStep8() {
    return(
      <>
        <h3 id="step8">8&middot; Delivery</h3>
        <ul>
          <li>
            <span className="txt-bold">8.1</span>&middot; StreetBy Delivery Service is a feature of the StreetBy Mobile App enabling Users to book orders and have orders delivered 
            from your business premises to the location entered by the User. 
          </li>
          <li>
            <span className="txt-bold">8.2</span>&middot; StreetBy Delivery Service can be operated by StreetBy, operated by a User registering as a partner delivery service (the 
            “partner-rider”), or can be operated by the merchant (as provider) by adding a product as exclusive delivery service.
          </li>
          <li>
            <span className="txt-bold">8.3</span>&middot; When a merchant chooses to deliver, it can only deliver its own products.
          </li>
          <li>
            <span className="txt-bold">8.4</span>&middot; In case of delivery by StreetBy, the order details shall indicate an estimated delivery pick-up time and delivery time. 
            Estimated times may be dependent on the merchant's preparation time and factors such as traffic, delivery service involved in an 
            accident, broken down vehicle, weather conditions, and events caused by external parties or acts of God. StreetBy shall properly 
            notify the User and the Provider in case StreetBy Delivery Service is not available. 
          </li>
          <li>
            <span className="txt-bold">8.5</span>&middot; Any damage or loss of product is the responsibility of the delivery service from the time it leaves the merchant’s business 
            premises up to the point it reaches the User provided that the packaging is secured, and the product is in good condition upon 
            pick-up.
          </li>
          <li>
            <span className="txt-bold">8.6</span>&middot; The merchant shall ensure the secured packaging of product to preserve temperature, quality, and avoid spillage. Delivery 
            service should ensure the merchant's responsibility for the packaging once they leave the merchant’s premises. If it is evident 
            that packaging is not secure, delivery service is entitled to return and request for an appropriate and secured packaging.
          </li>
          <li>
            <span className="txt-bold">8.7</span>&middot; Delay or return of delivery may be charged to the merchant due to missing item/s, unsecured packaging, or wrong item/s, 
            except if the same is due to StreetBy’s riders or partner-rider’s fault or negligence. In case of damage or spoilage to the 
            products due to StreetBy’s, or its directors’, officers’, employees’, agents’, assigns’, riders’, or partner-riders’ negligence, 
            fault, or omission, the cost of the damage, including but not limited to the replacement cost of the product, shall be borne by 
            StreetBy.
          </li>
        </ul>
      </>
    );
  }

  renderStep9() {
    return(
      <>
        <h3 id="step9">9&middot; StreetBy Commission and Billing</h3>
        <ul>
          <li>
            <span className="txt-bold">9.1</span>&middot; StreetBy will charge [Commission Rate] ([Commission Rate (Text)]) commission on the gross payment (price plus any related 
            charges) of every successful paid transaction, subject to Section 5.4 hereof.
          </li>
          <li>  
            <span className="txt-bold">9.2</span>&middot; Customer payments paid using the online gateway (credit card, debit, PayPal account) shall be credited to StreetBy’s payment 
            gateway account and gross price of Merchant’s product plus any additional charges by the merchant shall be credited every 15th 
            and 30th of the month to the PROVIDER (thru bank account deposit) less the commission, debit/credit card fees and charges, and 
            delivery services, if applicable, provided Merchant’s crediting account details are accurately setup. It is hereby understood 
            that StreetBy holds the sums payable to the Provider in trust, and StreetBy shall remit the same to the Provider without 
            unnecessary delay. The Provider shall be entitled to the full remedies available under this agreement and the law in case of 
            StreetBy’s non-remittance of the sums due to the Provider, including but not limited to, civil, criminal, and administrative 
            civil actions.
          </li>
          <li>  
            <span className="txt-bold">9.3</span>&middot; Cash transactions shall be billed accordingly: (a) for cash-on-delivery transactions, commission shall be deducted upon 
            payment of rider; (b) non-delivery cash transactions, commission shall be billed by StreetBy on a monthly schedule. 
          </li>
          <li>  
            <span className="txt-bold">9.4</span>&middot; StreetBy may, at some unforeseen or uncontrolled events, send a billing statement at a later date, the payment of which 
            shall be adjusted accordingly.  
          </li>
          <li>  
            <span className="txt-bold">9.5</span>&middot; Discounts, Promos, Points, and Wallet credits, collectively termed as StreetBy Pay, are accounted for by StreetBy as a 
            promotional tool extended to Users. Therefore, StreetBy should remit back these credits upon billing. StreetBy will remit the 
            total amount accounted as Discounts, Promos, Points, and Wallet credits for the month’s transactions as a deduction from 
            StreetBy’s commission fee. In the case that the total amount accounted as Discounts, Promos, Points, and Wallet credits for the 
            month’s transactions exceeds Provider’s payable to StreetBy, StreetBy shall pay for the excess amount to the Provider.
          </li>
        </ul>
      </>
    );
  }

  renderStep10() {
    return(
      <>
        <h3 id="step10">10&middot; Infractions</h3>
        <ul>
          <li>
            <span className="txt-bold">10.1</span>&middot; As a Provider, you are subject to the sanctions indicated on the infraction table which shall be provided by the account 
            manager upon completion of page verification.
          </li>
          <li>   
            <span className="txt-bold">10.2</span>&middot; You understand that StreetBy may temporarily deactivate your page in accordance to any infraction committed on the table. 
          </li>
          <li>   
            <span className="txt-bold">10.3</span>&middot; The infractions and corresponding sanctions are subject to change with prior notice and may be disseminated through any of 
            these channels: email, sms or push notification, or on-site visit.
          </li>
        </ul>
      </>
    );
  }

  renderStep11() {
    return(
      <>
        <h3 id="step11">11&middot; App Limitations</h3>
        <ul>
          <li>
            <span className="txt-bold">11.1</span>&middot; Due to the nature of the Internet, StreetBy Mobile App cannot guarantee the uninterrupted availability and accessibility of 
            the StreetBy Provider Solution. It can only be accessed through a validated distribution mobile application store and can only 
            be downloaded and updated from the Apple App Store and Google Playstore. StreetBy warrants any damages from accessing any non 
            verified website aside from the mentioned mobile application store.
          </li>
          <li>  
            <span className="txt-bold">11.2</span>&middot; There may be smartphone models whose specifications are not supported by StreetBy due to incompatibility or app 
            limitations. 
          </li>
        </ul>
      </>
    );
  }

  renderStep12() {
    return(
      <>
        <h3 id="step12">12&middot; Version Updates</h3>
        <ul>
          <li>
            <span className="txt-bold">12.1</span>&middot;  StreetBy shall advise Provider for any version updates through any of these methods: email, application feed, social 
            media, and push notifications. It is your responsibility to update to the latest required version for the application features 
            to function properly.
          </li>
        </ul>
      </>
    );
  }

  renderStep13() {
    return(
      <>
        <h3 id="step13">13&middot; Termination</h3>
        <ul>
          <li>
            <span className="txt-bold">13.1</span>&middot; A party has the right to terminate this agreement at anytime for whatever cause upon a prior thirty (30) day notice to the other 
            party. In case of any breach of the terms thereof which remain unremedied for a period of fifteen (15) days from the receipt of 
            the written notice from the aggrieved party, the aggrieved party may terminate this agreement immediately upon a prior written 
            notice to the erring party.
          </li>
        </ul>
      </>
    );
  }

  renderStep14() {
    return(
      <>
        <h3 id="step14">14&middot; Amendments</h3>
        <ul>
          <li>
            <span className="txt-bold">14.1</span>&middot; This agreement may be amended by the parties upon their mutual written agreement.
          </li>
          <li>
            <span className="txt-bold">14.2</span>&middot; This agreement is between the company and the provider only. StreetBy will not be liable for any agreement between the provider and it’s sub-merchants. 
          </li>
        </ul>
      </>
    );
  }
        
  renderPageVerified() {
    return(
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col sm="12" md="12" lg="12">
            <Card>
              <CardBody>
                <Alert color="success">
                  <h4 className="alert-heading">Already Agreed with our Terms & Policies</h4>
                  <hr />
                  <p className="mb-0">
                    Please update your store information. Click {" "} <Link to="/page">here</Link> {" "} to proceed your store.
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

  render() {
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
                    <h3 className="title text-navy">Statement of Agreement</h3>
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
        if(pageInfo.isVerified !== true) {
          return (
            <>
              <div className="content" style={{paddingBottom:'unset'}}>
                <div className="react-notification-alert-container">
                  <NotificationAlert ref="notify" />
                </div>
                <Row>
                  <Col md="12">
                    <Card style={{marginBottom:'unset'}}>
                      <CardHeader>
                        <h2 className="title text-navy">Statement of Agreement</h2>
                      </CardHeader>
                      <CardBody>
                        <Row>
                          <Col sm="12" md="3" lg="3">
                            {this.renderVerticalNavBar()}
                          </Col>
                          <Col sm="12" md="9" lg="9" style={{ lineHeight: '1.5rem' }}>
                            <Row>
                              <Col sm="12" className="soa">
                                {this.renderStep0()}
                                {this.renderStep1()}
                                {this.renderStep2()}
                                {this.renderStep3()}
                                {this.renderStep4()}
                                {this.renderStep5()}
                                {this.renderStep6()}
                                {this.renderStep7()}
                                {this.renderStep8()}
                                {this.renderStep9()}
                                {this.renderStep10()}
                                {this.renderStep11()}
                                {this.renderStep12()}
                                {this.renderStep13()}
                                {this.renderStep14()}
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12" style={{ marginTop: '15px', borderTop: '2px solid #004085' }}>
                            <Form>
                              <FormGroup>
                                <label style={{ marginTop: '15px' }}>
                                  <Input
                                    type="checkbox"
                                    className="enable-disable-checkbox"
                                    id="iAgree"
                                    name="iAgree"
                                    checked={this.state.iAgree}
                                    onChange={this.handleCheckAgree}
                                  />
                                  <span className="form-check-sign">
                                    <span className="check" />
                                  </span>
                                  <span className="txt-semi-bold">I agree with the Statement of Agrement</span>
                                </label>
                              </FormGroup>
                              <FormGroup>
                                <Button className="btn-fill btn-round" color="info" type="submit" onClick={this.handleSubmit}>
                                  SUBMIT
                                </Button>
                              </FormGroup>
                            </Form>
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
        } else {
          return(this.renderPageVerified());
        }
      } else {
        return (this.renderNoPageAdded());
      }
    }
  }
}

const mapStateToProps = () => ({});

//export default UserProfile;
export default connect(mapStateToProps,{getPageById, updatePage})(Agreement);