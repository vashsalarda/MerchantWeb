import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import api from "../../config/api";
import queryString from "query-string";
import {
  saveNewStatus,
  pickUp,
  cancelAction,
  checkIfMine,
  receivePayment,
  fetchSingleOrderData
} from "../../layouts/Admin/actions/OrderActions";
import { getSession, setSession } from "../../config/session";
import { PulseLoader } from "react-spinners";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Pagination from "react-js-pagination";
import NotificationAlert from "react-notification-alert";
import { Alert, Card, CardHeader, CardBody, CardFooter, Table, Row, Col, Media, Button,
  Badge, Input, FormGroup
} from "reactstrap";
import DatePicker from "react-datepicker";
import Select from 'react-select';
import LoadingOverlay from 'react-loading-overlay';
import Switch from "react-toggle-switch";
import { format, startOfDay, endOfDay, addHours, subSeconds } from 'date-fns';

import logoBlu from "assets/img/sb-pin-logo-blu.png";

class Orders extends React.Component {
  constructor(props) {
    super();
    this.toggleDrop = this.toggleDrop.bind(this);
    const datesStartStr = format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss");
    const datesEndStr = format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss");
    this.state = {
      orders: [],
      dateStart: startOfDay(new Date()),
      dateEnd: endOfDay(new Date()),
      dateStartStr: datesStartStr,
      dateEndStr: datesEndStr,
      timeStart: 0,
      timeEnd: 24,
      deliveryTime: '10001359',
      filterDate: 'deliveryDate',
      showTests: false,
      sort: "created",
      sortBy: "desc",
      size: 25,
      selectedPaymentMethod: '',
      singleDetails: [],
      modal: false,
      modalConfirm: false,
      nestedModal: false,
      closeAll: false,
      dropdownOpen: false,
      reason: "",
      pagination: {},
      activePage: 1,
      subReason: "",
      isLoading: true,
      isLoadingOrderDetail: true,
      canPickUp: false,
      status: "",
      search: "",
      showPickUpModal: false,
      showPaymentModal: false,
      providerNote: "",
      shoppers: [],
      shopperOptions: [],
      isGrocery: false,
      isGeneratingXls: false,
    };
  }

