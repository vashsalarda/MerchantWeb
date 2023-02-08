import React from "react";
import { connect } from "react-redux";
import queryString from "query-string";
import {
  getOrders,
  saveNewStatus,
  pickUp,
  cancelAction,
  checkIfMine,
  receivePayment,
  fetchSingleOrderData
} from "../../layouts/Admin/actions/OrderActions";
import { getSession } from "../../config/session";
import { PulseLoader } from "react-spinners";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Pagination from "react-js-pagination";
import NotificationAlert from "react-notification-alert";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Table,
  Row,
  Col,
  Media,
  Button,
  Badge,
  Input,
  Label,
  Form,
  FormGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "reactstrap";
import firebase from "firebase";
import { Client } from 'nes';
import { format } from 'date-fns'

let nesClient = new Client('wss://www.streetby.app');
// if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
//   nesClient = new Client('ws://127.0.0.1:5000');
// } else {
  // nesClient = new Client('wss://www.streetby.app');
// }

class Orders extends React.Component {
  constructor(props) {
    super(props);
    this.toggleDrop = this.toggleDrop.bind(this);
    this.state = {
      orders: [],
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
      canPickUp: false,
      selectFilter: "",
      keyword: "",
      showPickUpModal: false,
      showPaymentModal: false,
      providerNote: "",
      isGrocery: false
    };
    this.togglePickupModal = this.togglePickupModal.bind(this);
    this.toggleConfirm = this.toggleConfirm.bind(this);
    this.toggle = this.toggle.bind(this);
    this.toggleNested = this.toggleNested.bind(this);
    this.toggleAll = this.toggleAll.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.handleChangeKeyword = this.handleChangeKeyword.bind(this);
    this.handleEnter = this.handleEnter.bind(this);
    this.handleFilterEnter = this.handleFilterEnter.bind(this);
  }

  clientConnect() {
    const { sessionToken } = JSON.parse(getSession("userData"));
    nesClient.disconnect(); // disconnect first to avoid issues
    nesClient.connect(
      { auth: { headers: { Authorization: `Bearer ${sessionToken}` } } },
      (err) => {
        if (err) {
          console.log('connection error', err);
          nesClient.disconnect();
          this.clientConnect();
        } else {
          const handler = (update, flags) => {
            const { sessionToken } = JSON.parse(getSession("userData"));
            // order-update
            // delivery-update
            // new-order
            this.props.fetchSingleOrderData(update.orderId, sessionToken,  (err, res) => {
              if (err) {
                console.log('socket error', err);
              }
              let orders = this.state.orders;
              if(orders instanceof Array && orders.length > 0) {
                let indexOfOrderToUpdate = orders.findIndex(eachOne => eachOne._id.toString() === update.orderId);
                orders[indexOfOrderToUpdate] = res;
                let latestDeliveryStatus = "";
                if(res && res.delivery && res.delivery[res.delivery.length -1] && res.delivery[res.delivery.length -1].status) {
                  latestDeliveryStatus = res.delivery[res.delivery.length -1].status;
                }
                const isCurrentlyActiveOrder = this.state.singleDetails._id === (res && res._id) ? res._id : "";;
                this.setState({
                  orders,
                  canPickUp: isCurrentlyActiveOrder && latestDeliveryStatus === 'inPreparation' ? true : this.state.canPickUp,
                  singleDetails: isCurrentlyActiveOrder ? res : this.state.singleDetails,
                });
              }
            })
          };
          nesClient.subscribe(`/subscriptions/pageOrdersUpdate/${JSON.parse(getSession("defaultPage"))}`, handler, err => console.log('subscription err', err));
        }
      }
    );
  }

