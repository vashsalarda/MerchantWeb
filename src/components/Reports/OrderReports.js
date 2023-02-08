import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import queryString from "query-string";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import { format } from "date-fns";
import { PulseLoader } from "react-spinners";
import Switch from "react-toggle-switch";
import { 
  getOrdersList,
  getOrdersListGrocery,
  getOrderListXls 
} from "../../layouts/Admin/actions/ProductActions";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

import {
  Alert,
  FormGroup,
  Input,
  Button,
  Table,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Row,
  Col
} from "reactstrap";

import "react-datepicker/dist/react-datepicker.css";

class Reports extends React.Component {
  constructor(props) {
    super(props);
    const datesStr = new Date().toISOString()
    this.state = {
      page: {},
      transactions: [],
      startDate: new Date(),
      endDate: new Date(),
      startDateStr: datesStr,
      endDateStr: datesStr,
      selectedPaymentMethod: '',
      pagination: {},
      activePage: 1,
      sortBy: "",
      sort: "",
      status: "paid",
      isLoading: false,
      isGrocery: false,
      isGeneratingXls: false,
      debugMode: false
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const defaultPage = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
    const pageInfo = JSON.parse(getSession("pageInfo"));
    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If Grocery
      this.setState({isGrocery:true});
    }
    if (defaultPage && defaultPage!=="") {
      this.props.getPageById(defaultPage, sessionToken, (error, result) => {
        if (error) {
          this.showNotificationError('An error occured. Cannot find the page information!');
        } else {
          if(result) {
            const { _id, name, addressLine1: address, city, province, email, balances } = result.page;
            this.setState({
              page: {
                _id,
                name,
                address,
                city,
                province,
                email,
                balances,
              }
            });
          } else {
            this.showNotificationError('Page not found.');
          }
        }
      });
    }
  }

  handleChangeStartDate = (date) => {
    const datesStr = new Date(date).toISOString()
    this.setState({startDate: date})
    this.setState({startDateStr: datesStr})
  }

  handleChangeEndDate = (date) => {
    const datesStr = new Date(date).toISOString()
    this.setState({endDate: date})
    this.setState({endDateStr: datesStr})
  }

  handleChangePaymentMethod = (e) => {
    let { value } = e.target;
    this.setState({ selectedPaymentMethod: value });
  }

  handleChangeStatus = (e) => {
    let { value } = e.target;
    this.setState({ status: value });
  }

  handleChangeDebugMode = (e) => {
    this.setState(prevState => ({debugMode: !prevState.debugMode}));
  }

  onDismiss = () => {
    this.setState({ hideTutorials: true });
    let pageInfo = JSON.parse(getSession("pageInfo"));
    pageInfo.hideTutorials = true;
    setSession('pageInfo',JSON.stringify(pageInfo));
  }

