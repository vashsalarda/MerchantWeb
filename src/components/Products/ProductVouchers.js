import React from "react";
import { getSession } from "../../config/session";
import { connect } from "react-redux";
import api from "../../config/api";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import NotificationAlert from "react-notification-alert";
import { PulseLoader } from "react-spinners";
import LoadingOverlay from 'react-loading-overlay';
import XLSX from 'xlsx';
import Select from 'react-select'
import { format } from 'date-fns';
import queryString from "query-string";
import QRCode from 'qrcode.react';
import Pagination from "react-js-pagination";
import { getProductsByPageId } from "../../layouts/Admin/actions/ProductActions";

import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Table,
  Col
} from "reactstrap";

class ProductVouchers extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    super(props);
    this.state = {
      userExist: false,
      payload: "",
      invalidJsonText: "",
      vouchers: [],
      file: {},
      totalItems: 0,
      isLoading: true,
      submitted: false,
      isUploading: false,
      userData: userData,
      voucherCodes: [],
      pagination: {},
      activePage: 1,
      size: 50,
      keyword: "",
      filterStatus: "all",
      statusList: [
        {
          value: "all",
          label: "Select status",
        },
        {
          value: "used",
          label: "Used",
        },
        {
          value: "notUsed",
          label: "Not Used",
        }
      ],
      filterProduct: "all",
      productList: []
    };
  }

  componentDidMount() {
    let pageId = JSON.parse(getSession("defaultPage"))
    const userData = JSON.parse(getSession("userData"))
    const { sessionToken } = userData
    this.props.getProductsByPageId(
      pageId,
      {
        size: 100
      },
      sessionToken,
      (error, result) => {
        if (!error && result) {
          let productsArr = [
            {
              value: "all",
              label: "Select product",
            }
          ]
          const { products } = result
          if(products && products.length > 0) {
            products.forEach(item => {
              const product ={
                value: item._id,
                label: item.name,
              }
              productsArr = [...productsArr,product]
            })
          }
          this.setState({
            productList: productsArr
          });
        }
      }
    );

    let url = this.props.location.search;
    let query = queryString.parse(url);
    let activePage = query.page ? Number(query.page) : 1;
    this.setState({
      filterProduct: query.product ? query.product : "all",
      keyword: query.keyword ? query.keyword : "",
      filterStatus: query.status ? query.status : "all",
      activePage: activePage
    });
    if(query.status && query.status === "all") {
      delete query.status;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.refreshProductVouchers(queryStr);
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
      if(notification && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      }
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
      if(notification && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      }
    }
  }

  handleFileSelect = (e) => {
    const file = e.target.files[0];
    this.setState({file:file});
  }

  handleFileUpload = (e) => {
    if (!window.confirm("Do you want to continue uploading the voucher codes?")){
      return false;
    }
    this.setState({isUploading:true});
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    let sessionToken = "";
    if(userData) {
      sessionToken = userData.sessionToken;
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }
    const { file } = this.state;
    if(file && file instanceof File) {
      if(file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel") {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
          const data = event.target.result;
          const workbook = XLSX.read(data, {
            type: "binary"
          });
          workbook.SheetNames.forEach(sheet => {
            let rowObject = XLSX.utils.sheet_to_row_object_array(
              workbook.Sheets[sheet]
            );
            let jsonObject = JSON.stringify(rowObject);
            const vouchersArr = JSON.parse(jsonObject)
            const body = {
              vouchers: vouchersArr
            }
            if(sessionToken && vouchersArr && vouchersArr instanceof Array && vouchersArr.length > 0 ) {
              api(sessionToken).post(`/product-vouchers/${pageId}/import-product-vouchers-from-excel`,body)
                .then(resp => {
                  if (resp.data) {
                    if(resp.statusText === 'OK' && resp.data && resp.data.length > 0) {
                      alert(`You successfully added ${resp.data.length} vouchers codes!`);
                    }
                  } else {
                    alert('There is an error uploading the vouchers. No response from server.');
                  }
                })
                .catch(error => {
                  console.error({error});
                  if(typeof error === 'string') {
                    alert(error);
                  } else {
                    if(error.response && error.response.data && error.response.data.message && typeof error.response.data.message === 'string') {
                      alert(error.response.data.message);
                    } else {
                      alert('There is an error uploading the vouchers. Please try again.');
                    }
                  }
                });
            }
          });
        };
        fileReader.readAsBinaryString(this.state.file);
        this.setState({
          isUploading: false,
          file: {}
        });
        setTimeout(() => {
          const url = this.props.location.search;
          const query = queryString.parse(url);
          const queryStr = "?" + queryString.stringify(query);
          this.refreshProductVouchers(queryStr);
          document.getElementById('fileUploader').value = null
        },1500)
      } else {
        this.setState({
          isUploading:false,
          file:{}
        });
        setTimeout(() => {
          document.getElementById('fileUploader').value = null
        },2000)
        this.showNotificationError('Invalid Excel file. Please select an .xls or .xlsx file only.');
      }
    } else {
      this.setState({isUploading:false});
      this.showNotificationError('No file selected. Please select an excel file.');
    }
  }

  handlePageChange = (pageNumber) => {
    this.setState({ isLoading: true });
    const defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    if(query.status && query.status === "all") {
      delete query.status;
    }
    query.page = pageNumber;
    query.place = defaultPage;
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ activePage: pageNumber });
    this.refreshProductVouchers(queryStr);
  }

  handleChangePerPage = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;
    const defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    if(query.status && query.status === "all") {
      delete query.status;
    }
    query.place = defaultPage;
    if (value !== "") {
      query.size = value;
    } else {
      delete query.size;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ size: value });
    this.refreshProductVouchers(queryStr);
  }

  handleChangeStatus = (e) => {
    if(e && e.value && e.value.length) {
      const { value } = e
      this.setState({filterStatus: value})
      const url = this.props.location.search
      const query = queryString.parse(url);
      query.status = value
      const queryStr = "?" + queryString.stringify(query)
      this.refreshProductVouchers(queryStr);
    }
  }

  handleSelectProduct = (e) => {
    if(e && e.value && e.value.length) {
      const { value } = e
      this.setState({filterProduct: value})
      const url = this.props.location.search
      const query = queryString.parse(url);
      query.product = value
      const queryStr = "?" + queryString.stringify(query)
      this.refreshProductVouchers(queryStr);
    }
  }
  
  handleChangeKeyword = (e) => {
    const value = e.target && e.target.value ? e.target.value : ""
    this.setState({keyword: value})
  }

  handleEnter = (e) => {
    let { key } = e;
    if (key === 'Enter') {
      this.setState({ isLoading:true, activePage:1 });
      let { keyword } = this.state;
      let url = this.props.location.search;
      let query = queryString.parse(url);
      delete query.page;
      if(query.status && query.status === "all") {
        delete query.status;
      }
      if (keyword !== "") {
        query.keyword = keyword.trim();
      } else {
        delete query.keyword;
      }
      let queryStr = "?" + queryString.stringify(query);
      this.refreshProductVouchers(queryStr);
    }
  }

  refreshProductVouchers(queryStr) {
    const query = queryString.parse(queryStr);
    const message = query.message
    if(message) {
      delete query.message;
      this.showNotification(message);
    }
    
    this.props.history.push("/product-vouchers" + queryStr);
    const userData = JSON.parse(getSession("userData"));
    const placeId = JSON.parse(getSession("defaultPage"));
    const { sessionToken } = userData;

    if (userData !== null) {
      if(sessionToken && placeId) {
        query.place = placeId
        api(sessionToken).get(`/product-vouchers`,{ params:query})
          .then(resp => {
            if(resp && resp.data) {
              const vouchers = resp.data.docs
              const pagination = {
                total: resp.data.total,
                limit: resp.data.limit,
                offset: resp.data.page
              }
              this.setState({
                voucherCodes: vouchers,
                pagination: pagination
              }, function(){
                this.setState({isLoading:false})
              });
            }
          })
          .catch(error => {
            console.error({error});
          });
      }
    }
  } 

  render() {
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
                    <h3 className="title">Voucher Codes</h3>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="12">
                        <PulseLoader
                          sizeUnit={"px"}
                          size={15}
                          color={'#1d8cf8'}
                          loading={this.state.isLoading}
                        />
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      );
    } else {
      const { voucherCodes, pagination, activePage } = this.state
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
                    <h3 className="title">Voucher Codes</h3>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="12">
                        <Form>  
                          <Row>
                            <Col md="12" sm="12">
                              <FormGroup
                                className={
                                  this.state.submitted &&
                                  !this.state.payload
                                    ? " has-danger"
                                    : ""
                                }
                              >
                                <label htmlFor="payload" className="control-label">Upload Voucher Codes. Select Excel file to upload</label>
                                <p className="text-danger">{this.state.invalidJsonText}</p>
                                <input type="file" id="fileUploader" name="fileUploader" onChange={this.handleFileSelect} accept=".xls, .xlsx" style={{width:'auto', opacity:1, position:'relative'}}/>
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="12" sm="12">
                              <Button className="btn-fill btn-round btn-sm" color="info" type="button" onClick={this.handleFileUpload}>
                                Upload Vouchers
                              </Button>
                              <a rel="noopener noreferrer" target="_blank" className="btn btn-fill btn-round btn-info btn-sm" href="https://drive.google.com/file/d/1dPZzfp5oPROcV8M_UK5iSj3zSAbaAVb0/view?usp=sharing">Download Template</a> 
                            </Col>
                          </Row>
                        </Form>          
                      </Col>
                    </Row>
                    <Row>
                      <Col className="pr-md-1" sm="12">
                        <h4>List of Voucher Codes</h4>
                        <Row>
                          <Col md="4">
                            <FormGroup>
                              <Input
                                id="keyword"
                                name="keyword"
                                type="text"
                                placeholder="Search..."
                                onChange={this.handleChangeKeyword}
                                onKeyPress={this.handleEnter}
                                value={this.state.keyword}
                              >
                              </Input>
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Select
                                className="react-select"
                                styles={{fontSize:'13px !important'}}
                                options={this.state.statusList}
                                onChange={this.handleChangeStatus}
                                placeholder="Select status"
                                value={this.state.statusList.filter(item => item.value === this.state.filterStatus)}
                              />
                            </FormGroup>
                          </Col>
                          <Col md="4">
                            <FormGroup>
                              <Select
                                className="react-select"
                                styles={{fontSize:'13px !important'}}
                                options={this.state.productList}
                                onChange={this.handleSelectProduct}
                                placeholder="Select product"
                                value={this.state.productList.filter(item => item.value === this.state.filterProduct)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                        {voucherCodes && voucherCodes.length > 0 ?
                          (
                            <Table className="product-vouchers table-striped responsive" responsive>
                              <thead>
                                <tr>
                                  <th>&nbsp;</th>
                                  <th colSpan="2">Code</th>
                                  <th>Product</th>
                                  <th>Used</th>
                                  <th>From</th>
                                  <th>Order No.</th>
                                  <th>Customer</th>
                                  <th>Added</th>
                                </tr>
                              </thead>
                              <tbody>
                                {voucherCodes.map((item,index) =>
                                  <tr key={item._id}>
                                    <td>{index+1}.</td>
                                    <td>
                                      <QRCode 
                                        size={50}
                                        value={item.code} 
                                      />
                                    </td>
                                    <td>
                                      <strong style={{ fontFamily:'monospace'}}>{item.code}</strong>
                                    </td>
                                    <td>{item.product.name}</td>
                                    <td>
                                      {item.isUsed ? 
                                        <Badge color="secondary">YES</Badge> :
                                        <Badge color="success">NO</Badge> }<br />
                                      <em style={{ fontSize:'85%'}}>{item.dateUsed && item.dateUsed.length > 0 ? format(new Date(item.dateUsed),"yyyy-MM-dd hh:mm a") : ""}</em>
                                    </td>
                                    <td>
                                      {item.claimedFrom && item.claimedFrom.length && item.claimedFrom.toUpperCase()}
                                    </td>
                                    <td>
                                      <strong style={{ fontFamily:'monospace'}}>{item.order && item.order.length > 0 ? lastSixDigits(item.order) : ""}</strong>
                                    </td>
                                    <td>
                                      {item.customer && item.customer.firstName &&
                                        `${item.customer.firstName} ` }
                                      {item.customer && item.customer.lastName &&
                                        item.customer.lastName}<br />
                                      {item.customer && item.customer.email &&
                                        <em style={{ fontSize:'85%'}}>({item.customer.email})</em>}
                                    </td>
                                    <td>{format(new Date(item.createdAt),"MMM dd, yyyy hh:mm a")}</td>
                                  </tr>
                                )}
                              </tbody>
                            </Table>
                          )
                          :
                          (<p><em className="text-danger">No vouchers added.</em></p>)
                        }
                      </Col>
                    </Row>
                  </CardBody>
                  <CardFooter>
                    <Row>
                      <Col md="12">
                        <Row className="pull-right">
                          <Col md="4" lg="4">
                            <FormGroup>
                              {this.state.pagination && this.state.pagination.total > 0 &&
                                <Input
                                  style={{marginBottom:'5px'}}
                                  id="perPage"
                                  name="perPage"
                                  type="select"
                                  onChange={this.handleChangePerPage}
                                  value={this.state.size}
                                >
                                  <option value="10">10 / page</option>
                                  <option value="25">25 / page</option>
                                  <option value="50">50 / page</option>
                                  <option value="100">100 / page</option>
                                </Input>
                              }
                            </FormGroup>
                          </Col>
                          <Col md="8" lg="8">
                            {pagination && pagination.total > 0 &&
                              <>
                                <Pagination
                                  innerClass="pagination"
                                  activePage={activePage}
                                  itemsCountPerPage={pagination.limit}
                                  totalItemsCount={pagination.total}
                                  pageRangeDisplayed={3}
                                  onChange={this.handlePageChange}
                                />
                                <p>Page <em>{activePage}</em> of <em>{Math.ceil(pagination.total/pagination.limit)}</em> of <em>{numberWithCommasOnly(pagination.total)}</em> vouchers.</p>
                              </>
                            }
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </CardFooter>
                </Card>
              </Col>
            </Row>
            <LoadingOverlay
              active={this.state.isUploading}
              spinner
              text='Uploading vouchers...'
              >
            </LoadingOverlay>
          </div>
        </>
      );
    }
  }
}

const numberWithCommasOnly = x => {
  return priceRound(x,0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

export default connect(mapStateToProps,
  {
    getPageById,
    getProductsByPageId
  }
)(ProductVouchers);