  componentDidMount() {
    const pageInfo = JSON.parse(getSession("pageInfo"));
    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') { // If Grocery
      this.setState({isGrocery:true});
    } else {
      this.props.history.push("/order-list");
      window.location.reload();
    }
    let url = this.props.location.search;
    let query = queryString.parse(url);
    let activePage = query.page ? Number(query.page) : 1;
    let parent = query.parent ? query.parent : "";
    let sortBy = query.sortBy ? query.sortBy : "created";
    let sort = query.sort ? query.sort : "desc";
    let queryStr = "?" + queryString.stringify(query);
    this.setState({
      activePage: activePage,
      parent: parent,
      sort: sort,
      sortBy: sortBy,
      singleDetails: this.state.orders[0],
      pageName: pageInfo && pageInfo.name ? pageInfo.name : ''
    }, () => {
      this.clientConnect();
    });
    let defaultPage = JSON.parse(getSession("defaultPage"));
    this.refreshOrders(queryStr, defaultPage);
  }

  componentWillUnmount() {
    nesClient.disconnect();
  }

  toggleConfirm() {
    this.setState(prevState => ({
      modalConfirm: !prevState.modalConfirm
    }));
  }

  toggle() {
    this.setState(prevState => ({
      modal: !prevState.modal,
      reason: "",
      subReason: ""
    }));
  }

  toggleDrop() {
    this.setState(prevState => ({
      dropdownOpen: !prevState.dropdownOpen
    }));
  }

  toggleNested() {
    this.setState({
      nestedModal: !this.state.nestedModal,
      closeAll: false
    });
  }

  toggleAll() {
    this.setState({
      nestedModal: !this.state.nestedModal,
      closeAll: true
    });
  }

  togglePickupModal() {
    this.setState(prevState => ({
      showPickUpModal: !prevState.showPickUpModal
    }));
  }

  handleFilterChange(e) {
    this.setState({
      selectFilter: e.target.value
    });
  }

  handleChangeKeyword(e) {
    let { value } = e.target;
    this.setState({ keyword: value });
  }

  handleChange(e) {
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

  verifyPayment() {
    const chargedAmount = this.state.singleDetails.promoParsedGrandTotal !== undefined ? this.state.singleDetails.promoParsedGrandTotal : this.state.singleDetails.grandTotal;
    const paymentReceived = this.state.paymentReceived || 0;
    if (chargedAmount > paymentReceived) {
      this.showNotificationError('Please enter valid amount');
    } else {
      const { sessionToken } = JSON.parse(getSession("userData"));
      const paymentData = {
        invoiceId: this.state.singleDetails.invoiceDetails._id,
        totalPaid: chargedAmount,
        customerCash: paymentReceived,
      };
      if (this.state.singleDetails.isDelivery) {
        paymentData.deliveryFee = this.state.singleDetails.delivery[0].fee;
      }
      this.props.receivePayment(paymentData, sessionToken, (result, error) => {
        if (error) {
          console.log('error', error);
        }
        this.setState({
          showPaymentModal: false
        }, () => {
          this.showNotification('Successfully received payment');
          this.changeStatus('paid');
        })
      })
    }
  }

  renderActionButtonModal(action) {
    const closeBtn = (
      <button className="close" onClick={this.toggle}>
        &times;
      </button>
    );
    return (
      <div>
        <Modal isOpen={this.state.showPaymentModal} className={this.props.className} style={{ marginTop: '5.75rem' }}>
          <ModalHeader>
            Receive Order
          </ModalHeader>
          <ModalBody>
            { this.state.showPaymentWarning &&
              <p>let go</p>
            }
            <Form>
              <FormGroup>
                <Label for="amountRcvd">Please enter the received payment</Label>
                <Input type="number" name="paymentReceived" id="amountRcvd" placeholder="Amount" onChange={(e) => this.setState({ paymentReceived: e.nativeEvent.target.value })}/>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => { this.verifyPayment() }}>
              Confirm
            </Button>
            <Button color="secondary" onClick={() => this.setState({ showPaymentModal: false })}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

        <Modal isOpen={this.state.showPickUpModal} toggle={this.togglePickupModal} className={this.props.className}>
          <ModalHeader toggle={this.togglePickupModal}>
            Pick Up Order
          </ModalHeader>
          <ModalBody>
            Are you sure this order has been picked up?
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => { this.pickUpOrder(this.state.singleDetails); }}>
              Confirm
            </Button>
            <Button color="secondary" onClick={this.togglePickupModal}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

        <Modal
          isOpen={this.state.modalConfirm}
          toggle={this.toggleConfirm}
          className={this.props.className}
        >
          <ModalHeader toggle={this.toggleConfirm}>
            Confirmation
          </ModalHeader>
          <ModalBody>
            Are you sure you want to confirm this order?
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={() => { this.orderAction("confirm", action._id) }}>
              Okay
            </Button>
            <Button color="secondary" onClick={this.toggleConfirm}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
        <Modal
          isOpen={this.state.modal}
          toggle={this.toggleDrop}
          className={this.props.className}
        >
          <ModalHeader toggle={this.toggle} close={closeBtn}>
            Why do you want to cancel this order?
          </ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup>
                <Input
                  placeholder="Cancelation Reason"
                  id="reason"
                  name="reason"
                  className="input-lg"
                  type="textarea"
                  onChange={value =>
                    this.setState({ reason: value.target.value })
                  }
                  value={this.state.reason}
                ></Input>

                <Input
                  id="productStatus"
                  name="productStatus"
                  className="input-lg"
                  type="select"
                  onChange={this.handleChange}
                  value={this.state.status}
                >
                  <option value="Product not available'">
                    Product not available
                  </option>
                  <option value="Close and others">Close and others</option>
                </Input>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.toggle}>
              Cancel
            </Button>{" "}
            <Button
              color="secondary"
              onClick={() => {
                this.orderAction("cancel", action._id);
              }}
            >
              Confirm
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    )
  }

  renderActionButtons(orderData) {
    let status = orderData.status;
    let deliveryStatus = orderData.isDelivery ? orderData.delivery[orderData.delivery.length - 1].status : '';
    if (status !== "cancelled" && status !== "void") {
      if (status === "for_confirmation") {
        return (
          <div>
            {this.renderActionButtonModal(orderData)}
            <Button
              outline
              className="btn-round btn-sm"
              color="info"
              onClick={() => {
                this.toggleConfirm();
              }}
            >
              Confirm
            </Button>{" "}
            <Button
              outline
              className="btn-light btn-round btn-sm"
              color="secondary"
              onClick={this.toggle}
            >
              Cancel
            </Button>{" "}
          </div>
        );
      } else if (status === 'payment_pending') {
        if (deliveryStatus === 'inTransit' || deliveryStatus === 'orderCompleted') {
          if (orderData.selectedPaymentOption === 'cash') {
            return(
              <div>
                {this.renderActionButtonModal(orderData)}
                <Button
                  className={"btn-round btn-primary-v2 btn-sm"}
                  onClick={() => {
                    this.setState({ showPaymentModal: true });
                  }}
                  disabled={orderData.requestedForVoid}
                >
                  Receive Payment
                </Button>
              </div>
            )
          } else {
            return //noop
          }
        } else if (deliveryStatus !== 'inTransit') {
          return (
            <div>
              {this.renderActionButtonModal(orderData)}
              <Button
                className={!this.state.canPickUp ? "btn-round btn-disabled-v2 btn-sm" : "btn-round btn-primary-v2 btn-sm"}
                onClick={() => {
                  if (!this.state.canPickUp) {
                    this.showNotificationError('No rider has been deployed yet.');
                  } else {
                    this.togglePickupModal();
                  }
                }}
                disabled={orderData.requestedForVoid}
              >
                Pick up Order
                { orderData.requestedForVoid &&
                  <Badge color="dark" pill>
                    Requested for Void
                  </Badge>
                }
              </Button>
            </div>
          );
        }
      }
    }
  }

  renderDetails() {
    const order = this.state.singleDetails;
    if (this.state.isLoading) {
      return (
        <table>
          <tbody>
            <tr>
              <td colSpan="8">
                <PulseLoader
                  sizeUnit={"px"}
                  size={15}
                  color={"#1d8cf8"}
                  loading={this.state.isLoading}
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
                <strong style={{ color: '#3C99BE', fontSize: 18 }}>
                  Order No:  {order._id.substr(order._id.length - 6)}
                </strong>
              </center>
              <div style={{ display: 'flex', flexDirection: 'row', marginTop: 25 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
                  <div>
                    {this.renderImage(this.state.singleDetails)}
                  </div>
                  <div style={{ paddingLeft: 10, paddingTop: 5 }}>
                    <p style={{ fontWeight: 'bold', color: '#3B3A39', fontSize: 12 }}>
                      {this.state.singleDetails.customer.firstName} {this.state.singleDetails.customer.lastName}
                    </p>
                    <p style={{ fontWeight: 'bold', color: '#3B3A39', fontSize: 12 }}>
                      {this.state.singleDetails.customer.mobileNumbers[0]}
                    </p>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="roundLabel" style={{ backgroundColor: order.status === 'void' ? '#3B3A39' : '#3C99BE', width: '60%' }}>
                      {order.status}
                    </div>
                    <div className="roundLabel" style={{ backgroundColor: '#F8BF45', width: '60%' }}>
                      {order.products[order.products.length - 1].diningOption}
                    </div>
                    <div className="roundLabel" style={{ backgroundColor: '#D16E66', width: '60%' }}>
                      {order.selectedPaymentOption}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
            <div style={{ marginLeft: 10 }}>
              {this.renderActionButtons(this.state.singleDetails)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginRight: 20 }}>
              <Button color="link" aria-label="PDF" style={{ padding: "0.5rem 0.25rem" }}>
                <span aria-hidden>
                  <Fa
                    icon="file-pdf"
                    size={'lg'}
                    onClick={() => {
                      this.printMinDetails(order);
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
                      this.printDetails(order);
                    }}
                  />
                </span>
              </Button>
            </div>

            <CardBody>
              <Table borderless style={{marginBottom:'0'}}>
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
                </tbody>
              </Table>
            </CardBody>
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
                  <strong className="text-danger">
                    <em>No Orders found.</em>
                  </strong>
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
    let containerFee = 0;
    const serviceCharge = (order.extraFees && order.extraFees.serviceCharge) || 0;
    const { products } = order;
    let grandTotal = 0;
    let itemsTotal = 0;
    let convenienceFee = 0;
    const deliveryFee = order.delivery && order.delivery[0] && order.delivery[0].fee ? order.delivery[0].fee : 0;
    const cargoFee = order.convenienceFee && order.convenienceFee.value ? order.convenienceFee.value : 0;
    const pointsAmountUsed = order.pointsAmountUsed ? order.pointsAmountUsed : 0;
    const walletAmountUsed = order.walletAmountUsed ? order.walletAmountUsed : 0;
    const promos = order.orderPromoDiscount ? order.orderPromoDiscount : 0;
    products.forEach(item => {
      itemsTotal += item.price * item.quantity;
      if(item.markup && item.markup > 0) {
        convenienceFee += item.markup * item.quantity;
      }
      if(item.containerFee && item.containerFee.amount) {
        containerFee += item.containerFee.amount;
      }
    })
    
    grandTotal = itemsTotal + convenienceFee + cargoFee + containerFee + serviceCharge + deliveryFee;
    const customerPayout = grandTotal - (pointsAmountUsed + walletAmountUsed + promos);
    
    return (
      <div style={{color: 'rgba(34, 42, 66, 0.7) !important'}}>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <strong>Items Total</strong>
          <strong>&#8369;{numberWithCommas(itemsTotal)}</strong>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
        { order.page && order.page.pageType && order.page.pageType === '5cd141d10d437be772373ddb'
          ?
          <>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>Cargo Fee</strong>
              <strong style={{ color: '#3C99BE' }}>&#8369;{numberWithCommas(cargoFee)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>Convenience Fee</strong>
              <strong style={{ color: '#3C99BE' }}>&#8369;{numberWithCommas(convenienceFee)}</strong>
            </div>
          </>
          :
          <>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>Container Fee</strong>
              <strong style={{ color: '#3C99BE' }}>&#8369;{numberWithCommas(containerFee)}</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>Service Fee</strong>
              <strong style={{ color: '#3C99BE' }}>&#8369;{numberWithCommas(serviceCharge)}</strong>
            </div>
          </>
        }
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <strong>Delivery Fee</strong>
          <strong style={{ color: '#3C99BE' }}>&#8369;{numberWithCommas(deliveryFee)}</strong>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <strong>GRAND TOTAL</strong>
          <strong style={{ color: '#3C99BE' }}>&#8369;{numberWithCommas(grandTotal)}</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <strong>CUSTOMER PAYOUT</strong>
          <strong style={{ color: '#3C99BE' }}>&#8369;{numberWithCommas(customerPayout)}</strong>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
      </div>
    )
  }

  renderVerticalLine() {
    return (
      <div style={{ borderLeft: '2px solid #3C99BE', height: 40 }}></div>
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
      <div>
        <strong style={{paddingBottom:15}}>
          DELIVERY STATUS
        </strong>
        <div style={{width: '30%'}}>
          {this.state.singleDetails.delivery.map((data, index) => {
            const isFinalData = this.state.singleDetails.delivery.length - 1 === index;
            const status = this.deliveryStatusParser(data.status);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} key={index}>
                <p style={{ fontSize: 15, color: 'rgb(59, 58, 57, 0.7)', fontWeight: 'bold', textAlign: 'center' }}>Order is {status}</p>
                <p style={{ fontSize: 11, color: '#D16E66', margin: 0 }}>{format(new Date(data.updatedAt),'MMM dd, yyyy hh:mm a')}</p>
                {!isFinalData && this.renderVerticalLine()}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  renderOrderInfo(order) {
    let latestDeliveryInfo = order.delivery[order.delivery.length - 1];
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ flex: 1.5 }}>
            <strong>Estimated Delivery Pick-up Time</strong>
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#3C99BE' }}>
            {latestDeliveryInfo && latestDeliveryInfo.pickupDate
              ? format(new Date(latestDeliveryInfo.pickupDate),'MMM dd, yyyy hh:mm a')
              : 'No date selected'
            }
            </strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ flex: 1.5 }}>
             <strong>Ordered On</strong>
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#3C99BE' }}>
              {format(new Date(order.createdAt),'MMM dd, yyyy hh:mm a')}
            </strong>
          </div>
        </div>
        { latestDeliveryInfo && latestDeliveryInfo.deliveryEstimateDescription ?
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
            <div style={{ flex: 1.5 }}>
               <strong>Estimated Time</strong>
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#3C99BE' }}>{latestDeliveryInfo.deliveryEstimateDescription}</strong>
            </div>
          </div>
          :
          <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
            <div style={{ flex: 1.5 }}>
               <strong>Booked For</strong>
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ color: '#3C99BE' }}>
                { latestDeliveryInfo && latestDeliveryInfo.to 
                  ? format(new Date(latestDeliveryInfo.to),'MMM dd, yyyy hh:mm a')
                  : 'No date selected'
                }
              </strong>
            </div>
          </div>
        }
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ flex: 1.5 }}>
             <strong>Dining Option</strong>
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#3C99BE' }}>{order.products[0].diningOption.toUpperCase()}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ flex: 1.5 }}>
             <strong>Payment Method</strong>
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ color: '#3C99BE' }}>{order.selectedPaymentOption.toUpperCase()}</strong>
          </div>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
        <div>
          <strong>Notes from the Customer</strong>
          <p style={{ color: '#3C99BE', paddingLeft: 10, marginTop: 10 }}>{order.consumerNotes || 'No note added'}</p>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
        { order.status !== 'for_confirmation' ?
          <div>
            <strong>Provider Notes</strong>
            <p style={{ color: '#3C99BE', paddingLeft: 10, marginTop: 10 }}>{order.notes || 'No note added'}</p>
          </div>
          :
          <div>
            <strong>Provider Notes</strong>
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
      </>
    );
  }

  checkProductPhotos(prod) {
    let productPhoto;
    if (prod && prod._id && prod._id.photos && prod._id.photos.length > 0) {
      productPhoto = prod._id.photos[prod._id.photos.length - 1].medium;
    } else {
      productPhoto =
        "https://s3-ap-northeast-1.amazonaws.com/storage.streetby.com/logo.png";
    }
    return (
      <>
        <Media left top href="#">
          <Media
            object
            data-src={productPhoto}
            src={productPhoto}
            alt={prod.name}
          />
        </Media>
      </>
    );
  }

  renderProducts(prods) {
    return prods.products.map((prod, index, productsArr) => (
      <tr key={index}>
        <td><strong>{index+1}.</strong></td>
        <td width={'50%'}>
          <Media>
            {this.checkProductPhotos(prod)}
            <Media body>
              <Media style={{ fontSize: "13px", marginBottom: "0px" }} heading>
                {prod.name}
              </Media>
            </Media>
          </Media>
        </td>
        <td width={'10%'}>{prod.quantity}</td>
        <td width={'20%'}>₱{numberWithCommas(prod.price)}</td>
        <td width={'20%'}>₱{numberWithCommas(prod.price * prod.quantity)}</td>
      </tr>
    ));
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
        // update delivery status of selected order
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

  handleFilterEnter(e) {
    let { key } = e;
    if (key === "Enter") {
      let { keyword, selectFilter } = this.state;
      this.setState({ isLoading: true });
      let defaultPage = JSON.parse(getSession("defaultPage"));
      let url = this.props.location.search;
      let query = queryString.parse(url);
      delete query.message;
      if (selectFilter !== "") {
        query.selectFilter = selectFilter;
      } else {
        delete query.selectFilter;
      }
      if (keyword !== "") {
        query.keyword = keyword;
      } else {
        delete query.keyword;
      }
      let queryStr = "?" + queryString.stringify(query);
      this.refreshOrders(queryStr, defaultPage);
    }
  }

  handleEnter(e) {
    let { key } = e;
    if (key === "Enter") {
      let { keyword, selectFilter } = this.state;
      this.setState({ isLoading: true });
      let defaultPage = JSON.parse(getSession("defaultPage"));
      let url = this.props.location.search;
      let query = queryString.parse(url);
      delete query.message;
      if (selectFilter !== "") {
        query.selectFilter = selectFilter;
      } else {
        delete query.selectFilter;
      }
      if (keyword !== "") {
        query.keyword = keyword;
      } else {
        delete query.keyword;
      }
      let queryStr = "?" + queryString.stringify(query);
      this.refreshOrders(queryStr, defaultPage);
    }
  }

  handlePageChange(pageNumber) {
    this.setState({ isLoading: true });
    let defaultPage = JSON.parse(getSession("defaultPage"));

    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.page = pageNumber;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ activePage: pageNumber });
    this.refreshOrders(queryStr, defaultPage);
  }

  showDetails(newDetails) {
    if (
      newDetails.delivery &&
      newDetails.delivery instanceof Array &&
      newDetails.delivery.length > 0 &&
      newDetails.delivery[newDetails.delivery.length - 1].status ===
        "inPreparation"
    ) {
      this.setState({
        canPickUp: true
      });
    } else {
      this.setState({
        canPickUp: false
      });
    }
    this.setState({
      singleDetails: newDetails
    });
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

  printDetails(item) {
    let i;
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
    const promos = item.orderPromoDiscount ? item.orderPromoDiscount : 0;
    const email = item.customer.email ? item.customer.email : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
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
      const shopperEmail = item.shopper && item.shopper.email ? item.shopper.email : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
      const shopperPhone = item.shopper && item.shopper.mobileNumbers && item.shopper.mobileNumbers instanceof Array && item.shopper.mobileNumbers.length > 0 ? item.shopper.mobileNumbers[0].number : ""; 
      shopperInfo = `<p><strong style="white-space: nowrap;">Shopper:</strong> ${shopperName}</p>
      <p><strong style="white-space: nowrap;">Shopper Email:</strong> ${shopperEmail} <span style="white-space: nowrap;"><strong>&nbsp;&nbsp;&nbsp;&nbsp;Shopper Phone No.:</strong> ${shopperPhone}</span></p>`
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
    for (i = 0; i <= item.products.length - 1; i++) {
      if(i%2===1) {
        rowClass = "odd";
      } else {
        rowClass = "";
      }
      const barcode = item.products[i]._id && item.products[i]._id.barcode ? item.products[i]._id.barcode : "";
      const itemCode = item.products[i]._id && item.products[i]._id.itemCode ? item.products[i]._id.itemCode : "";
      const productId = item.products[i]._id && item.products[i]._id._id ? "..." + lastSixDigit(item.products[i]._id._id) : "";
      htmlProducts += `<tr class="${rowClass}">
        <td>${i+1} . ▢</td>
        <td>${item.products[i].name}</td>
        <td>${productId}</td>
        <td>${itemCode}</td>
        <td>${barcode}</td>
        <td nowrap>&#8369;${numberWithCommas(item.products[i].price)}</td>
        <td align="center">${item.products[i].quantity}</td>
        <td nowrap>&#8369;${numberWithCommas(item.products[i].price * item.products[i].quantity)}</td>
      </tr>`;
      itemsTotal += item.products[i].price * item.products[i].quantity;
      if(item.products[i].markup && item.products[i].markup > 0) {
        convenienceFee += item.products[i].markup * item.products[i].quantity;
      }
      if(item.products[i] && item.products[i].containerFee && item.products[i].containerFee.amount) {
        containerFee += item.products[i].containerFee.amount;
      }
    }
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
            .container { margin: 25px; height:95%; overflow:auto; }
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
                  <th width="50%">Order Date: ${format(new Date(item.createdAt),'yyyy-MM-dd hh:mm a')} </th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:none;">
                  <td>
                    <table style="width:100%; font-size:14px; border-bottom:none;">
                      <tbody>
                        <tr>
                          <td style="border-bottom:none; padding-left:0;">
                            <p><strong style="white-space: nowrap;">Customer Name:</strong> ${item.customer.firstName} ${item.customer.lastName}</p>
                            <p><strong style="white-space: nowrap;">Email:</strong> ${email} <span style="white-space: nowrap;"><strong>&nbsp;&nbsp;&nbsp;&nbsp;Phone:</strong> ${phone}</span></p>
                            <p><strong style="white-space: nowrap;">Receiver:</strong> ${receiverName} <span style="white-space: nowrap;"><strong>&nbsp;&nbsp;&nbsp;&nbsp;Phone:</strong> ${receiverPhone}</span></p>
                            ${shopperInfo}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td>
                    <table style="width:100%; font-size:14px; border-bottom:none;">
                      <tbody>
                        <tr>
                          <td style="border-bottom:none;">
                            <p><strong>Booking Option:</strong> ${bookingOption}</p>
                            <p><strong>Delivery Date:</strong> ${format(new Date(item.timeSelected),'MMM dd, yyyy hh:mm a')}</p>
                            <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
                            <p><strong>Google Map Address:</strong> ${gMapAddress}</p>
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
                  <td>
                    <table style="max-width:50%; border-bottom:none; font-size:14px;">
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
  }

  printMinDetails(item) {
    let i;
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
    const promos = item.orderPromoDiscount ? item.orderPromoDiscount : 0;
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
      const shopperEmail = item.shopper && item.shopper.email ? item.shopper.email : "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
      const shopperPhone = item.shopper && item.shopper.mobileNumbers && item.shopper.mobileNumbers instanceof Array && item.shopper.mobileNumbers.length > 0 ? item.shopper.mobileNumbers[0].number : ""; 
      shopperInfo = `<p><strong style="white-space: nowrap;">Shopper:</strong> ${shopperName}</p>
      <p><strong style="white-space: nowrap;">Shopper Email:</strong> ${shopperEmail} <span style="white-space: nowrap;"><strong>&nbsp;&nbsp;&nbsp;&nbsp;Shopper Phone No.:</strong> ${shopperPhone}</span></p>`
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
    for (i = 0; i <= item.products.length - 1; i++) {
      if(i%2===1) {
        rowClass = "odd";
      } else {
        rowClass = "";
      }
      const itemCode = item.products[i]._id && item.products[i]._id.itemCode ? item.products[i]._id.itemCode : "";
      const barcode = item.products[i]._id && item.products[i]._id.barcode ? item.products[i]._id.barcode : "";
      htmlProducts += `<tr class="${rowClass}">
        <td>${i+1} . ${item.products[i].name}</td>
        <td nowrap>${itemCode}</td>
        <td>${barcode}</td>
        <td nowrap>&#8369;${numberWithCommas(item.products[i].price)}</td>
        <td align="center">${item.products[i].quantity}</td>
        <td nowrap>&#8369;${numberWithCommas(item.products[i].price * item.products[i].quantity)}</td>
      </tr>`;
      itemsTotal += item.products[i].price * item.products[i].quantity;
      if(item.products[i].markup && item.products[i].markup > 0) {
        convenienceFee += item.products[i].markup * item.products[i].quantity;
      }
      if(item.products[i] && item.products[i].containerFee && item.products[i].containerFee.amount) {
        containerFee += item.products[i].containerFee.amount;
      }
    }
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
                  <th>Order No.:<span style="margin-left:15px;">${item._id}</span></th>
                  <th>Order Date: ${format(new Date(item.createdAt),'yyyy-MM-dd hh:mm a')}</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:none;">
                  <td width="50%">
                    <table style="width:100%; font-size:14px; border-bottom:none;">
                      <tbody>
                        <tr>
                          <td style="border-bottom:none; padding-left:0;">
                            <p><strong style="white-space: nowrap;">Customer Name:</strong> ${item.customer.firstName} ${item.customer.lastName}</p>
                            <p><strong style="white-space: nowrap;">Email:</strong> ${email} <span style="white-space: nowrap;"><strong>&nbsp;&nbsp;&nbsp;&nbsp;Phone:</strong> ${phone}</span></p>
                            <p><strong style="white-space: nowrap;">Receiver:</strong> ${receiverName} <span style="white-space: nowrap;"><strong>&nbsp;&nbsp;&nbsp;&nbsp;Phone:</strong> ${receiverPhone}</span></p>
                            ${shopperInfo}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td width="50%">
                    <table style="width:100%; font-size:14px; border-bottom:none;">
                      <tbody>
                        <tr>
                          <td style="border-bottom:none;">
                            <p><strong>Booking Option:</strong> ${bookingOption}</p>
                            <p><strong>Delivery Date:</strong> ${format(new Date(item.timeSelected),'MMM dd, yyyy hh:mm a')}</p>
                            <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
                            <p><strong>Google Map Address:</strong> ${gMapAddress}</p>
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
                  <td>
                    <table style="max-width:50%; border-bottom:none; font-size:14px;">
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
  }

  renderImage(item) {
    let defaultPhoto =
      "https://s3-ap-northeast-1.amazonaws.com/storage.streetby.com/logo.png";
    var pp = item && item.customer && item.customer._id && item.customer._id.photos && item.customer._id.photos[0]
      ? item.customer._id.photos[0].thumb
      : defaultPhoto;
    return (
      <Media object data-src={pp} src={pp} alt={item.customer.firstName} />
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
            {item.selectedPaymentOption}
          </div>
        </div>
      );
    } else {
      return (
        <>
          <Badge style={{ fontSize: "13px" }} color="info" pill>
            {item.status}
          </Badge>
          <Badge style={{ fontSize: "13px" }} color="warning" pill>
            {item.products[item.products.length - 1].diningOption}
          </Badge>
          <Badge style={{ fontSize: "13px" }} color="danger" pill>
            {item.selectedPaymentOption}
          </Badge>
          <Button color="link" aria-label="PDF" style={{ padding: "0.5rem 0.25rem" }}>
            <span aria-hidden>
              <Fa
                icon="file-pdf"
                size={'lg'}
                onClick={() => {
                  this.printMinDetails(item);
                }}
              />
            </span>
          </Button>
          <Button 
            style={{ fontSize: "13px", padding: "0.5rem 0.25rem" }}
            className="btn-success-v2 btn-round float-right"
            onClick={() => {
              this.printDetails(item);
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
    const delivery =
      details.isDelivery && details.delivery[0].deliveryAddress.address
        ? details.delivery[0].deliveryAddress.address
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
      <>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, marginTop: 10 }}>
          <strong>CUSTOMER DETAILS</strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ width: '60%' }}>
            <strong>Fullname</strong>
          </div>
          <div style={{ width: '40%' }}>
            <strong style={{ color: '#3C99BE' }}>{details.customer.firstName} {details.customer.lastName}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ width: '60%' }}>
            <strong>Phone No.</strong>
          </div>
          <div style={{ width: '40%' }}>
            <strong style={{ color: '#3C99BE' }}>{details.customer.mobileNumbers[0]}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row' }}>
          <div style={{ width: '60%' }}>
            <strong>Email Address</strong>
          </div>
          <div style={{ width: '40%' }}>
            <strong style={{ color: '#3C99BE' }}>{details.customer.email}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ width: '60%' }}>
            <strong>Address</strong>
          </div>
          <div style={{ width: '40%' }}>
            <strong style={{ color: '#3C99BE' }}>{delivery}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ width: '60%' }}>
            <strong>Receiver</strong>
          </div>
          <div style={{ width: '40%' }}>
            <strong style={{ color: '#3C99BE' }}>{receiverName}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
          <div style={{ width: '60%' }}>
            <strong>Phone No.</strong>
          </div>
          <div style={{ width: '40%' }}>
            <strong style={{ color: '#3C99BE' }}>{receiverPhone}</strong>
          </div>
        </div>
        <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
      </>
    );
  }

  renderShopperInfo(shopper) {
    if(this.state.isGrocery) {
      if(shopper) {
        return (
          <>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, marginTop: 10 }}>
              <strong>SHOPPER DETAILS</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
              <div style={{ width: '60%' }}>
                <strong>Fullname</strong>
              </div>
              <div style={{ width: '40%' }}>
                <strong style={{ color: '#3C99BE' }}>{shopper.firstName ? shopper.firstName : ""} {shopper.lastName ? shopper.lastName : ""}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10 }}>
              <div style={{ width: '60%' }}>
                <strong>Phone No.</strong>
              </div>
              <div style={{ width: '40%' }}>
                <strong style={{ color: '#3C99BE' }}>{shopper.mobileNumbers && shopper.mobileNumbers[0] && shopper.mobileNumbers[0].number ? shopper.mobileNumbers[0].number : ""}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div style={{ width: '60%' }}>
                <strong>Email Address</strong>
              </div>
              <div style={{ width: '40%' }}>
                <strong style={{ color: '#3C99BE' }}>{shopper.email ? shopper.email : ""}</strong>
              </div>
            </div>
            <hr style={{ backgroundColor: 'rgba(169,169,169,0.5)' }} />
          </>
        );
      } else {
        return (
          <>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, marginTop: 10 }}>
              <strong>SHOPPER DETAILS</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 10, marginTop: 10 }}>
              <p style={{ color: '#3C99BE', paddingLeft: 10 }}>No shopper added.</p>
            </div>
          </>
        );
      }
    }
  }

  renderRows() {
    if (this.state.isLoading) {
      return (
        <tr>
          <td colSpan="8">
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
      if (this.state.orders instanceof Array && this.state.orders.length > 0) {
        return this.state.orders.map((item, index) => (
          <tr
            key={index}
            onClick={() => {
              this.showDetails(item);
            }}
            className="order-list-item"
          >
            <td width="100">
              <Media style={{ display: 'flex', alignItems: 'center' }}>
                <Media left top href="#">
                  {this.renderImage(item)}
                </Media>
                <p style={{ marginBottom: 10 }}>
                  {item.customer.firstName} {item.customer.lastName}
                </p>
              </Media>
            </td>
            <td width="120">
              <p>{format(new Date(item.createdAt),'yyyy-MM-dd hh:mm a')}</p>
            </td>
            <td width="50">
              <p>{item._id}</p>
            </td>
          </tr>
        ));
      } else {
        return (
          <tr>
            <td colSpan="7">
              <strong className="text-danger">
                <em>No Orders found.</em>
              </strong>
            </td>
          </tr>
        );
      }
    }
  }

  checkOrder(query, pageId, sessionToken) {
    this.props.getOrders(query, pageId, sessionToken, (result, error) => {
      if (result && result.data && result.data.docs) {
        const orders = result.data.docs;
        this.setState({
          orders: orders,
          pagination: result.data.pagination,
          singleDetails: orders[0]
        });
      }
      this.setState({ isLoading: false });
    });
  }

  refreshOrders(queryStr, pageId) {
    const query = queryString.parse(queryStr);
    this.props.history.push("/orders" + queryStr);
    const userData = JSON.parse(getSession("userData"));
    const { sessionToken } = userData;
    if (userData != null) {
      this.props.getOrders(query, pageId, sessionToken, (result, error) => {
        if (result && result.data && result.data.docs) {
          const orders = result.data.docs;
          this.setState({
            orders: orders,
            pagination: result.data.pagination,
            singleDetails: orders[0],
            canPickUp: orders[0].isDelivery && orders[0].delivery[orders[0].delivery.length - 1].status === 'inPreparation',
          });
          firebase.initializeApp(result.data.firebaseConfig);
        }

        try {
          const firebaseReff = firebase.database().ref().child("orders");
          const firebaseReff1 = firebase.database().ref().child("cancelled_orders");
          const firebaseDeployed = firebase.database().ref().child("deployed");

          firebaseReff1.on("child_added", snap => {
            let { orderId } = snap.val();
            const { orders } = this.state;
            if(orders instanceof Array && orders.length > 0 && typeof orderId !== 'undefined') {
              let orderExist = orders.findIndex(
                orderIdFind => orderIdFind._id.toString() === orderId.toString()
              );
              if (orderExist > -1) {
                let order = this.state.orders;
                let index = order.findIndex(
                  eachOne => eachOne._id.toString() === orderId.toString()
                );
                order[index].status = "cancelled";
                this.setState({orders: order});
                this.showNotification('The order has been cancelled.');
              }
            }
          });

          firebaseDeployed.on("child_added", snap => {
            let { orderId } = snap.val();
            const { orders } = this.state;
            if(orders instanceof Array && orders.length > 0 && typeof orderId !== 'undefined') {
              let orderExist = orders.findIndex(
                orderIdFind => orderIdFind._id.toString() === orderId.toString()
              );
              if (orderExist > -1) {
                this.setState({
                  canPickUp: true
                });
                let orderHold = this.state.orders[orderExist].delivery;
                let newOrders = this.state.orders;
                newOrders[orderExist].delivery[orderHold.length - 1].status =
                  "inTransit";
                this.setState({
                  orders: newOrders
                });
              }
            }
          });

          firebaseReff.on("child_added", snap => {
            let { orderId, pageIdCheck } = snap.val();
            const orders = this.state.orders;
            if(orders instanceof Array && orders.length > 0 && typeof orderId !== 'undefined') {
              let orderExist = orders.findIndex(
                orderIdFind => orderIdFind._id.toString() === orderId.toString()
              );
              if (pageIdCheck) {
              } else {
                pageIdCheck = "01234";
              }
              if (
                pageIdCheck.toString() === pageId.toString() &&
                orderExist === -1
              ) {
                this.showNotification("You have a new order received.");
                this.checkOrder(query, pageId, sessionToken);
              }
            }
          });
        } catch (err) {
          this.props.getOrders(query, pageId, sessionToken, (result, error) => {
            if (result && result.data && result.data.docs) {
              const orders = result.data.docs;
              this.setState({
                orders: orders,
                pagination: result.data.pagination,
                singleDetails: orders[0]
              });
              firebase.initializeApp(result.data.firebaseConfig);
            }
          });
        }
        this.setState({ isLoading: false });
      });
    }
  }

  render() {
    return (
      <div className="content">
        <div className="react-notification-alert-container">
          <NotificationAlert ref="notify" />
        </div>
        <Row>
          <Col lg="7" md="6" sm="12">
            <Card>
              <CardHeader>
                <h4 className="title">Orders - Old - <em>{this.state.pageName}</em></h4>
              </CardHeader>
              <CardBody style={{ height: "600px", overflowY: "auto" }}>
                <Table borderless>
                  <tbody>
                    <tr>
                      <td>
                        <Input
                          id="productStatus"
                          name="productStatus"
                          className="input-lg"
                          type="select"
                          onChange={this.handleFilterChange}
                          onKeyPress={this.handleFilterEnter}
                          value={this.state.selectFilter}
                        >
                          <option value="">All</option>
                          <option value="for_confirmation">
                            For Confirmation
                          </option>
                          <option value="payment_pending">
                            Payment Pending
                          </option>
                          <option value="paid">Paid Order</option>
                          <option value="cancelled">Cancelled Order</option>
                        </Input>
                      </td>
                      <td>
                        <Input
                          id="keyword"
                          name="keyword"
                          type="text"
                          placeholder="Search order..."
                          onChange={this.handleChangeKeyword}
                          onKeyPress={this.handleEnter}
                          value={this.state.keyword}
                        ></Input>
                      </td>
                    </tr>
                  </tbody>
                </Table>
                <Table className="tablesorter" responsive striped>
                  <thead className="text-primary">
                    <tr>
                      <th>CUSTOMER</th>
                      <th>ORDERED ON</th>
                      <th>ORDER ID</th>
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
          <Col className="order-details" lg="5" md="6" sm="12" style={{ height: "800px", overflowY: "auto" }} id="">
            {this.renderDetails(this.state.singleDetails)}
          </Col>
        </Row>
      </div>
    );
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
    getOrders,
    saveNewStatus,
    pickUp,
    cancelAction,
    checkIfMine,
    fetchSingleOrderData
  }
)(Orders);