  componentDidMount() {
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let pageId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = JSON.parse(getSession("userData"));
    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If Grocery
      this.setState({isGrocery:true});
      if(sessionToken && pageId) {
        api(sessionToken).get(`/provider/places/${pageId}/get-shoppers`)
          .then(resp => {
            if(resp && resp.data) {
              const shoppers = resp.data;
              let shopperOptions = [];
              shoppers.forEach(item => {
                const shopper = {
                  value: item._id,
                  label: `${item.firstName} ${item.lastName} (${item.email})`,
                }
                shopperOptions.push(shopper);
              });
              const optionFirst = [
                {
                  value: "",
                  label: "Select",
                }
              ]
              shopperOptions = [...optionFirst,...shopperOptions];
              this.setState({ 
                shopperOptions,
                shoppers
              });
            }
          })
          .catch(error => {
            console.error({error});
          });
      }
    }
    let url = this.props.location.search;
    let query = queryString.parse(url);
    let activePage = query.page ? Number(query.page) : this.state.activePage;
    let status = query.status ? query.status : this.state.status;
    let sort = query.sort ? query.sort : this.state.sort;
    let sortBy = query.sortBy ? query.sortBy : this.state.sortBy;
    let search = query.search ? query.search : this.state.search;
    let size = query.size ? query.size : this.state.size;
    let selectedPaymentMethod = query.selectedPaymentMethod ? query.selectedPaymentMethod : this.state.selectedPaymentMethod;
    let filterDate = query.filterDate ? query.filterDate : this.state.filterDate;
    let dateStart = query.dateStart ? new Date(query.dateStart) : this.state.dateStart;
    let dateEnd = query.dateEnd ? new Date(query.dateEnd) : this.state.dateEnd;
    let dateStartStr = query.dateStart ? format(new Date(query.dateStart),"yyyy-MM-dd'T'HH:mm:ss") : this.state.dateStartStr;
    let dateEndStr = query.dateEnd ? format(new Date(query.dateEnd),"yyyy-MM-dd'T'HH:mm:ss") : this.state.dateEndStr;
    let queryStr = "?" + queryString.stringify(query);
    this.setState({
      activePage: activePage,
      status: status,
      sort: sort,
      sortBy: sortBy,
      search: search,
      size: size,
      dateStart: dateStart,
      dateEnd: dateEnd,
      dateStartStr: dateStartStr,
      dateEndStr: dateEndStr,
      selectedPaymentMethod: selectedPaymentMethod,
      filterDate: filterDate,
      singleDetails: this.state.orders[0],
      pageName: pageInfo && pageInfo.name ? pageInfo.name : ''
    });
    let defaultPage = JSON.parse(getSession("defaultPage"));
    this.refreshOrders(queryStr, defaultPage);
  }

  toggleConfirm = () => {
    this.setState(prevState => ({
      modalConfirm: !prevState.modalConfirm
    }));
  }

  toggle = () => {
    this.setState(prevState => ({
      modal: !prevState.modal,
      reason: "",
      subReason: ""
    }));
  }

  toggleDrop = () => {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  toggleNested = () => {
    this.setState({
      nestedModal: !this.state.nestedModal,
      closeAll: false
    });
  }

  toggleAll = () => {
    this.setState({
      nestedModal: !this.state.nestedModal,
      closeAll: true
    });
  }

  togglePickupModal = () => {
    this.setState(prevState => ({
      showPickUpModal: !prevState.showPickUpModal
    }));
  }

  handleChangeKeyword = (e) => {
    let { value } = e.target;
    this.setState({ search: value });
  }

  handleChangeStartDate = (date) => {
    const datesStr = format(new Date(date), "yyyy-MM-dd'T'HH:mm:ss");
    this.setState({dateStart: date});
    this.setState({dateStartStr: datesStr});
    this.setState({isLoading:true});
    this.setState({isLoadingOrderDetail:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = datesStr;
    query.dateEnd = this.state.dateEndStr;
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    } else {
      delete query.status;
    }
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleChangeEndDate = (date) => {
    const datesStr = format(new Date(date), "yyyy-MM-dd'T'HH:mm:ss");
    this.setState({dateEnd: date});
    this.setState({dateEndStr: datesStr});
    this.setState({isLoading:true});
    this.setState({isLoadingOrderDetail:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.dateStartStr;
    query.dateEnd = datesStr;
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    } else {
      delete query.status;
    }
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleChangeFilterDate = (e) => {
    let { value } = e.target;
    this.setState({filterDate:value});
    this.setState({isLoading:true});
    this.setState({isLoadingOrderDetail:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.dateStartStr;
    query.dateEnd = this.state.dateEndStr;
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(value !== '') {
      query.filterDate = value;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    } else {
      delete query.status;
    }
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleChangePaymentMethod = (e) => {
    let { value } = e.target;
    this.setState({selectedPaymentMethod:value});
    this.setState({isLoading:true});
    this.setState({isLoadingOrderDetail:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.dateStartStr;
    query.dateEnd = this.state.dateEndStr;
    if(value !== '') {
      query.selectedPaymentMethod = value;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    } else {
      delete query.status;
    }
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleChangeStatus = (e) => {
    let { value } = e.target;
    if(value) {
      this.setState({status:value});
    } else {
      this.setState({status:''});
    }
    this.setState({isLoading:true});
    this.setState({isLoadingOrderDetail:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.dateStartStr;
    query.dateEnd = this.state.dateEndStr;
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(value !== '') {
      query.status = value;
    } else {
      delete query.status;
    }
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleChangeDate = (date) => {
    const { timeStart, timeEnd } = this.state;
    const dateStart = addHours(startOfDay(new Date(date)),timeStart);
    const dateEnd = subSeconds(addHours(startOfDay(new Date(date)),timeEnd),1);
    this.setState({
      dateStart,
      dateEnd,
      isLoading: true,
      isLoadingOrderDetail: true
    });
    const defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = format(new Date(dateStart), "yyyy-MM-dd'T'HH:mm:ss");
    query.dateEnd = format(new Date(dateEnd), "yyyy-MM-dd'T'HH:mm:ss");
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    } else {
      delete query.status;
    }
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleChangeDeliveryTime = (e) => {
    const time = e.target.value;
    let timeStart = 0, timeEnd = 24;
    if(time) {
      if(time==='14001659') {
        timeStart = 14;
        timeEnd = 17;
      } else if(time==='17002059') {
        timeStart = 17;
        timeEnd = 21;
      } else if(time==='10002059') {
        timeStart = 10;
        timeEnd = 21;
      }
    }
    const { dateStart, dateEnd } = this.state;
    const dateStartNew = addHours(startOfDay(new Date(dateStart)),timeStart);
    const dateEndNew = subSeconds(addHours(startOfDay(new Date(dateEnd)),timeEnd),1);
    this.setState({
      timeStart,
      timeEnd,
      deliveryTime: time,
      dateStart: dateStartNew,
      dateEnd: dateEndNew,
      isLoading: true,
      isLoadingOrderDetail: true
    });
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = format(new Date(dateStartNew),"yyyy-MM-dd'T'HH:mm:ss");
    query.dateEnd = format(new Date(dateEndNew),"yyyy-MM-dd'T'HH:mm:ss");
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    } else {
      delete query.status;
    }
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleToggleShowTests = (e) => {
    const prevStatus = this.state.showTests
    this.setState(prevState => ({showTests: !prevState.showTests}));
    this.setState({isLoading:true});
    this.setState({isLoadingOrderDetail:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    query.dateStart = this.state.dateStartStr;
    query.dateEnd = this.state.dateEndStr;
    if(this.state.selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = this.state.selectedPaymentMethod;
    } else {
      delete query.selectedPaymentMethod;
    }
    if(this.state.filterDate !== '') {
      query.filterDate = this.state.filterDate;
    } else {
      delete query.filterDate;
    }
    if(this.state.search !== '') {
      query.search = this.state.search;
    } else {
      delete query.search;
    }
    if(this.state.status !== '') {
      query.status = this.state.status;
    } else {
      delete query.status;
    }
    query.showTests = prevStatus ? "no" : "yes"
    delete query.page
    let queryStr = "?" + queryString.stringify(query);
    this.refreshOrders(queryStr, defaultPage);
  }

  handleChangeShopper = (e) => {
    const shopper = this.state.singleDetails.shopper;
    let { value } = e;
    if(shopper && shopper._id === value) {
      return false;
    }
    if (value) {
      if (!window.confirm("Are you sure you want to update the shopper?")){
        return false;
      }
      const pageId = JSON.parse(getSession("defaultPage"));
      const { sessionToken } = JSON.parse(getSession("userData"));
      const orderId = this.state.singleDetails._id;
      let newShopper = {};
      if(value && value !== '') {
        newShopper = this.state.shoppers.find(item => item._id === value);
        newShopper.pageId = pageId;
      }
      const body = {
        shopper: newShopper
      }
      if(sessionToken) {
        api(sessionToken).patch(`/provider/places/${pageId}/orders/${orderId}/update-order`,body)
          .then(response => {
            if (response && response.data) {
              this.setState({
                singleDetails: {
                  ...this.state.singleDetails,
                  shopper: newShopper
                }
              });
              this.showNotification('Shopper was successfully updated.');
            }
          })
          .catch(error => {
            this.setState({ submitted: false, isSaving: false });
            if(error.response && typeof error.response === 'string' ) {
              this.showNotificationError(error.response);
            } else {
              this.showNotificationError('There is a error updating the shopper!');
            }
          });
      }
    } else {
      this.showNotificationError('Please select a shopper!');
    }
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
    if (message && typeof message === "string") {
      const notification = {
        place: "tc",
        message: (
          <div>
            <div>{message}</div>
          </div>
        ),
        type: "success",
        icon: "",
        autoDismiss: 2
      };
      if(notification && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      } else {
        console.error(`'this.refs.notify.notificationAlert' not found!`);
      }
    }
  }

  showNotificationError(message, place) {
    if (message && typeof message === "string") {
      const notification = {
        place: place || "tc",
        message: (
          <div>
            <div>{message}</div>
          </div>
        ),
        type: "danger",
        icon: "",
        autoDismiss: 2
      };
      if(notification  && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      } else {
        console.error(`'this.refs.notify.notificationAlert' not found!`);
      }
    }
  }

  renderDetails() {
    const order = this.state.singleDetails;
    let user = JSON.parse(getSession("userData"));
    let pageId = JSON.parse(getSession("defaultPage"));
    let email = "";
    let sessionToken = "";
    if(user && user.email) {
      email = user.email;
      sessionToken = user.sessionToken;
    }
    if (this.state.isLoadingOrderDetail) {
      return (
        <table>
          <tbody>
            <tr>
              <td colSpan="8">
                <PulseLoader
                  sizeUnit={"px"}
                  size={15}
                  color={"#1d8cf8"}
                  loading={this.state.isLoadingOrderDetail}
                />
              </td>
            </tr>
          </tbody>
        </table>
      );
    } else {
      if (this.state.orders instanceof Array && this.state.orders.length > 0) {
        return (
          <Card>
            <CardBody>
              <center>
                <h4 className="text-navy" style={{ fontSize:18, fontWeight: "600" }}>
                  Order No.: <span style={{ fontFamily:'monospace'}}>{order._id.toString()}</span>
                </h4>
              </center>
              <div style={{ display: 'flex', flexDirection: 'row', marginTop: 25 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                  <div>
                    {this.renderImage(this.state.singleDetails)}
                  </div>
                  <div style={{ paddingLeft: 10, paddingTop: 5 }}>
                    <p style={{ fontWeight: '600', color: '#3B3A39', fontSize: 14 }}>
                      {this.state.singleDetails.customer.firstName} {this.state.singleDetails.customer.lastName}
                    </p>
                    <p style={{ fontWeight: '600', color: '#3B3A39', fontSize: 14 }}>
                      {this.state.singleDetails.customer.mobileNumbers[0]}
                    </p>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="roundLabel dining-option" style={{ backgroundColor: '#F8BF45', width: '60%' }}>
                      {order.products[order.products.length - 1].diningOption}
                    </div>
                    <div className="roundLabel selected-payment-option" style={{ backgroundColor: '#D16E66', width: '60%' }}>
                      { order.selectedPaymentOption === "gcash" && order.paymongoDetail && order.paymongoDetail.commissionPercentage
                        ?
                        <>
                          paymongo gcash
                        </>
                        :
                        <>
                          {order.selectedPaymentOption}
                        </>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
            <div>
              <FormGroup>
                <Col sm="12">
                  <label className="control-label" style={{ fontSize:'12px' }}>Payment Status: {this.renderOrderStatus(order.status)}</label>
                </Col>
                { this.state.isGrocery &&
                  <Col sm="12">
                    <Input
                      disabled={this.state.singleDetails.status === "cancelled" || this.state.singleDetails.status === "void" || this.state.singleDetails.requestedForVoid}
                      style={{ marginTop:'5px', width:'auto' }}
                      className="form-control-sm"
                      type="select"
                      onChange={(e) => {
                        const status = e.target.value
                        if(status && status.length > 0) {
                          if (!window.confirm("Are you sure you want to update this order?")){
                            return false
                          }
                        } else {
                          this.showNotificationError("No status selected. Please select a status!")
                          return false
                        }
                        order.status = status
                        this.setState({
                          singleDetails: {
                            ...this.state.singleDetails,
                            status: status
                          }
                        });
                        const body = {
                          status: order.status
                        }
                        if(sessionToken) {
                          api(sessionToken).patch(`/provider/places/${pageId}/orders/${order._id}/update-order`,body)
                            .then(response => {
                              if (response && response.data) {
                                const orders = this.state.orders;
                                const currentOrder = (item) => item._id === order._id;
                                const index = orders.findIndex(currentOrder);
                                orders[index] = order;
                                this.setState({
                                  orders: orders
                                });
                                this.showNotification('Order was successfully updated.');
                              }
                            })
                            .catch(error => {
                              this.setState({ submitted: false, isSaving: false });
                              if(error.response && typeof error.response === 'string' ) {
                                this.showNotificationError(error.response);
                              } else {
                                this.showNotificationError('There is a error updating the order!');
                              }
                            });
                          }
                        }
                      }
                      value={this.state.singleDetails.status}
                    >
                      <option value="">Select</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancel</option>
                      <option value="void">Void</option>
                    </Input>
                  </Col>
                }
              </FormGroup>
              <FormGroup>
                  <Col sm="12">
                    <label className="control-label" style={{ fontSize:'12px' }}>Order Status: {this.renderDeliveryStatusBadge(order.orderStatus)}</label>
                  </Col>
                  { this.state.isGrocery &&
                    <Col sm="12">
                      <Input
                        disabled={this.state.singleDetails.status === "cancelled" || this.state.singleDetails.status === "void" || this.state.singleDetails.requestedForVoid}
                        style={{ marginTop:'5px', width:'auto' }}
                        type="select"
                        className="form-control-sm"
                        onChange={(e) => {
                          const status = e.target.value;
                          if(status && status.length > 0) {
                            if (!window.confirm("Are you sure you want to update this order?")){
                              return false
                            }
                          } else {
                            this.showNotificationError("No status selected. Please select a status!")
                            return false
                          }
                          let proceed = true;
                          let { orderStatus } = order;
                          let lastOrderStatus = {}
                          if(orderStatus instanceof Array && orderStatus.length > 0) {
                            lastOrderStatus = orderStatus[orderStatus.length-1];
                          }
                          const deployedStatus = {
                            time: new Date(),
                            email,
                            status: "Deployed"
                          };
                          const pickedupStatus = {
                            time: new Date(),
                            email,
                            status: "Picked up"
                          };
                          const paidStatus = {
                            time: new Date(),
                            email,
                            status: "Paid"
                          };
                          const completedStatus = {
                            time: new Date(),
                            email,
                            status: "Order Completed"
                          };

                          if (lastOrderStatus && lastOrderStatus.status) {
                            const lastStatus = lastOrderStatus.status;
                            if(lastStatus && lastStatus.status && lastStatus.status === "Requested for void") {
                              this.showNotificationError('Order is already is requested for void! Please mark the order "Void"');
                            }
                            if (status === "Confirmed") {
                              this.showNotificationError("Order is already confirmed!");
                              proceed = false;
                            } else if (status === "Deployed") {
                              if(lastStatus === "Confirmed") {
                                orderStatus = [...orderStatus,deployedStatus];
                              } else if(lastStatus === "Deployed") {
                                this.showNotificationError("Order is already deployed!");
                                proceed = false;
                              } else if(lastStatus === "Picked up") {
                                this.showNotificationError("Order is already picked up!");
                                proceed = false;
                              } else if(lastStatus === "Order Completed") {
                                this.showNotificationError("Order is already completed!");
                                proceed = false;
                              } else if(lastStatus === "Paid") {
                                this.showNotificationError("Order is already paid!");
                                proceed = false;
                              }  else if(lastStatus === "Received Order") {
                                this.showNotificationError("Cannot update because the order was already received!")
                                proceed = false;
                              } else if(lastStatus === "Requested for void") {
                                this.showNotificationError("Cannot update because the order has been requested for void!")
                                proceed = false;
                              } else {
                                this.showNotificationError(`Cannot update because the order. Order status is ${lastStatus}!`)
                                proceed = false;
                              }
                            } else if (status === "Picked up") {
                              if(lastStatus === "Confirmed") {
                                orderStatus = [...orderStatus,deployedStatus,pickedupStatus];
                              } else if(lastStatus === "Deployed" || lastStatus === "Ready to Pickup") {
                                orderStatus = [...orderStatus,pickedupStatus];
                              } else if(lastStatus === "Picked up") {
                                this.showNotificationError("Order is already picked up!");
                                proceed = false;
                              } else if(lastStatus === "Order Completed") {
                                this.showNotificationError("Order is already completed!");
                                proceed = false;
                              } else if(lastStatus === "Paid") {
                                this.showNotificationError("Order is already paid!");
                                proceed = false;
                              }  else if(lastStatus === "Received Order") {
                                this.showNotificationError("Cannot update because the order was already received!")
                                proceed = false;
                              } else if(lastStatus === "Requested for void") {
                                this.showNotificationError("Cannot update because the order has been requested for void!")
                                proceed = false;
                              } else {
                                this.showNotificationError(`Cannot update because the order. Order status is ${lastStatus}!`)
                                proceed = false;
                              }
                            } else if (status === "Order Completed") {
                              if(lastStatus === "Confirmed") {
                                orderStatus = [...orderStatus,deployedStatus,pickedupStatus,paidStatus,completedStatus];
                              } else if(lastStatus === "Deployed") {
                                orderStatus = [...orderStatus,pickedupStatus,paidStatus,completedStatus];
                              } else if(lastStatus === "Picked up" || lastStatus === "Ready to Pickup") {
                                orderStatus = [...orderStatus,paidStatus,completedStatus]
                              } else if(lastStatus === "Paid") {
                                orderStatus = [...orderStatus,completedStatus]
                              } else if(lastStatus === "Order Completed") {
                                this.showNotificationError("Order is already completed!")
                                proceed = false;
                              } else if(lastStatus === "Paid") {
                                this.showNotificationError("Order is already paid!")
                                proceed = false;
                              } else if(lastStatus === "Received Order") {
                                this.showNotificationError("Cannot update because the order was already received!")
                                proceed = false;
                              } else if(lastStatus === "Requested for void") {
                                this.showNotificationError("Cannot update because the order has been requested for void!")
                                proceed = false;
                              } else {
                                this.showNotificationError(`Cannot update because the order. Order status is ${lastStatus}!`)
                                proceed = false;
                              }
                            } else {
                              if(lastStatus === "Confirmed") {
                                this.showNotificationError("Order is already confirmed!");
                                proceed = false;
                              } else if(lastStatus === "Deployed") {
                                this.showNotificationError("Order is already deployed!");
                                proceed = false;
                              } else if(lastStatus === "Picked up") {
                                this.showNotificationError("Order is already picked up!");
                                proceed = false;
                              } else if(lastStatus === "Order Completed") {
                                this.showNotificationError("Order is already completed!");
                                proceed = false;
                              } else if(lastStatus === "Paid") {
                                this.showNotificationError("Order is already paid!");
                                proceed = false;
                              }  else if(lastStatus === "Received Order") {
                                this.showNotificationError("Cannot update because the order was already received!")
                                proceed = false;
                              } else if(lastStatus === "Requested for void") {
                                this.showNotificationError("Cannot update because the order has been requested for void!")
                                proceed = false;
                              } else {
                                this.showNotificationError(`Cannot update because the order. Order status is ${lastStatus}!`)
                                proceed = false;
                              }
                            }
                          }
                          if(proceed) {
                            order.orderStatus = orderStatus
                            const body = {
                              orderStatus: order.orderStatus,
                            }
                            if(status === "Order Completed" || status === "Paid") {
                              order.status = "paid"
                            }
                            if(sessionToken) {
                              api(sessionToken).patch(`/provider/places/${pageId}/orders/${order._id}/update-order`, body)
                                .then(response => {
                                  if (response && response.data) {
                                    const orders = this.state.orders;
                                    const currentOrder = (item) => item._id === order._id;
                                    const index = orders.findIndex(currentOrder);
                                    orders[index] = order;
                                    this.setState({
                                      orders: orders,
                                      singleDetails: order
                                    });
                                    this.showNotification('Order was successfully updated.');
                                  }
                                })
                                .catch(error => {
                                  this.setState({ submitted: false, isSaving: false });
                                  if(error.response && typeof error.response === 'string' ) {
                                    this.showNotificationError(error.response);
                                  } else {
                                    this.showNotificationError('There is a error updating the order!');
                                  }
                                });
                            }
                          }
                        }}
                        value={this.state.singleDetails.orderStatus && this.state.singleDetails.orderStatus.length > 0 ? this.state.singleDetails.orderStatus[this.state.singleDetails.orderStatus.length-1].status : ""}
                      >
                        <option value="">Select</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Deployed">Deployed</option>
                        <option value="Picked up">Picked Up</option>
                        <option value="Order Completed">Order Completed</option>
                      </Input>
                    </Col>
                  }
                </FormGroup>
              <FormGroup>
                <Col sm="12" style={{ textAlign:'right' }}>      
                  <Button color="link" aria-label="PDF" style={{ padding: "0.5rem 0.25rem" }}>
                    <span aria-hidden>
                      <Fa
                        icon="file-pdf"
                        size={'lg'}
                        onClick={() => {
                          this.printMinDetails(order._id);
                        }}
                      />
                    </span>
                  </Button>
                  <Button color="link" aria-label="Print" style={{ padding: "0.5rem 0.25rem" }}>
                    <span aria-hidden>
                      <Fa
                        icon="print"
                        size={'lg'}
                        onClick={() => {
                          this.printDetails(order._id);
                        }}
                      />
                    </span>
                  </Button>
                </Col>
              </FormGroup>
              <FormGroup>
                <Col sm="12">
                  <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
                </Col>
              </FormGroup>
            </div>
            <Col sm="12">
              <Table borderless responsive style={{fontSize: "12px", marginBottom:'0'}}>
                <thead>
                  <tr>
                    <th>&nbsp;</th>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {this.renderProducts(this.state.singleDetails)}
                  {this.renderAddedProducts(this.state.singleDetails)}
                </tbody>
              </Table>
            </Col>
            <CardBody>
              {this.renderPaymentInfo()}
              {this.renderOrderInfo(this.state.singleDetails)}
              {this.renderCustomerInfo(this.state.singleDetails)}
              { this.state.isGrocery &&
                this.renderShopperInfo(this.state.singleDetails && this.state.singleDetails.shopper)
              }
              {this.state.singleDetails.isDelivery && this.renderDeliveryStatus()}
            </CardBody>
          </Card>
        );
      } else {
        return (
          <Table borderless>
            <tbody>
              <tr>
                <td colSpan="7">
                  <label className="text-danger">
                    <em>No Orders found.</em>
                  </label>
                </td>
              </tr>
            </tbody>
          </Table>
        );
      }
    }
  }
  
  renderPaymentInfo() {
    const order = this.state.singleDetails;
    const { page } = order;
    const markupValue = page && page.markup && page.markup.value ? page.markup.value : 0;
    const markupRate = markupValue/100;
    let containerFee = 0;
    const serviceCharge = (order.extraFees && order.extraFees.serviceCharge) || 0;
    let { products, addedProducts } = order;
    if(addedProducts && addedProducts instanceof Array && addedProducts.length > 0) {
      products = [...products,...addedProducts];
    }
    const newProducts = products.filter(item => item.unavailable !== true);
    let grandTotal = 0;
    let itemsTotal = 0;
    let convenienceFee = 0;
    const deliveryFee = order.delivery && order.delivery[0] && order.delivery[0].fee ? order.delivery[0].fee : 0;
    const cargoFee = order.convenienceFee && order.convenienceFee.value ? order.convenienceFee.value : 0;
    const pointsAmountUsed = order.pointsAmountUsed ? order.pointsAmountUsed : 0;
    const walletAmountUsed = order.walletAmountUsed ? order.walletAmountUsed : 0;
    let promos = order.orderPromoDiscount ? order.orderPromoDiscount : 0;
    let productPromos = 0;
    newProducts.forEach(item => {
      itemsTotal += item.price * item.quantity;
      if(item.markup && item.markup > 0) {
        convenienceFee += item.markup * item.quantity;
      } else {
        convenienceFee += item.price * item.quantity * markupRate;
      }
      if(item.containerFee && item.containerFee.amount) {
        const delivery = item.containerFee.supportedOrderOption && item.containerFee.supportedOrderOption.delivery ? item.containerFee.supportedOrderOption.delivery : false
        const pickup = item.containerFee.supportedOrderOption && item.containerFee.supportedOrderOption.pickup ? item.containerFee.supportedOrderOption.pickup : false
        const days = item.days > 1 ? item.days : 1
        if(item.diningOption==="delivery" && delivery) {
          containerFee += item.containerFee.amount * item.quantity * days
        } else if (item.diningOption==="pickup" && pickup) {
          containerFee += item.containerFee.amount * item.quantity * days
        }
      }
      if(item.promos && item.promos.length > 0) {
        const promo = item.promos[0];
        const promoType = promo.calculation.type;
        const promoValue = promo.calculation.value;
        let days = 1;
        if(item.days && item.days > 1) {
          days = item.days;
        }
        if (promoType === 'percent') {
          productPromos += (item.price * item.quantity * days) * (promoValue / 100);
        } else {
          productPromos += promoValue;
        }
      }
      promos += productPromos;
    })

    let gatewayFees = 0
    const totalCustomer = itemsTotal + convenienceFee + cargoFee + containerFee + serviceCharge + deliveryFee
    if (order.selectedPaymentOption === 'paynamics') {
      const commissionRate = order.paynamicsDetail.commissionPercentage;
      if (order.paynamicsDetail.commissionType === 'customer') {
        gatewayFees = (totalCustomer / (1 - commissionRate)) - totalCustomer;
      }
    } else if (order.selectedPaymentOption === 'paymongo') {
      const commissionRate = order.paymongoDetail.commissionPercentage
      const commissionFixed = order.paymongoDetail.commissionFixed
      const commissionFixedCondition = order.paymongoDetail.commissionFixedCondition ? order.paymongoDetail.commissionFixedCondition : 0
      if (order.paymongoDetail.commissionType === 'customer') {
        gatewayFees = ((totalCustomer + commissionFixed) / (1 - commissionRate)) - totalCustomer;
      } else if (order.paymongoDetail.commissionType === 'streetby' && totalCustomer > commissionFixedCondition ) {
        gatewayFees = commissionFixed
      }
    }
    
    if(this.state.isGrocery) {
      grandTotal = itemsTotal + convenienceFee + cargoFee + containerFee + serviceCharge + deliveryFee + gatewayFees
    } else {
      grandTotal = itemsTotal + convenienceFee + cargoFee + containerFee + serviceCharge + gatewayFees
    }
    const customerPayout = grandTotal - (pointsAmountUsed + walletAmountUsed + promos)
    
    return (
      <div style={{color: 'rgba(34, 42, 66, 0.7) !important' ,fontSize:'12px'}}>
        <div style={{ display:'flex', flexDirection:'row', justifyContent:'space-between', marginBottom: 8 }}>
          <label className="control-label">Items Total</label>
          <label className="txt-medium label-secondary">&#8369;{numberWithCommas(itemsTotal)}</label>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
        { this.state.isGrocery
          ?
          <>
            <div style={{ display:'flex', flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
              <label>Cargo Fee</label>
              <label className="label-secondary">&#8369;{numberWithCommas(cargoFee)}</label>
            </div>
            <div style={{ display:'flex', flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
              <label>Convenience Fee</label>
              <label className="label-secondary">&#8369;{numberWithCommas(convenienceFee)}</label>
            </div>
          </>
          :
          <>
            <div style={{ display:'flex', flexDirection:'row', justifyContent:'space-between', marginBottom:10 }}>
              <label>Container Fee</label>
              <label className="label-secondary">&#8369;{numberWithCommas(containerFee)}</label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <label>Service Fee</label>
              <label className="label-secondary">&#8369;{numberWithCommas(serviceCharge)}</label>
            </div>
          </>
        }
        { this.state.isGrocery &&
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <label>Delivery Fee</label>
            <label className="label-secondary">&#8369;{numberWithCommas(deliveryFee)}</label>
          </div>
        }
        { gatewayFees > 0 &&
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <label className="text-success">Gateway Fees</label>
            <label className="text-success">&#8369;{numberWithCommas(gatewayFees)}</label>
          </div>
        }
        { promos > 0 &&
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 10, fontStyle: 'italic' }}>
            <label>Promos</label>
            <label className="label-secondary">&#8369;{numberWithCommas(promos)}</label>
          </div>
        }
        { walletAmountUsed > 0 &&
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 10, fontStyle: 'italic' }}>
            <label>Wallet</label>
            <label className="label-secondary">&#8369;{numberWithCommas(walletAmountUsed)}</label>
          </div>
        }
        { pointsAmountUsed > 0 &&
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 10, fontStyle: 'italic' }}>
            <label>Points</label>
            <label className="label-secondary">&#8369;{numberWithCommas(pointsAmountUsed)}</label>
          </div>
        }
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <label className="control-label">Grand Total</label>
          <label className="txt-medium label-secondary">&#8369;{numberWithCommas(grandTotal)}</label>
        </div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <label className="control-label">Customer Payout</label>
            <label className="txt-medium label-secondary">&#8369;{numberWithCommas(customerPayout)}</label>
          </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
      </div>
    )
  }

  renderVerticalLine() {
    return (
      <div style={{ borderLeft: '2px solid #344675', height: 40 }}></div>
    )
  }

  deliveryStatusParser(status) {
    switch(status) {
      case 'confirmed':
        return 'Confirmed';
      case 'placed':
        return 'Placed';
      case 'inPreparation':
        return 'being Prepared';
      case 'inTransit':
        return 'on the way';
      case 'orderCompleted':
        return 'Completed';
      default:
      return 'Updated';
    }
  }

  renderDeliveryStatus() {
    return (
      <>
        <div style={{fontSize:'12px',paddingBottom:10}}>
          <label className="control-label">
            Delivery Status
          </label>
        </div>
        <div style={{fontSize:'12px'}}>
          <div style={{width: '45%'}}>
            {this.state.singleDetails.delivery.map((data, index) => {
              const isFinalData = this.state.singleDetails.delivery.length - 1 === index;
              const status = this.deliveryStatusParser(data.status);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} key={index}>
                  <p className="text-primary" style={{ fontSize: 12, fontWeight: '500', textAlign: 'center' }}>Order is {status}</p>
                  <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>{format(new Date(data.updatedAt),'MMM dd, yyyy hh:mm a')}</p>
                  {!isFinalData && this.renderVerticalLine()}
                </div>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  renderOrderInfo(order) {
    let latestDeliveryInfo = order.delivery[order.delivery.length - 1];
    return (
      <>
        <div style={{fontSize:'12px'}}>
          <div style={{ display:'flex', flexDirection:'row', marginBottom:10 }}>
            <div style={{ flex: 1.5 }}>
              <label>Est. Delivery Pick-up Time</label>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label-secondary">
              {latestDeliveryInfo && latestDeliveryInfo.pickupDate
                ? format(new Date(latestDeliveryInfo.pickupDate),'MMM dd, yyyy hh:mm a')
                : 'No date selected'
              }
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
            <div style={{ flex: 1.5 }}>
              <label>Ordered On</label>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label-secondary">{format(new Date(order.createdAt),'MMM dd, yyyy hh:mm a')}</label>
            </div>
          </div>
          { latestDeliveryInfo && latestDeliveryInfo.deliveryEstimateDescription ?
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
              <div style={{ flex: 1.5 }}>
                <label>Estimated Time</label>
              </div>
              <div style={{ flex: 1 }}>
                <label className="label-secondary">{latestDeliveryInfo.deliveryEstimateDescription}</label>
              </div>
            </div>
            :
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
              <div style={{ flex: 1.5 }}>
                <label>Booked For</label>
              </div>
              <div style={{ flex: 1 }}>
                <label className="label-secondary">
                  { latestDeliveryInfo && latestDeliveryInfo.to 
                    ? format(new Date(latestDeliveryInfo.to),'MMM dd, yyyy hh:mm a')
                    : 'No date selected'
                  }
                </label>
              </div>
            </div>
          }
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
            <div style={{ flex: 1.5 }}>
              <label>Dining Option</label>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label-secondary">{order.products[0].diningOption.toUpperCase()}</label>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
            <div style={{ flex: 1.5 }}>
              <label>Payment Method</label>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label-secondary">
                { order.selectedPaymentOption === "gcash" && order.paymongoDetail && order.paymongoDetail.commissionPercentage
                  ?
                  "PAYMONGO GCASH"
                  :
                  order.selectedPaymentOption.toUpperCase()
                }
              </label>
            </div>
          </div>
          <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
          <div>
            <label className="control-label">Notes from the Customer</label>
            <p style={{ color: '#447098', paddingLeft: 10, marginTop: 10 }}>{order.consumerNotes || 'No note added'}</p>
          </div>
          <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
          { order.status !== 'for_confirmation' ?
            <div>
              <label className="control-label">Provider Notes</label>
              <p style={{ color: '#447098', paddingLeft: 10, marginTop: 10 }}>{order.notes || 'No note added'}</p>
            </div>
            :
            <div>
              <label className="control-label">Provider Notes</label>
              <div>
                <textarea
                  style={{
                    borderColor: 'rgba(169,169,169,0.5)',
                    width: '100%',
                    marginTop: 10,
                    resize: 'none',
                    maxHeight:"450px",
                  }}
                  placeholder={'Type something...'}
                  rows="8"
                  onChange={(e) => this.setState({ providerNote: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>
          }
          <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
        </div>
      </>
    );
  }

  checkProductPhotos(prod) {
    let productPhoto;
    if (prod && prod._id && prod._id.photos && prod._id.photos.length > 0) {
      productPhoto = prod._id.photos[prod._id.photos.length - 1].medium;
    } else {
      productPhoto = logoBlu
    }
    return (
      <>
        <Media left top href="#">
          <Media
            object
            data-src={productPhoto}
            src={productPhoto}
            alt={prod.name}
            style={{maxWidth:'50px',maxHeight:'50px'}}
          />
        </Media>
      </>
    );
  }

  renderProducts(order) {
    let { products } = order;
    return products.map((prod, index) => (
      <tr key={index} className={prod.unavailable ? `deleted-item` : ``}>
        <td>{index+1}.</td>
        <td width={'50%'}>
          <Media>
            {this.checkProductPhotos(prod)}
            <Media body>
              <Media style={{fontSize: "12px", marginBottom:"0px"}} heading>
                {prod.name}
              </Media>
            </Media>
          </Media>
        </td>
        <td width={'5%'}>{prod.quantity}</td>
        <td width={'20%'}>₱{numberWithCommas(prod.price)}</td>
        <td width={'20%'}>₱{numberWithCommas(prod.price * prod.quantity)}</td>
      </tr>
    ));
  }

  renderAddedProducts(order) {
    let { products, addedProducts } = order;
    const totalProducts = products && products instanceof Array ? products.length : 0;
    if(addedProducts && addedProducts instanceof Array && addedProducts.length > 0) {
      return addedProducts.map((prod, index) => (
        <tr key={index} className={prod.unavailable ? `deleted-item` : `added-item`}>
          <td>{totalProducts+index+1}.</td>
          <td width={'50%'}>
            <Media>
              {this.checkProductPhotos(prod)}
              <Media body>
                <Media style={{fontSize: "12px", marginBottom:"0px"}} heading>
                  {prod.name}
                </Media>
              </Media>
            </Media>
          </td>
          <td width={'5%'}>{prod.quantity}</td>
          <td width={'20%'}>₱{numberWithCommas(prod.price)}</td>
          <td width={'20%'}>₱{numberWithCommas(prod.price * prod.quantity)}</td>
        </tr>
      ));
    }
  }

  pickUpOrder(deliveryData) {
    const userData = JSON.parse(getSession("userData"));
    const { sessionToken } = userData;

    let payloadData = {
      data: {
        fromMerchant: true,
        requestType: "delivery",
        delivery: deliveryData.delivery[deliveryData.delivery.length - 1],
        orderId: deliveryData._id,
        deliveryStatus: "inTransit"
      }
    };

    this.props.pickUp(payloadData, deliveryData._id, sessionToken, (result, error) => {
      if (!error && result) {
        const { orders } = this.state;
        const detailId = this.state.singleDetails._id;
        if(orders instanceof Array && orders.length > 0 && typeof detailId !== 'undefined') {
          const selectedOrderIndex = orders.findIndex(eachOne => eachOne._id.toString() === detailId.toString());
          const selectedOrder = orders[selectedOrderIndex];
          let mostRecentDeliveryStatus = selectedOrder.delivery[selectedOrder.delivery.length - 1];
          mostRecentDeliveryStatus = { ...mostRecentDeliveryStatus, status: result.data.delivery.status, updatedAt: result.data.delivery.updatedAt };
          selectedOrder.delivery.push(mostRecentDeliveryStatus);
          orders[selectedOrderIndex] = selectedOrder;
          this.setState({
            orders: orders,
            canPickUp: false,
          }, () => this.togglePickupModal());
        }
      } else {
        if (error) {
          this.togglePickupModal();
          this.showNotificationError("There error on confirming the order!");
        }
      }
    });
  }

  handleSearch = (e) => {
    let { key } = e;
    if (key === "Enter") {
      let { dateStart, dateEnd } = this.state;
      this.setState({isLoading:true});
      this.setState({isLoadingOrderDetail:true});
      let defaultPage = JSON.parse(getSession("defaultPage"));
      let url = this.props.location.search;
      let query = queryString.parse(url);
      query.dateStart = format(new Date(dateStart),"yyyy-MM-dd'T'HH:mm:ss");
      query.dateEnd = format(new Date(dateEnd),"yyyy-MM-dd'T'HH:mm:ss");
      if(this.state.selectedPaymentMethod !== '') {
        query.selectedPaymentMethod = this.state.selectedPaymentMethod;
      }
      if(this.state.status !== '') {
        query.status = this.state.status;
      }
      if(this.state.filterDate !== '') {
        query.filterDate = this.state.filterDate;
      }
      if(this.state.search !== '') {
        query.search = this.state.search;
      } else {
        delete query.search;
      }
      delete query.page;
      this.setState({ activePage: 1 });
      let queryStr = "?" + queryString.stringify(query);
      this.refreshOrders(queryStr, defaultPage);
    }
  }

  handlePageChange = (pageNumber) => {
    this.setState({isLoading:true});
    this.setState({isLoadingOrderDetail:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));

    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.page = pageNumber;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ activePage: pageNumber });
    this.refreshOrders(queryStr, defaultPage);
  }

  showDetails(orderId) {
    this.setState({isLoadingOrderDetail:true});
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = userData;
    if (userData && userData !== "") {
      api(sessionToken).get(`places/${pageId}/orders/${orderId}`)
      .then(resp => {
        if(resp && resp.data) {
          const order = resp.data;
          this.setState({
            singleDetails: order,
            canPickUp: order.isDelivery && order.delivery[order.delivery.length - 1].status === 'inPreparation',
            isLoadingOrderDetail:false
          });
        } else {
          this.showNotificationError("Order not found!");
          this.setState({
            singleDetails: {},
            canPickUp: false,
          });
          this.setState({isLoadingOrderDetail:false});
        }
      })
      .catch(error => {
        this.setState({isLoadingOrderDetail:false});
        this.showNotificationError("There is an error fetching order. Please try again");
        setTimeout(() => { 
          this.props.history.push("/order-list");
          window.location.reload();
        },1000);
      })
    }
  }

  changeStatus(newStatus) {
    let { orders } = this.state;
    let detailId = this.state.singleDetails._id;
    if(orders instanceof Array && orders.length > 0 && typeof detailId !== 'undefined') {
      let index = orders.findIndex(eachOne => eachOne._id.toString() === detailId.toString());
      orders[index].status = newStatus;
      this.setState({
        orders: orders,
      });
    } else {
      this.showNotificationError("Order not found!");
    }
  }

  orderAction(newStatus, id) {
    const userData = JSON.parse(getSession("userData"));
    const { sessionToken } = userData;
    if (newStatus === "confirm") {
      this.props.saveNewStatus({ newStatus, providerNote: this.state.providerNote || '' }, id, sessionToken, (result, error) => {
        this.setState({modalConfirm: false});
        if (!error && result) {
          let { orders } = this.state;
          let detailId = this.state.singleDetails._id;
          if(orders instanceof Array && orders.length > 0 && typeof detailId !== 'undefined') {
            let index = orders.findIndex(eachOne => eachOne._id.toString() === detailId.toString());
            orders[index].status = result.data.data.status;
            orders[index].notes = result.data.data.notes;
            this.setState({ orders });
          } else {
            this.showNotificationError("Order not found!");
          }
        } else {
          if (error) {
            this.showNotificationError("There is an error on confirming the order!");
          }
        }
      });
    } else if (newStatus === "cancel") {
      let messages = { message: this.state.reason, code: this.state.subReason };
      this.props.cancelAction(id, messages, sessionToken, (result, error) => {
        this.setState({modal: false});
        if (!error && result) {
          let { orders } = this.state;
          let detailId = this.state.singleDetails._id;
          if(orders instanceof Array && orders.length > 0 && typeof detailId !== 'undefined') {
            let index = orders.findIndex(eachOne => eachOne._id.toString() === detailId.toString());
            orders[index].status = "cancelled";
            orders[index].notes = this.state.reason;
            this.setState({ orders });
          } else {
            this.showNotificationError("Order not found!");
          }
        } else {
          if (error) {
            this.showNotificationError("There is an error on cancelling the order!");
          }
        }
      });
    }
  }

  printDetails(orderId) {
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = userData;
    if (orderId && userData && userData !== "") {
      api(sessionToken).get(`places/${pageId}/orders/${orderId}`)
      .then(resp => {
        if(resp && resp.data) {
          const item = resp.data;
          var wnd = window.open("", "_blank", "");
          var bookingOption = item.isDelivery && item.delivery.length > 0 ? item.delivery[item.delivery.length - 1].deliveryEstimateDescription : "notDelivery";
          bookingOption = bookingOption === "notDelivery" ? "" : bookingOption === "" ? "Book For" : "Deliver Now";
          let htmlProducts = "";
          let customerPayout = 0;
          let grandTotal = 0;
          let itemsTotal = 0;
          let convenienceFee = 0;
          const pointsAmountUsed = item.pointsAmountUsed ? item.pointsAmountUsed : 0;
          const walletAmountUsed = item.walletAmountUsed ? item.walletAmountUsed : 0;
          let promos = item.orderPromoDiscount ? item.orderPromoDiscount : 0;
          let productPromos = 0;
          const email = item.customer.email ? item.customer.email : "&nbsp;&nbsp;&nbsp;&nbsp;";
          const phone = item.customer.mobileNumbers && item.customer.mobileNumbers instanceof Array && item.customer.mobileNumbers.length > 0 ? item.customer.mobileNumbers[0] : "";
          let shopperInfo = "";
          if(item.shopper && this.state.isGrocery) {
            let shopperName = "";
            if(item.shopper.firstName && item.shopper.lastName) {
              shopperName = `${item.shopper.firstName} ${item.shopper.lastName}`;
            } else {
              if(item.shopper.firstName) {
                shopperName = item.shopper.firstName;
              } else if(item.shopper.lastName) {
                shopperName = item.shopper.lastName;
              }
            }
            const shopperEmail = item.shopper && item.shopper.email ? item.shopper.email : "&nbsp;&nbsp;&nbsp;&nbsp;";
            const shopperPhone = item.shopper && item.shopper.mobileNumbers && item.shopper.mobileNumbers instanceof Array && item.shopper.mobileNumbers.length > 0 ? item.shopper.mobileNumbers[0].number : ""; 
            shopperInfo = `<p><label style="white-space: nowrap;">Shopper:</label> ${shopperName}</p>
            <p><label style="white-space: nowrap;">Shopper Email:</label> ${shopperEmail} &nbsp;&nbsp;&nbsp;&nbsp;<span style="white-space: nowrap;"><label>Shopper Phone No.:</label> ${shopperPhone}</span></p>`
          }
          const deliveryFee = item.delivery && item.delivery[0] && item.delivery[0].fee ? item.delivery[0].fee : 0;
          let deliveryAddress = "";
          deliveryAddress = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.address ? item.delivery[0].deliveryAddress.address : "";
          let landmark = "";
          landmark = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.address && item.delivery[0].deliveryAddress.landmark ? ' | ' + item.delivery[0].deliveryAddress.landmark : "";
          const cargoFee = item.convenienceFee && item.convenienceFee.value ? item.convenienceFee.value : 0;
          deliveryAddress = deliveryAddress + landmark;
          const gMapAddress = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.googleAddress ? item.delivery[0].deliveryAddress.googleAddress : "";
          const consumerNotes = item.consumerNotes ? item.consumerNotes : "No notes";
          const cashPrepared = item.invoiceDetails && item.invoiceDetails.customerCash ? item.invoiceDetails.customerCash : 0;
          const receiverName = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.name ? item.delivery[0].deliveryAddress.name : "None";
          const receiverPhone = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.phone ? item.delivery[0].deliveryAddress.phone : "None";
          let containerFee = 0;
          const serviceCharge = (item.extraFees && item.extraFees.serviceCharge) || 0;
          let rowClass = "";
          let { products, addedProducts } = item;
          let newProducts = products;
          if(addedProducts && addedProducts instanceof Array && addedProducts.length > 0) {
            newProducts = [...products,...addedProducts];
          }
          let deliveryStatus = "N/A";
          if(item.orderStatus && item.orderStatus instanceof Array && item.orderStatus.length > 0) {
            const finalStatus = item.orderStatus[item.orderStatus.length - 1];
            const status = finalStatus.status;
            if(status==='Confirmed') {
              deliveryStatus = "Confirmed";
            } else if (status==='Deployed') {
              deliveryStatus = "Deployed";
            } else if (status==='Picked up') {
              deliveryStatus = "Picked Up";
            } else if (status==='Requested for void') {
              deliveryStatus = "Requested for void";
            } else if (status==='Order Completed') {
              deliveryStatus = "Order Completed";
            } else if (status==='Paid') {
              deliveryStatus = "Paid";
            } else if (status==='Cancelled') {
              deliveryStatus = "Cancelled";
            } else if (status==='Received Order') {
              deliveryStatus = "Received Order";
            }
          }
          let statusText = "N/A";
          if(item.status==='for_confirmation') {
            statusText = "For Confirmation";
          } else if (item.status==='payment_pending') {
            statusText = "Pending";
          } else if (item.status==='paid') {
            statusText = "Paid";
          } else if (item.status==='cancelled') {
            statusText = "Cancelled";
          } else if (item.status==='void') {
            statusText = "Void";
          }
          newProducts.forEach((product,index) => {
            if(index%2===1) {
              rowClass = "odd";
            } else {
              rowClass = "";
            }
            let available = "";
            if(product.unavailable) {
              available = " deleted-item"
            }
            const barcode = product._id && product._id.barcode ? product._id.barcode : "";
            const itemCode = product._id && product._id.itemCode ? product._id.itemCode : "";
            let productId = "";
            if(product._id) {
              if(product._id._id) {
                productId = "..." + lastSixDigit(product._id._id.toString());
              } else {
                productId = "..." + lastSixDigit(product._id.toString());
              }
            }
            htmlProducts += `<tr class="${rowClass}${available}">
              <td nowrap>${index+1}. ▢</td>
              <td>${product.name}</td>
              <td>${productId}</td>
              <td>${itemCode}</td>
              <td>${barcode}</td>
              <td nowrap>&#8369;${numberWithCommas(product.price)}</td>
              <td align="center">${product.quantity}</td>
              <td nowrap>&#8369;${numberWithCommas(product.price * product.quantity)}</td>
            </tr>`;
            if(product.unavailable !== true) {
              itemsTotal += product.price * product.quantity;
            }
            if(product.unavailable !== true && product.markup && product.markup > 0) {
              convenienceFee += product.markup * product.quantity;
            }
            if(product.unavailable !== true && product.containerFee && product.containerFee.amount) {
              const delivery = product.containerFee.supportedOrderOption && product.containerFee.supportedOrderOption.delivery ? product.containerFee.supportedOrderOption.delivery : false
              const pickup = product.containerFee.supportedOrderOption && product.containerFee.supportedOrderOption.pickup ? product.containerFee.supportedOrderOption.pickup : false
              if(item.selectedPaymentOption==="delivery" && delivery) {
                containerFee += product.containerFee.amount
              } else if (item.selectedPaymentOption==="pickup" && pickup) {
                containerFee += product.containerFee.amount
              }
            }
            if(product.promos && product.promos.length > 0) {
              const promo = item.promos[0];
              const promoType = promo.calculation.type;
              const promoValue = promo.calculation.value;
              let days = 1;
              if(item.days && item.days > 1) {
                days = item.days;
              }
              if (promoType === 'percent') {
                productPromos += (item.price * item.quantity * days) * (promoValue / 100);
              } else {
                productPromos += promoValue;
              }
              promos += productPromos;
            }
          });
          let groceryFees = "";
          let groceryFeesHeader = "";
          let foodAndDrinkFees = "";
          let foodAndDrinkFeesHeader = "";
          if(this.state.isGrocery) {
            groceryFeesHeader = `<p>Cargo Fee:</>
              <p>Convenience Fee:</>`;
            groceryFees = `<p>&#8369;${numberWithCommas(cargoFee)}</p>
              <p>&#8369;${numberWithCommas(convenienceFee)}</p>`;
            
          } else {
            foodAndDrinkFeesHeader = `<p>Container Fee:</>
            <p>Service Charge:</>`;
            foodAndDrinkFees = `<p>&#8369;${numberWithCommas(containerFee)}</p>
            <p>&#8369;${numberWithCommas(serviceCharge)}</p>`
          }
          grandTotal = itemsTotal + convenienceFee + cargoFee + containerFee + serviceCharge + deliveryFee;
          customerPayout = grandTotal - (pointsAmountUsed + walletAmountUsed + promos);
          var html =
            `<html>
              <head>
                <title>${item.page.name} - Order No. ${item._id}</title>
                <style>
                  body {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    font-size: 13px;
                  }
                  .container { margin: 25px; overflow:auto; }
                  h1, h2, h3, h4, h5 { margin:0 0 10px; }
                  h1 { font-size: 16px; }
                  h2 { font-size: 15px; }
                  h3 { font-size: 14px; }
                  h4 { font-size: 13px; }
                  table, th {
                    padding: 10px;
                    border-bottom: 1px solid #ccc;
                    border-collapse: collapse;
                  }
                  td { padding: 10px; }
                  table.items, table.items th, table.items td { border-bottom: 1px solid #ccc; }
                  thead tr { background-color: #f5f6fa !important; border-top: 1px solid #ccc; padding: 10px 15px; }
                  tr.odd { background-color: #efefef !important; }
                  tr.deleted-item { text-decoration: line-through; opacity: .65; font-style: italic }
                  th { text-align: left; text-transform: uppercase; font-weight: bold; font-size: 13px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <center><h1 style="width:100%;">${item.page.name.toUpperCase()}</h1></center>
                  <center><h1 style="width:100%; margin-bottom:25px;">ORDER LIST</h1></center>
                  <table style="width:100%; font-size:13px; border-bottom: 1px solid #ccc;">
                    <thead>
                      <tr>
                        <th width="50%">Order No.:<span style="margin-left:15px;"> ${item._id}</span></th>
                        <th>Status: ${statusText} - ${deliveryStatus} </th>
                        <th>Order Date: ${format(new Date(item.createdAt),'MMM dd, yyyy hh:mm a')} </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom:none;">
                        <td width="50%">
                          <table style="width:100%; font-size:14px; border-bottom:none;">
                            <tbody>
                              <tr>
                                <td style="border-bottom:none; padding-left:0;">
                                  <p><label style="white-space: nowrap;">Customer Name:</label> ${item.customer.firstName} ${item.customer.lastName}</p>
                                  <p><label style="white-space: nowrap;">Email:</label> ${email} &nbsp;&nbsp;&nbsp;&nbsp;<span style="white-space: nowrap;"><label>Phone:</label> ${phone}</span></p>
                                  <p><label style="white-space: nowrap;">Receiver:</label> ${receiverName} &nbsp;&nbsp;&nbsp;&nbsp;<span style="white-space: nowrap;"><label>Phone:</label> ${receiverPhone}</span></p>
                                  ${shopperInfo}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td colspan="2">
                          <table style="width:100%; font-size:14px; border-bottom:none;">
                            <tbody>
                              <tr>
                                <td style="border-bottom:none;">
                                  <p><label>Booking Option:</label> ${bookingOption}</p>
                                  <p><label>Delivery Date:</label> ${format(new Date(item.timeSelected),'MMM dd, yyyy hh:mm a')}</p>
                                  <p><label>Delivery Address:</label> ${deliveryAddress}</p>
                                  <p><label>Google Map Address:</label> ${gMapAddress}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table style="width:100%; font-size:14px; border-bottom:none;">
                    <tbody>
                      <tr>
                        <td>
                          <table style="max-width:50%; border-bottom:none; font-size:14px;">
                            <tbody>
                              <tr style="font-weight:bold;">
                                <td>
                                  <p>Items Total:</p>
                                  <p>Delivery Fee:</>
                                  ${groceryFeesHeader}
                                  ${foodAndDrinkFeesHeader}
                                  <p>GRAND TOTAL:</>
                                </td>
                                <td>
                                  <p>&#8369;${numberWithCommas(itemsTotal)}</p>
                                  <p>&#8369;${numberWithCommas(deliveryFee)}</p>
                                  ${groceryFees}
                                  ${foodAndDrinkFees}
                                  <p style="text-decoration:underline">&#8369;${numberWithCommas(grandTotal)}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td colspan="2">
                          <table style="border-bottom:none; font-size:14px;">
                            <tbody>
                              <tr style="font-weight:bold;">
                                <td>
                                  <p>Points Used:</p>
                                  <p>Wallet Used:</>
                                  <p>Promos:</>
                                  <p>CUSTOMER PAYOUT:</>
                                  <p>Cash Prepared:</>
                                </td>
                                <td>
                                  <p>&#8369;${numberWithCommas(pointsAmountUsed)}</p>
                                  <p>&#8369;${numberWithCommas(walletAmountUsed)}</p>
                                  <p>&#8369;${numberWithCommas(promos)}</p>
                                  <p style="text-decoration:underline">&#8369;${numberWithCommas(customerPayout)}</p>
                                  <p style="text-decoration:underline">&#8369;${numberWithCommas(cashPrepared)}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table class="items" style="width:100%; font-size:13px;">
                    <thead>
                      <tr>
                        <th>&nbsp;</th>
                        <th>Item</th>
                        <th>Item No.</th>
                        <th>Item Code</th>
                        <th>Barcode</th>
                        <th>Price</th>
                        <th width="50">Quantity</th>
                        <th>Total</th>
                      </tr>
                    <thead>
                    <tbody>
                      ${htmlProducts}
                      <tr style="font-weight:bold;">
                        <td colspan="7" align="right">ITEMS TOTAL:</td>
                        <td nowrap>&#8369;${numberWithCommas(itemsTotal)}</td>
                      </tr>
                      <tr>
                        <td colspan="8"><p style="padding: 10px 0;"><span style="font-weight:bold;">Customer Notes:</span> <em>${consumerNotes}</em></p></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </body>
            </html>`;
          wnd.document.write(html);
        } else {
          this.showNotificationError("Order not found!");
        }
      })
      .catch(error => {
        this.showNotificationError("There is an error fetching order. Please try again");
      })
    } else {
      this.showNotificationError("Order not found!");
    }
  }

  printMinDetails(orderId) {
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = userData;
    if (orderId && userData && userData !== "") {
      api(sessionToken).get(`places/${pageId}/orders/${orderId}`)
      .then(resp => {
        if(resp && resp.data) {
          const item = resp.data;
          var wnd = window.open("", "_blank", "");
          var bookingOption = item.isDelivery && item.delivery.length > 0 ? item.delivery[item.delivery.length - 1].deliveryEstimateDescription : "notDelivery";
          bookingOption = bookingOption === "notDelivery" ? "" : bookingOption === "" ? "Book For" : "Deliver Now";
          let htmlProducts = "";
          let grandTotal = 0;
          let customerPayout = 0;
          let itemsTotal = 0;
          let convenienceFee = 0;
          let cargoFee = 0;
          const pointsAmountUsed = item.pointsAmountUsed ? item.pointsAmountUsed : 0;
          const walletAmountUsed = item.walletAmountUsed ? item.walletAmountUsed : 0;
          let promos = item.orderPromoDiscount ? item.orderPromoDiscount : 0;
          let productPromos = 0;
          const email = item.customer.email ? item.customer.email : "";
          const phone = item.customer.mobileNumbers && item.customer.mobileNumbers instanceof Array && item.customer.mobileNumbers.length > 0 ? item.customer.mobileNumbers[0] : "";
          let shopperInfo = "";
          if(item.shopper && this.state.isGrocery) {
            let shopperName = "";
            if(item.shopper.firstName && item.shopper.lastName) {
              shopperName = `${item.shopper.firstName} ${item.shopper.lastName}`;
            } else {
              if(item.shopper.firstName) {
                shopperName = item.shopper.firstName;
              } else if(item.shopper.lastName) {
                shopperName = item.shopper.lastName;
              }
            }
            const shopperEmail = item.shopper && item.shopper.email ? item.shopper.email : "&nbsp;&nbsp;&nbsp;&nbsp;";
            const shopperPhone = item.shopper && item.shopper.mobileNumbers && item.shopper.mobileNumbers instanceof Array && item.shopper.mobileNumbers.length > 0 ? item.shopper.mobileNumbers[0].number : ""; 
            shopperInfo = `<p><label style="white-space: nowrap;">Shopper:</label> ${shopperName}</p>
            <p><label style="white-space: nowrap;">Shopper Email:</label> ${shopperEmail} &nbsp;&nbsp;&nbsp;&nbsp; <span style="white-space: nowrap;"><label>Shopper Phone No.:</label> ${shopperPhone}</span></p>`
          }
          const deliveryFee = item.delivery && item.delivery[0] && item.delivery[0].fee ? item.delivery[0].fee : 0;
          let deliveryAddress = "";
          deliveryAddress = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.address ? item.delivery[0].deliveryAddress.address : "";
          let landmark = "";
          landmark = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.address && item.delivery[0].deliveryAddress.landmark ? ' | ' + item.delivery[0].deliveryAddress.landmark : "";
          cargoFee = item.convenienceFee && item.convenienceFee.value ? item.convenienceFee.value : 0;
          deliveryAddress = deliveryAddress + landmark;
          const gMapAddress = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.googleAddress ? item.delivery[0].deliveryAddress.googleAddress : "";
          const consumerNotes = item.consumerNotes ? item.consumerNotes : "No notes";
          const cashPrepared = item.invoiceDetails && item.invoiceDetails.customerCash ? item.invoiceDetails.customerCash : 0;
          const receiverName = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.name ? item.delivery[0].deliveryAddress.name : "None";
          const receiverPhone = item.delivery && item.delivery[0] && item.delivery[0].deliveryAddress && item.delivery[0].deliveryAddress.phone ? item.delivery[0].deliveryAddress.phone : "None";
          let containerFee = 0;
          const serviceCharge = (item.extraFees && item.extraFees.serviceCharge) || 0;
          let rowClass = "";
          let { products, addedProducts } = item;
          let newProducts = products;
          if(addedProducts && addedProducts instanceof Array && addedProducts.length > 0) {
            newProducts = [...products,...addedProducts];
          }
          let deliveryStatus = "N/A";
          if(item.orderStatus && item.orderStatus instanceof Array && item.orderStatus.length > 0) {
            const finalStatus = item.orderStatus[item.orderStatus.length - 1];
            const status = finalStatus.status;
            if(status==='Confirmed') {
              deliveryStatus = "Confirmed";
            } else if (status==='Deployed') {
              deliveryStatus = "Deployed";
            } else if (status==='Picked up') {
              deliveryStatus = "Picked Up";
            } else if (status==='Requested for void') {
              deliveryStatus = "Requested for void";
            } else if (status==='Order Completed') {
              deliveryStatus = "Order Completed";
            } else if (status==='Paid') {
              deliveryStatus = "Paid";
            } else if (status==='Cancelled') {
              deliveryStatus = "Cancelled";
            } else if (status==='Received Order') {
              deliveryStatus = "Received Order";
            }
          }
          let statusText = "N/A";
          if(item.status==='for_confirmation') {
            statusText = "For Confirmation";
          } else if (item.status==='payment_pending') {
            statusText = "Pending";
          } else if (item.status==='paid') {
            statusText = "Paid";
          } else if (item.status==='cancelled') {
            statusText = "Cancelled";
          } else if (item.status==='void') {
            statusText = "Void";
          }
          newProducts.forEach((product,index) => {
            if(index%2===1) {
              rowClass = "odd";
            } else {
              rowClass = "";
            }
            let available = "";
            if(product.unavailable) {
              available = " deleted-item"
            }
            const barcode = product._id && product._id.barcode ? product._id.barcode : "";
            const itemCode = product._id && product._id.itemCode ? product._id.itemCode : ""
            htmlProducts += `<tr class="${rowClass}${available}">
              <td>${index+1}. ${product.name}</td>
              <td nowrap>${itemCode}</td>
              <td>${barcode}</td>
              <td nowrap>&#8369;${numberWithCommas(product.price)}</td>
              <td align="center">${product.quantity}</td>
              <td nowrap>&#8369;${numberWithCommas(product.price * product.quantity)}</td>
            </tr>`;
            if(product.unavailable !== true) {
              itemsTotal += product.price * product.quantity;
            }
            if(product.unavailable !== true && product.markup && product.markup > 0) {
              convenienceFee += product.markup * product.quantity;
            }
            if(product.unavailable !== true && product.containerFee && product.containerFee.amount) {
              const delivery = product.containerFee.supportedOrderOption && product.containerFee.supportedOrderOption.delivery ? product.containerFee.supportedOrderOption.delivery : false
              const pickup = product.containerFee.supportedOrderOption && product.containerFee.supportedOrderOption.pickup ? product.containerFee.supportedOrderOption.pickup : false
              if(item.selectedPaymentOption==="delivery" && delivery) {
                containerFee += product.containerFee.amount
              } else if (item.selectedPaymentOption==="pickup" && pickup) {
                containerFee += product.containerFee.amount
              }
            }
            if(product.promos && product.promos.length > 0) {
              const promo = item.promos[0];
              const promoType = promo.calculation.type;
              const promoValue = promo.calculation.value;
              let days = 1;
              if(item.days && item.days > 1) {
                days = item.days;
              }
              if (promoType === 'percent') {
                productPromos += (item.price * item.quantity * days) * (promoValue / 100);
              } else {
                productPromos += promoValue;
              }
              promos += productPromos;
            }
          });
          let groceryFees = "";
          let groceryFeesHeader = "";
          let foodAndDrinkFees = "";
          let foodAndDrinkFeesHeader = "";
          if(this.state.isGrocery) {
            groceryFeesHeader = `<p>Cargo Fee:</>
              <p>Convenience Fee:</>`;
            groceryFees = `<p>&#8369;${numberWithCommas(cargoFee)}</p>
              <p>&#8369;${numberWithCommas(convenienceFee)}</p>`;
            
          } else {
            foodAndDrinkFeesHeader = `<p>Container Fee:</>
            <p>Service Charge:</>`;
            foodAndDrinkFees = `<p>&#8369;${numberWithCommas(containerFee)}</p>
            <p>&#8369;${numberWithCommas(serviceCharge)}</p>`
          }
          grandTotal = itemsTotal + convenienceFee + cargoFee + containerFee + serviceCharge + deliveryFee;
          customerPayout = grandTotal - (pointsAmountUsed + walletAmountUsed + promos);
          var html =
            `<html>
              <head>
                <title>${item.page.name} - Order No. ${item._id}</title>
                <style>
                  body {
                    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
                    font-size: 15px;
                  }
                  .container { margin: 25px; overflow:auto; }
                  h1, h2, h3, h4, h5 { margin:0 0 10px; }
                  h1 { font-size: 16px; }
                  h2 { font-size: 15px; }
                  h3 { font-size: 14px; }
                  h4 { font-size: 13px; }
                  table, th {
                    padding: 10px;
                    border-bottom: 1px solid #ccc;
                    border-collapse: collapse;
                  }
                  td { padding: 10px; }
                  table.items, table.items th, table.items td { border-bottom: 1px solid #ccc; }
                  thead tr { background-color: #f5f6fa !important; border-top: 1px solid #ccc; padding: 10px 15px; }
                  tr.odd { background-color: #efefef !important; }
                  tr.deleted-item { text-decoration: line-through; opacity: .65; font-style: italic }
                  th { text-align: left; text-transform: uppercase; font-weight: bold; font-size: 14px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <center><h1 style="width:100%;">${item.page.name.toUpperCase()}</h1></center>
                  <center><h1 style="width:100%; margin-bottom:25px;">ORDER LIST</h1></center>
                  <table style="width:100%; font-size:14px; border-bottom: 1px solid #ccc;">
                    <thead>
                      <tr>
                        <th width="50%">Order No.:<span style="margin-left:15px;">${item._id}</span></th>
                        <th>Status: ${statusText} - ${deliveryStatus} </th>
                        <th>Order Date: ${format(new Date(item.createdAt),'MMM dd, yyyy hh:mm a')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style="border-bottom:none;">
                        <td width="50%">
                          <table style="width:100%; font-size:14px; border-bottom:none;">
                            <tbody>
                              <tr>
                                <td style="border-bottom:none; padding-left:0;">
                                  <p><label style="white-space: nowrap;">Customer Name:</label> ${item.customer.firstName} ${item.customer.lastName}</p>
                                  <p><label style="white-space: nowrap;">Email:</label> ${email} &nbsp;&nbsp;&nbsp;&nbsp;<span style="white-space: nowrap;"><label>Phone:</label> ${phone}</span></p>
                                  <p><label style="white-space: nowrap;">Receiver:</label> ${receiverName} &nbsp;&nbsp;&nbsp;&nbsp;<span style="white-space: nowrap;"><label>Phone:</label> ${receiverPhone}</span></p>
                                  ${shopperInfo}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td colspan="2">
                          <table style="width:100%; font-size:14px; border-bottom:none;">
                            <tbody>
                              <tr>
                                <td style="border-bottom:none;">
                                  <p><label>Booking Option:</label> ${bookingOption}</p>
                                  <p><label>Delivery Date:</label> ${format(new Date(item.timeSelected),'MMM dd, yyyy hh:mm a')}</p>
                                  <p><label>Delivery Address:</label> ${deliveryAddress}</p>
                                  <p><label>Google Map Address:</label> ${gMapAddress}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table style="width:100%; font-size:14px; border-bottom:none;">
                    <tbody>
                      <tr>
                        <td>
                          <table style="max-width:50%; border-bottom:none; font-size:14px;">
                            <tbody>
                              <tr style="font-weight:bold;">
                                <td>
                                  <p>Items Total:</p>
                                  <p>Delivery Fee:</>
                                  ${groceryFeesHeader}
                                  ${foodAndDrinkFeesHeader}
                                  <p>GRAND TOTAL:</>
                                </td>
                                <td>
                                  <p>&#8369;${numberWithCommas(itemsTotal)}</p>
                                  <p>&#8369;${numberWithCommas(deliveryFee)}</p>
                                  ${groceryFees}
                                  ${foodAndDrinkFees}
                                  <p style="text-decoration:underline">&#8369;${numberWithCommas(grandTotal)}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                        <td colspan="2">
                          <table style="border-bottom:none; font-size:14px;">
                            <tbody>
                              <tr style="font-weight:bold;">
                                <td>
                                  <p>Points Used:</p>
                                  <p>Wallet Used:</>
                                  <p>Promos:</>
                                  <p>CUSTOMER PAYOUT:</>
                                  <p>Cash Prepared:</>
                                </td>
                                <td>
                                  <p>&#8369;${numberWithCommas(pointsAmountUsed)}</p>
                                  <p>&#8369;${numberWithCommas(walletAmountUsed)}</p>
                                  <p>&#8369;${numberWithCommas(promos)}</p>
                                  <p style="text-decoration:underline">&#8369;${numberWithCommas(customerPayout)}</p>
                                  <p style="text-decoration:underline">&#8369;${numberWithCommas(cashPrepared)}</p>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <table class="items" style="width:100%; font-size:14px;">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Item Code</th>
                        <th>Barcode</th>
                        <th>Price</th>
                        <th width="50">Quantity</th>
                        <th>Total</th>
                      </tr>
                    <thead>
                    <tbody>
                      ${htmlProducts}
                      <tr style="font-weight:bold;">
                        <td colspan="5" align="right">ITEMS TOTAL:</td>
                        <td nowrap>&#8369;${numberWithCommas(itemsTotal)}</td>
                      </tr>
                      <tr>
                        <td colspan="8"><p style="padding: 10px 0;"><span style="font-weight:bold;">Customer Notes:</span> <em>${consumerNotes}</em></p></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </body>
            </html>`;
          wnd.document.write(html);
        } else {
          this.showNotificationError("Order not found!");
        }
      })
      .catch(error => {
        this.showNotificationError("There is an error fetching order. Please try again");
      })
    } else {
      this.showNotificationError("Order not found!");
    }
  }

  exportList = () => {
    this.setState({ isGeneratingXls: true });
    let { dateStart, dateEnd, status, selectedPaymentMethod, keyword, filterDate, showTests } = this.state;
    let query = {};
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = userData;
    query.dateStart = dateStart;
    query.dateEnd = dateEnd;
    if(status && status !== '') {
      query.status = status;
    }
    if(selectedPaymentMethod && selectedPaymentMethod !== '') {
      query.selectedPaymentMethod = selectedPaymentMethod;
    }
    if(keyword && keyword !== '') {
      query.keyword = keyword;
    }
    if(filterDate && filterDate !== '') {
      query.filterDate = filterDate;
    }
    if(showTests && showTests !== '') {
      query.showTests = showTests;
    }
    
    if (userData !== null) {
      api(sessionToken).get(`/provider/places/${pageId}/orders-by-product-xls`, { params: query })
      .then(resp => {
        if (resp && resp.data && resp.data.status === 'success' && resp.data.filename) {
          const fileName = resp.data.filename;
          this.setState({ isGeneratingXls: false });
          window.open(fileName);
        } else {
          this.setState({ isGeneratingXls: false });
          this.showNotificationError('No transactions found.');
        }
      })
      .catch(error => {
        this.setState({ isGeneratingXls: false });
        this.showNotificationError('There is an error generating the file. Please');
      })
    } else {
      this.setState({ isGeneratingXls: false });
      this.showNotificationError('No transactions found.');
    }
  }

  renderImage(item) {
    let defaultPhoto = logoBlu
    var pp = item && item.customer && item.customer._id && item.customer._id.photos && item.customer._id.photos[0]
      ? item.customer._id.photos[0].thumb
      : defaultPhoto;
    return (
      <Media 
        object
        data-src={pp}
        src={pp}
        alt={item.customer.firstName}
        style={{ maxWidth:"45px", maxHeight:"45px" }}
      />
    );
  }

  renderStatusBadges(item, style) {
    if (style === "vertical") {
      return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="roundLabel" style={{ backgroundColor: '#1d8cf8' }}>
            {item.status}
          </div>
          <div className="roundLabel" style={{ backgroundColor: '#ff8d72' }}>
            {item.products[item.products.length - 1].diningOption}
          </div>
          <div className="roundLabel" style={{ backgroundColor: '#fd5d93' }}>
            { item.selectedPaymentOption === "gcash" && item.paymongoDetail && item.paymongoDetail.commissionPercentage
              ?
              <>
                paymongo gcash
              </>
              :
              <>
                {item.selectedPaymentOption}
              </>
            }
          </div>
        </div>
      );
    } else {
      return (
        <>
          <Badge style={{ fontSize: "12px" }} color="info" pill>
            {item.status}
          </Badge>
          <Badge style={{ fontSize: "12px" }} color="warning" pill>
            {item.products[item.products.length - 1].diningOption}
          </Badge>
          <Badge style={{ fontSize: "12px" }} color="danger" pill>
            {item.selectedPaymentOption}
          </Badge>
          <Button color="link" aria-label="PDF" style={{ padding: "0.5rem 0.25rem" }}>
            <span aria-hidden>
              <Fa
                icon="file-pdf"
                size={'lg'}
                onClick={() => {
                  this.printMinDetails(item._id);
                }}
              />
            </span>
          </Button>
          <Button 
            style={{ fontSize: "12px", padding: "0.5rem 0.25rem" }}
            className="btn-success-v2 btn-round float-right"
            onClick={() => {
              this.printDetails(item._id);
            }}
          >
            <Fa icon="print" />
          </Button>{" "}
        </>
      );
    }
  }

  renderCustomerBilling(details) {
    var method = "";
    let billingAddress = details.billingAddress;

    if (!billingAddress) {
      billingAddress = {
        billing_name: "",
        address1: "",
        address2: "",
        city: "",
        state_province: "",
        postal: "",
        country: ""
      };
    }
    
    if (details.selectedPaymentOption === "cc") {
      method = "Credit Card";
    } else if (details.selectedPaymentOption === "cash") {
      method = "Cash";
    } else if (details.selectedPaymentOption === "bank") {
      method = "Bank";
    }

    return (
      <>
        <tr>
          <td>
            <h4>BILLING</h4>
          </td>
        </tr>
        <tr>
          <td>
            <b>Method</b>
          </td>
          <td>{method}</td>
        </tr>
        <tr>
          <td>
            <b>Fullname</b>
          </td>
          <td>{billingAddress.billing_name}</td>
        </tr>
        <tr>
          <td>
            <b>Address</b>
          </td>
          <td>{billingAddress.address1}</td>
        </tr>
      </>
    );
  }
  
  renderCustomerInfo(details) {
    const deliveryAddress =
      details.isDelivery && details.delivery[0].deliveryAddress.address
        ? details.delivery[0].deliveryAddress.address
        : "";
    const landmark =
      details.isDelivery && details.delivery[0].deliveryAddress.landmark
        ? details.delivery[0].deliveryAddress.landmark
        : "";
    const googleAddress =
      details.isDelivery && details.delivery[0].deliveryAddress.googleAddress
        ? details.delivery[0].deliveryAddress.googleAddress
        : "";
    const receiverName =
      details.isDelivery && details.delivery[0].deliveryAddress.name
        ? details.delivery[0].deliveryAddress.name
        : "";
    const receiverPhone =
      details.isDelivery && details.delivery[0].deliveryAddress.phone
        ? details.delivery[0].deliveryAddress.phone
        : "";
    return (
      <div style={{fontSize:12}}>
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 10 }}>
          <label className="control-label">Customer</label>
        </div>
        <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
          <label className="label-secondary">{details.customer.firstName} {details.customer.lastName}</label>
        </div>
        <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
          <label className="label-secondary">
            <Fa icon="mobile-alt" />&nbsp;
            {details.customer.mobileNumbers[0]}
          </label>
        </div>
        <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
          <label className="label-secondary">
            <Fa icon="envelope" />&nbsp;
            {details.customer.email}
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginTop: 10 }}>
          <label className="control-label">Delivery</label>
        </div>
        <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
          <label className="label-secondary">
            <Fa icon="map-marker-alt" />&nbsp;
            {deliveryAddress}
          </label>
        </div>
        { landmark && landmark.length > 0 &&
          <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
            <label className="label-secondary">
              <Fa icon="monument" />&nbsp;
              {landmark}
            </label>
          </div>
        }
        <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
          <label className="label-secondary">
            <Fa icon="map-pin" />&nbsp;
            {googleAddress}
          </label>
        </div>
        <div style={{ display:'flex', flexDirection:'row', marginTop:10 }}>
          <label className="control-label">Recipient</label>
        </div>
        <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
          <label className="label-secondary">{receiverName}</label>
        </div>
        <div style={{ display:'flex', flexDirection:'row', paddingLeft:10, marginTop:5 }}>
          <label className="label-secondary">
            <Fa icon="phone-square" />&nbsp;
            {receiverPhone}
          </label>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
      </div>
    );
  }

  renderShopperInfo(shopper) {
    if(this.state.isGrocery) {
      if(shopper && shopper._id) {
        const selectId = shopper && shopper._id ? shopper._id : "";
        return (
          <div style={{fontSize:'12px'}}>
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: 10 }}>
              <label className="control-label">Shopper</label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', paddingLeft:10, marginTop:5 }}>
              <label className="label-secondary">{shopper.firstName ? shopper.firstName : ""} {shopper.lastName ? shopper.lastName : ""}</label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', paddingLeft:10, marginTop:5 }}>
              <label className="label-secondary">
                <Fa icon="mobile-alt" />&nbsp;
                {shopper.mobileNumbers && shopper.mobileNumbers[0] && shopper.mobileNumbers[0].number ? shopper.mobileNumbers[0].number : ""}
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', paddingLeft:10, marginTop:5 }}>
              <label className="label-secondary">
                <Fa icon="envelope" />&nbsp;
                {shopper.email ? shopper.email : ""}
              </label>
            </div>
            { this.state.shopperOptions && this.state.shopperOptions.length > 0 &&
              <Col sm="12" md="8" lg="8" style={{ paddingLeft: 0, marginBottom: 10, marginTop: 10 }}>
                <FormGroup>
                  <Select
                    className="react-select"
                    styles={{ fontSize:'13px !important', width: 'auto' }}
                    options={this.state.shopperOptions}
                    onChange={this.handleChangeShopper}
                    placeholder="Select a shopper"
                    value={this.state.shopperOptions.filter(item => item.value === selectId)}
                  />
                </FormGroup>
              </Col>
            }
            <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
          </div>
        );
      } else {
        return (
          <div style={{fontSize:'12px'}}>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, marginTop: 10 }}>
              <label className="control-label">SHOPPER DETAILS</label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, marginTop: 10 }}>
              <p style={{ color: '#447098', paddingLeft: 10 }}>No shopper added.</p>
            </div>
            { this.state.shopperOptions && this.state.shopperOptions.length > 0 &&
              <Col sm="12" md="8" lg="8" style={{ paddingLeft: 0, marginBottom: 10, marginTop: 10 }}>
                <FormGroup>
                  <Select
                    className="react-select"
                    styles={{ fontSize:'13px !important', width: 'auto' }}
                    options={this.state.shopperOptions}
                    onChange={this.handleChangeShopper}
                    placeholder="Select a shopper"
                    value=""
                  />
                </FormGroup>
              </Col>
            }
            <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
          </div>
        );
      }
    }
  }

  renderRows() {
    if (this.state.isLoading) {
      return (
        <tr>
          <td colSpan="7">
            <PulseLoader
              sizeUnit={"px"}
              size={15}
              color={"#1d8cf8"}
              loading={this.state.isLoading}
            />
          </td>
        </tr>
      );
    } else {
      if (
        this.state.orders instanceof Array && 
        this.state.orders.length > 0
      ) {
        return this.state.orders.map((item, index, ordersArr) => (
          <tr
            key={index}
            onClick={() => {
              this.showDetails(item._id);
            }}
            className="order-list-item"
          >
            <td width="30%">
              <Media style={{ display: 'flex', alignItems: 'center' }}>
                {index+1}.
                <Media left top href="#">
                  {this.renderImage(item)}
                </Media>
                <p style={{ marginBottom: 20 }}>
                  {item.customer.firstName} {item.customer.lastName}
                </p>
              </Media>
            </td>
            <td width="100">
              <p>...
                {
                  new Array(item._id.toString().length - 6 + 1).join('') + item._id.toString().slice(-6)
                }
              </p>
              { item.selectedPaymentOption === "gcash" && item.paymongoDetail && item.paymongoDetail.commissionPercentage 
                ?
                  <>
                    { item.paymongoDetail && item.paymongoDetail.commissionPercentage
                      ?
                      <Badge color="secondary" pill>PAYMONGO G-CASH</Badge>
                      :
                      <Badge color="secondary" pill>G-CASH</Badge>
                    } 
                  </>
                :
                  <>
                    { item.selectedPaymentOption === "cc" 
                      ?
                      <Badge color="secondary" pill>PAYPAL</Badge>
                      :
                      <Badge color="secondary" pill>{item.selectedPaymentOption ? item.selectedPaymentOption.toUpperCase() : "N/A"}</Badge>
                    }
                  </>
              }
              
            </td>
            <td>
              <p style={{whiteSpace:'noWrap'}}>{format(new Date(item.createdAt),'yyyy-MM-dd')}</p>
              {format(new Date(item.createdAt),'hh:mm a')}
            </td>
            <td>
              <p style={{whiteSpace:'noWrap'}}>{format(new Date(item.timeSelected),'yyyy-MM-dd')}</p>
              {format(new Date(item.timeSelected),'hh:mm a')}
            </td>
            <td width="100">
              <FormGroup>
                {this.renderOrderStatus(item.status)}
              </FormGroup>
            </td>
            <td width="100">
              <FormGroup>
                {this.renderDeliveryStatusBadge(item.orderStatus)}
              </FormGroup>
            </td>
          </tr>
        ));
      } else {
        return (
          <tr>
            <td colSpan="7">
              <label className="text-danger">
                <em>No Orders found.</em>
              </label>
            </td>
          </tr>
        );
      }
    }
  }

  refreshOrders(queryStr, pageId) {
    const query = queryString.parse(queryStr);
    query.keyword = query.search && query.search.length > 0 ? query.search.trim() : "";
    delete query.search;
    this.props.history.push("/order-list" + queryStr);
    const userData = JSON.parse(getSession("userData"));
    const { sessionToken } = userData;
    if (userData && userData !== null) {
      api(sessionToken).get(`/provider/orders/${pageId}`, { params: query })
      .then(resp => {
        if(resp && resp.data && resp.data.docs && resp.data.docs[0]) {
            const orders = resp.data.docs;
            this.setState({
              orders: orders,
              pagination: resp.data.pagination,
              singleDetails: orders[0],
              canPickUp: orders[0].isDelivery && orders[0].delivery[orders[0].delivery.length - 1].status === 'inPreparation',
            });
          this.setState({isLoading:false});
          this.setState({isLoadingOrderDetail:false});
        } else {
          this.setState({
            orders: [],
            pagination: {},
            singleDetails: {},
            canPickUp: false,
          });
          this.setState({isLoading:false});
          this.setState({isLoadingOrderDetail:false});
        }
      })
      .catch(error => {
        this.setState({isLoading:false});
        this.setState({isLoadingOrderDetail:false});
      })
    } else {
      this.setState({isLoading:false});
      this.setState({isLoadingOrderDetail:false});
    }
  }

  renderOrderStatus(status) {
    if(status==='for_confirmation') {
      return (<Badge color="secondary" pill>For Confirmation</Badge>)
    } else if (status==='payment_pending') {
      return (<Badge color="warning" pill>Pending</Badge>)
    } else if (status==='paid') {
      return (<Badge color="primary" pill>Paid</Badge>)
    } else if (status==='cancelled') {
      return (<Badge color="danger" pill>Cancelled</Badge>)
    } else if (status==='void') {
      return (<Badge color="secondary" pill>Void</Badge>) 
    } else {
      return (<Badge color="secondary" pill>N/A</Badge>) 
    }
  }

  renderDeliveryStatusBadge(orderStatus) {
    if(orderStatus && orderStatus instanceof Array && orderStatus.length > 0) {
      const finalStatus = orderStatus[orderStatus.length - 1];
      const status = finalStatus.status;
      if(status==='Confirmed') {
        return (<Badge color="warning" pill>Confirmed</Badge>)
      } else if (status==='Deployed') {
        return (<Badge color="primary" pill>Deployed</Badge>)
      } else if (status==='Picked up') {
        return (<Badge color="primary" pill>Picked Up</Badge>)
      } else if (status==='Requested for void') {
        return (<Badge color="secondary" pill>Requested For Void</Badge>)
      } else if (status==='Order Completed') {
        return (<Badge color="success" pill>Completed</Badge>)
      } else if (status==='Paid') {
        return (<Badge color="primary" pill>Paid</Badge>)
      } else if (status==='Cancelled') {
        return (<Badge color="success" pill>Cancelled</Badge>)
      } else if (status==='Received Order') {
        return (<Badge color="success" pill>Received Order</Badge>)
      } else {
        return (<Badge color="secondary" pill>N/A</Badge>) 
      }
    } else {
      return (<Badge color="secondary" pill>N/A</Badge>);
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
    const hasCategories = JSON.parse(getSession("hasCategories"));
    const hasProducts = JSON.parse(getSession("hasProducts"));
    if(pageInfo && pageInfo._id) {
      if(pageInfo.isVerified === true) {
        if(hasProducts === true) {
          return (
            <div className="content">
              <div className="react-notification-alert-container">
                <NotificationAlert ref="notify" />
              </div>
              <Row>
                <Col lg="7" md="7" sm="12">
                  <Card>
                    <CardHeader>
                      <h4 className="title">Orders - <em>{this.state.pageName}</em></h4>
                      {!pageInfo.hideTutorials &&
                        <Row>
                          <Col sm="12">
                            <Row>
                              <Col md="12">
                                <Alert className="alert-compact" color="primary" isOpen={!this.state.hideTutorials} toggle={this.onDismiss} fade={false}>
                                  <h4 className="alert-heading">New on Orders?</h4>
                                  <hr />
                                  <p className="mb-0">
                                    Check our videos here on how to manage your orders.<br /> 
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
                        <Col md="6">
                          <Row>
                            <Col sm="12">
                              <FormGroup>
                                <Input
                                  id="search"
                                  name="search"
                                  type="text"
                                  placeholder="Search order..."
                                  onChange={this.handleChangeKeyword}
                                  onKeyPress={this.handleSearch}
                                  value={this.state.search}
                                ></Input>
                              </FormGroup>
                            </Col>
                          </Row>
                        </Col>
                        <Col md="6">
                          <Row>
                            <Col md="6">
                              <FormGroup>
                                <Input
                                  id="paymentMethod"
                                  name="paymentMethod"
                                  type="select"
                                  onChange={this.handleChangePaymentMethod}
                                  value={this.state.selectedPaymentMethod}
                                >
                                  <option value="">Payment Method</option>
                                  <option value="cash">Cash</option>
                                  <option value="gcash">G-Cash</option>
                                  <option value="paynamics">Paynamics</option>
                                  <option value="paymongo">Paymongo</option>
                                  <option value="cc">Paypal</option>
                                  <option value="direct-transfer">Direct Transfer</option>
                                </Input>
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Input
                                  id="status"
                                  name="status"
                                  type="select"
                                  onChange={this.handleChangeStatus}
                                  value={this.state.status}
                                >
                                  <option value="">Status</option>
                                  <option value="for_confirmation">For Confirmation</option>
                                  <option value="payment_pending">Pending</option>
                                  <option value="paid">Paid</option>
                                  <option value="cancelled">Cancelled</option>
                                  <option value="void">Void</option>
                                </Input>
                              </FormGroup>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                      <Row>
                        <Col md="6">
                          <Row>
                            <Col md="6">
                              {pageInfo && pageInfo._id !== '5ea5519c91aec75b7a387d4b'
                                ?
                                <FormGroup>
                                  <label htmlFor="startDate" className="control-label" style={{display:'block'}}>
                                    Start Date:
                                  </label>
                                  { this.state.filterDate && this.state.filterDate === 'deliveryDate' 
                                    ?
                                    <DatePicker
                                      name="dateStart"
                                      className="form-control"
                                      selectsStart
                                      startDate={this.state.dateStart}
                                      endDate={this.state.dateEnd}
                                      selected={this.state.dateStart}
                                      onChange={this.handleChangeStartDate} 
                                      showTimeSelect
                                      dateFormat="MMMM d, yyyy h:mm aa"
                                      timeIntervals={30}
                                      timeCaption="Time"
                                      autoComplete="off"
                                    />
                                    :
                                    <DatePicker
                                      name="dateStart"
                                      className="form-control"
                                      selectsStart
                                      startDate={this.state.dateStart}
                                      endDate={this.state.dateEnd}
                                      selected={this.state.dateStart}
                                      onChange={this.handleChangeStartDate}
                                      dateFormat="MMMM d, yyyy"
                                      autoComplete="off"
                                    />
                                  }
                                </FormGroup>
                                :
                                <FormGroup>
                                  <label htmlFor="startDate" className="control-label" style={{display:'block'}}>
                                    Delivery Date:
                                  </label>
                                  <DatePicker
                                    name="dateStart"
                                    className="form-control"
                                    selectsStart
                                    startDate={this.state.dateStart}
                                    selected={this.state.dateStart}
                                    onChange={this.handleChangeDate}
                                    dateFormat="MMMM d, yyyy"
                                    autoComplete="off"
                                  />
                                </FormGroup>
                              }
                            </Col>
                            <Col md="6">
                            {pageInfo && pageInfo._id !== '5ea5519c91aec75b7a387d4b' &&
                              <FormGroup>
                                <label htmlFor="endDate" className="control-label" style={{display:'block'}}>
                                  End Date:
                                </label>
                                { this.state.filterDate && this.state.filterDate === 'deliveryDate' 
                                  ?
                                  <DatePicker
                                    name="endDate"
                                    selectsEnd
                                    startDate={this.state.dateStart}
                                    endDate={this.state.dateEnd}
                                    className="form-control"
                                    selected={this.state.dateEnd}
                                    onChange={this.handleChangeEndDate}
                                    showTimeSelect
                                    dateFormat="MMMM d, yyyy h:mm aa"
                                    timeIntervals={30}
                                    timeCaption="Time"
                                    autoComplete="off"
                                  />
                                  :
                                  <DatePicker
                                    name="endDate"
                                    selectsEnd
                                    startDate={this.state.dateStart}
                                    endDate={this.state.dateEnd}
                                    className="form-control"
                                    selected={this.state.dateEnd}
                                    onChange={this.handleChangeEndDate}
                                    dateFormat="MMMM d, yyyy"
                                    autoComplete="off"
                                  />
                                }
                              </FormGroup>
                            }
                            </Col>
                          </Row>
                        </Col>
                        <Col md="6">
                          <Row>
                            {pageInfo && pageInfo._id !== '5ea5519c91aec75b7a387d4b' &&
                              <Col md="6">
                                <FormGroup>
                                  <label htmlFor="filterDate" className="control-label">
                                    Filter Date By:
                                  </label>
                                  <Input
                                    id="filterDate"
                                    name="filterDate"
                                    type="select"
                                    onChange={this.handleChangeFilterDate}
                                    value={this.state.filterDate}
                                  >
                                    <option value="deliveryDate">Delivery Date</option>
                                    <option value="orderDate">Date Ordered</option>
                                    <option value="datePaid">Date Paid</option>
                                  </Input>
                                </FormGroup>
                              </Col>
                            }
                            {pageInfo && pageInfo._id === '5ea5519c91aec75b7a387d4b' &&
                              <Col md="6">
                                <FormGroup>
                                  <label className="control-label">
                                    Actions:
                                  </label>
                                  <Button
                                    alt="Export"
                                    title="Export"
                                    className="btn btn-sm btn-round btn-info"
                                    onClick={this.exportList}
                                    >
                                    <Fa icon="file-excel" />&nbsp;Export
                                  </Button>
                                </FormGroup>
                              </Col>
                            }
                          </Row>
                        </Col>
                        <Col md="6">
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label className="control-label">
                                  <Switch
                                    onClick={this.handleToggleShowTests}
                                    on={this.state.showTests}
                                  />
                                  &nbsp;Show Tests
                                </label>
                              </FormGroup>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </CardHeader>
                    <CardBody  style={{ maxHeight: "700px", overflowY: "auto" }}>
                      <Table className="tablesorter" responsive striped style={{fontSize:"13px"}}>
                        <thead className="text-primary">
                          <tr>
                            <th>Customer</th>
                            <th>Order No.</th>
                            <th>Date Ordered</th>
                            <th>Delivery Date</th>
                            <th>Status</th>
                            <th>Delivery Status</th>
                          </tr>
                        </thead>
                        <tbody>{this.renderRows(this.state.orders)}</tbody>
                      </Table>
                    </CardBody>
                    <CardFooter>
                      <Row>
                        <Col md="12">
                          {this.state.pagination &&
                            this.state.pagination.total > 0 && (
                              <>
                                <Pagination
                                  innerClass="pagination"
                                  activePage={this.state.activePage}
                                  itemsCountPerPage={this.state.pagination.limit}
                                  totalItemsCount={this.state.pagination.total}
                                  pageRangeDisplayed={5}
                                  onChange={this.handlePageChange}
                                />
                                <p>Page <em>{this.state.activePage}</em> of <em>{Math.ceil(this.state.pagination.total/this.state.pagination.limit)}</em> of <em>{this.state.pagination.total}</em> orders.</p>
                              </>
                            )}
                        </Col>
                      </Row>
                    </CardFooter>
                  </Card>
                </Col>
                <Col className="order-details" lg="5" md="5" sm="12" style={{ height: "800px", overflowY: "auto" }} id="">
                  {this.renderDetails(this.state.singleDetails)}
                </Col>
              </Row>
              <LoadingOverlay
                active={this.state.isGeneratingXls}
                spinner
                text='Generating...'
                >
              </LoadingOverlay>
            </div>
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

const lastSixDigit = (value) => {
  let str = value.toString();
  return new Array(str.length - 6 + 1).join("") + str.slice(-6);
};

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

const mapStateToProps = () => ({});

export default connect(
  mapStateToProps,
  {
    receivePayment,
    saveNewStatus,
    pickUp,
    cancelAction,
    checkIfMine,
    fetchSingleOrderData
  }
)(Orders);