  onHideTutorials = () => {
    if (!window.confirm("Are you sure you want to hide this section permanently?")) {
      return false;
    }
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const place = { 
      hideTutorials: true
    }
    api(sessionToken).patch(`/provider/places/${pageInfo._id}`, place)
      .then(response => {
        if (response && response.data && response.data.status === 'ok') {
          this.setState({ hideTutorials: true });
          pageInfo.hideTutorials = true;
          setSession('pageInfo',JSON.stringify(pageInfo));
        } else {
          this.showNotificationError('An unknown error occured. Please try again!');
        }
      })
      .catch(error => {
        this.setState({ submitted: false, isSaving: false });
        if(error.response && typeof error.response === 'string' ) {
          this.showNotificationError(error.response);
        } else {
          this.showNotificationError('An unknown error occured. Please try again!');
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

  generateList = () => {
    let sort = "";
    let sortBy = "price";
    let pageId = JSON.parse(getSession("defaultPage"));
    if (this.state.sort !== "desc") {
      sort = "desc";
    } else {
      sort = "asc";
    }
    
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.startDateStr;
    query.dateEnd = this.state.endDateStr;
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    }
    if(this.state.debugMode) {
      query.debugMode = this.state.debugMode;
    }
    query.pageId = pageId;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.generateTxnsList(queryStr);
  }

  exportList = () => {
    this.setState({ isGeneratingXls: true });
    let sort = "";
    let sortBy = "price";
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const { sessionToken }
     = userData;
    if (this.state.sort !== "desc") {
      sort = "desc";
    } else {
      sort = "asc";
    }
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.startDateStr;
    query.dateEnd = this.state.endDateStr;
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    }
    if(this.state.debugMode) {
      query.debugMode = this.state.debugMode;
    }
    query.pageId = pageId;
    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    if (userData !== null) {
      this.props.getOrderListXls(
        query,
        sessionToken,
        (error, result) => {
          if (result && result.data && result.data.status === 'success' && result.data.filename) {
            const fileName = result.data.filename;
            this.setState({ isGeneratingXls: false });
            window.open(fileName);
          } else {
            this.setState({ isGeneratingXls: false });
            this.showNotificationError('No transactions found.');
          }
        }
      );
    } else {
      this.setState({ isGeneratingXls: false });
    }
  }

  generateTxnsList(queryStr) {
    this.setState({isLoading:true});
    const query = queryString.parse(queryStr);
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const { sessionToken } = userData;
    
    if (userData !== null) {
      if(pageInfo) {
        if(this.state.isGrocery) {
          this.props.getOrdersListGrocery(
            query,
            sessionToken,
            (error, result) => {
              if (!error && result && result.data) {
                const txns = result.data;
                this.setState({
                  transactions: txns,
                });
              }
              this.setState({ isLoading: false });
            }
          );
        } else {
          this.props.getOrdersList(
            query,
            sessionToken,
            (error, result) => {
              if (!error && result && result.data) {
                const txns = result.data;
                this.setState({
                  transactions: txns,
                });
              }
              this.setState({ isLoading: false });
            }
          );
        }
      }
    }
  }

  renderRows() {
    let colSpan = 13;
    if(this.state.isGrocery) {
      colSpan = 12;
    }
    if(this.state.isLoading) {
      return (
        <tr>
          <td colSpan={colSpan}>
            <PulseLoader
              sizeUnit={"px"}
              size={15}
              color={'#1d8cf8'}
              loading={this.state.isLoading}
            />
          </td>
        </tr>
      );
    } else {
      if (
        this.state.transactions instanceof Array &&
        this.state.transactions.length > 0
      ) {
        return this.state.transactions.map((item, index) => (
          <tr key={index}>
            <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(item.createdAt),"MMM dd, yyyy")}<br/>{format(new Date(item.createdAt),"hh:mm:aa")}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{ item.datePaid && format(new Date(item.datePaid),"hh:mm:aa")}<br/>{item.datePaid && format(new Date(item.datePaid),"hh:mm:aa")}</td>
            <td>{lastSixDigits(item.orderId)}</td>
            <td>{item.itemName}</td>
            <td align="center">{item.quantity}</td>
            <td>&#8369;{item.price ? numberWithCommas(item.price) : "0.00"}</td>
            <td>&#8369;{item.productsTotal ? numberWithCommas(item.productsTotal) : "0.00"}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{format(new Date(item.bookedForDate),"hh:mm:aa")}<br/>{format(new Date(item.bookedForDate),"hh:mm:aa")}</td>
            <td>{item.status.toUpperCase()}</td>
          </tr>
        ));
      } else {
        return (
          <tr>
            <td colSpan={colSpan}>
              <h5 className="text-danger">
                <em>No transactions found.</em>
              </h5>
            </td>
          </tr>
        );
      }
    }
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

  renderPageNotVerified() {
    return(
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col sm="12" md="12" lg="12">
            <Card>
              <CardBody>
                <Alert color="danger">
                  <h4 className="alert-heading">You Have Not Agreed with our Terms & Policies</h4>
                  <hr />
                  <p className="mb-0">
                    You must agree  with our Terms & Policies. Click {" "} <Link to="/statement-of-agreement">here</Link> {" "} to read our Terms & Policies.
                  </p>
                </Alert>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
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

  render() {
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const hasProducts = JSON.parse(getSession("hasProducts"));
    const hasCategories = JSON.parse(getSession("hasCategories"));
    if(pageInfo && pageInfo._id) {
      if(pageInfo.isVerified === true) {
        if(hasProducts === true) {
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
                        <h4 className="title">Order List - <em>{this.state.page.name}</em></h4>
                        {!pageInfo.hideTutorials &&
                          <Row>
                            <Col sm="12">
                              <Row>
                                <Col md="12">
                                  <Alert className="alert-compact" color="primary" isOpen={!this.state.hideTutorials} toggle={this.onDismiss} fade={false}>
                                    <h4 className="alert-heading">New on Order Reports?</h4>
                                    <hr />
                                    <p className="mb-0">
                                      Check our videos here on how to manage your Order Reports.<br /> 
                                    </p>
                                    <a className="btn btn-sm btn-primary-v2" href="https://www.youtube.com/watch?v=k8VEDqbPv7w">View Tutorials</a>
                                    <Button
                                      className="btn-fill btn-sm"
                                      color="danger"
                                      type="button"
                                      onClick={this.onHideTutorials}
                                    >
                                      Hide Permanently
                                    </Button>
                                  </Alert>
                                </Col>
                              </Row>
                            </Col>
                          </Row>
                        }
                        <Row>
                          {hasCategories && hasProducts && pageInfo.isActive !== true &&
                            <Col sm="12">
                              <Row>
                                <Col md="12">
                                  <Alert color="danger">
                                    <h4 className="alert-heading">Store Not Activated</h4>
                                    <hr />
                                    <p className="mb-0">
                                      You must activate your store so it will appear in the app and you can start selling.<br /> 
                                      Click {" "} <Link to="/activate-store">here</Link> {" "} to activate you store.
                                    </p>
                                  </Alert>
                                </Col>
                              </Row>
                            </Col>
                          }
                          <Col className="pr-md-1" md="3">
                            <FormGroup>
                              <label htmlFor="startDate" className="control-label" style={{display:'block'}}>
                                Start Date:
                              </label>
                              <DatePicker
                                name="startDate"
                                className="form-control"
                                selectsStart
                                startDate={this.state.startDate}
                                endDate={this.state.endDate}
                                selected={this.state.startDate}
                                onChange={this.handleChangeStartDate}
                              />
                            </FormGroup>
                          </Col>
                          <Col className="px-md-1" md="3">
                            <FormGroup>
                              <label htmlFor="endDate" className="control-label" style={{display:'block'}}>
                                End Date:
                              </label>
                              <DatePicker
                                name="endDate"
                                selectsEnd
                                startDate={this.state.startDate}
                                endDate={this.state.endDate}
                                className="form-control"
                                selected={this.state.endDate}
                                onChange={this.handleChangeEndDate}
                              />
                            </FormGroup>
                          </Col>
                          <Col className="px-md-1" md="2">
                            <FormGroup>
                              <label htmlFor="paymentMethod" className="control-label">
                                Payment Method:
                              </label>
                              <Input
                                id="paymentMethod"
                                name="paymentMethod"
                                type="select"
                                onChange={this.handleChangePaymentMethod}
                                value={this.state.selectedPaymentMethod}
                              >
                                <option value="">All</option>
                                <option value="cash">Cash</option>
                                <option value="paynamics">Paynamics</option>
                                <option value="paymongo">Paymongo</option>
                                <option value="cc">Paypal</option>
                                <option value="direct-transfer">Direct Transfer</option>
                                <option value="gcash">G-Cash</option>
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col className="px-md-1" md="2">
                            <FormGroup>
                              <label htmlFor="status" className="control-label">
                                Status:
                              </label>
                              <Input
                                id="status"
                                name="status"
                                type="select"
                                onChange={this.handleChangeStatus}
                                value={this.state.status}
                              >
                                <option value="">All</option>
                                <option value="for_confirmation">For Confirmation</option>
                                <option value="payment_pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="void">Void</option>
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col className="pr-md-1" md="3">
                            <FormGroup>
                              <label className="control-label">
                                <Switch
                                  onClick={this.handleChangeDebugMode}
                                  on={this.state.debugMode}
                                />
                                &nbsp;Show Test Txns
                              </label>
                            </FormGroup>
                          </Col>
                        </Row>
                        <Row>
                          <Col md="12">
                            <FormGroup>
                              <Button className="btn-round" color="info" type="button" onClick={this.generateList}>
                                Generate
                              </Button>
                              <Button className="btn-round" color="info" type="button" onClick={this.exportList}>
                                Export
                              </Button>
                            </FormGroup>
                          </Col>
                        </Row>
                      </CardHeader>
                      <CardBody>
                        <Table className="tablesorter table-striped fs12" responsive>
                          <thead className="text-primary bg-gray">
                            <tr>
                              <th>Date Placed</th>
                              <th>Date Paid</th>
                              <th>Order ID</th>
                              <th>Item Name</th>
                              <th>Quantity</th>
                              <th>SRP</th>
                              <th>Total</th>
                              <th>Booked For Date</th>
                              <th>Order Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {this.renderRows()}
                          </tbody>
                        </Table>
                      </CardBody>
                      <CardFooter>
                      </CardFooter>
                    </Card>
                  </Col>
                </Row>
              </div>
              <LoadingOverlay
                active={this.state.isGeneratingXls}
                spinner
                text='Generating...'
                >
              </LoadingOverlay>
            </>
          );
        } else {
          return (this.renderNoProductsAdded());
        }
      } else {
        return (this.renderPageNotVerified());
      }
    } else {
      return (this.renderNoPageAdded());
    }
  }
}

const numberWithCommas = x => {
  return priceRound(x).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const priceRound = (price, dec) => {
  if (dec === undefined) {
    dec = 2;
  }
  if (price !== 0) {
    if (!price || isNaN(price)) {
      throw new Error("price is not a number" + price);
    }
  }
  const str = parseFloat(Math.round(price * 100) / 100).toFixed(dec);

  return str;
};

const lastSixDigits = (string) => {
  let str = string.toString();
  let sixDigits = new Array(str.length - 6 + 1).join('') + str.slice(-6);
  return "..." + sixDigits;
}

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    getOrdersList,
    getOrdersListGrocery,
    getOrderListXls,
    getPageById,
  }
)(Reports);