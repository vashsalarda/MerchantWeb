import React from "react";
import { Link } from "react-router-dom";
import { getSession } from "../../config/session";
import { connect } from "react-redux";
import api from "../../config/api";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import {
  merchantApiLogin,
  addProduct,
} from "../../layouts/Admin/actions/ProductActions";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import { PulseLoader } from "react-spinners";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import XLSX from 'xlsx';

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Nav,
  Row,
  Col
} from "reactstrap";

class ImportProducts extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    super(props);
    this.state = {
      userExist: false,
      payload: "",
      invalidJsonText: "",
      products: [],
      file: {},
      totalItems: 0,
      isLoading: true,
      submitted: false,
      isUploading: false,
      userData: userData,
    };
  }

  componentDidMount() {
    this.setState({ isLoading: false });
  }

  validatePayload = (e) => {
    let { name, value } = e.target;
    try  {
      const arr = (JSON.parse(value));
      if (arr) {
        const products = arr;
        const totalItems = products.length;
        this.setState({
          [name]: value,
          products,
          totalItems,
          invalidJsonText: ""
        });
      }
    } 
    catch (err){
      this.setState({invalidJsonText: "Invalid JSON Payload"});
    }
    
  }

  handleFileSelect = (e) => {
    const file = e.target.files[0];
    this.setState({file:file});
  }

  handleFileUpload = (e) => {
    if (!window.confirm("Do you want to continue uploading the products?")){
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
    if(this.state.file) {
      var fileReader = new FileReader();
      fileReader.onload = function(event) {
        var data = event.target.result;
        var workbook = XLSX.read(data, {
          type: "binary"
        });
        workbook.SheetNames.forEach(sheet => {
          let rowObject = XLSX.utils.sheet_to_row_object_array(
            workbook.Sheets[sheet]
          );
          let jsonObject = JSON.stringify(rowObject);
          const productsArr = JSON.parse(jsonObject)
          const body = {
            products: productsArr
          }
          if(sessionToken && productsArr && productsArr instanceof Array && productsArr.length > 0 ) {
            api(sessionToken).post(`/provider/places/${pageId}/import-products-from-excel`,body)
              .then(resp => {
                if (resp) {
                  alert('Uploading Products. This may take a while. Please wait for few minutes');
                }
              })
              .catch(error => {
                alert(error);
              });
          }
        });
      };
      fileReader.readAsBinaryString(this.state.file);
      this.setState({isUploading:false});
    } else {
      this.setState({isUploading:false});
      this.showNotificationError('No file selected. Please select an excel file.');
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
    const pageInfo = JSON.parse(getSession("pageInfo"));
    if(this.state.isLoading) {
      return (
        <>
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">Import Products from API</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        <Nav vertical >
                          <Link className="nav-link-vertical" to="/import-products">Sync using API <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                          <Link className="nav-link-vertical" to="/import-products-json">Sync using JSON <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          <Link className="nav-link-vertical active-link" to="/import-products-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                        </Nav>
                      </Col>
                      <Col className="pl-md-1" sm="8">
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
                    <h4 className="title">Import Products from Excel file</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        <Nav vertical >
                          { pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb' && <>
                            <Link className="nav-link-vertical" to="/import-products">Sync using API <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                            <Link className="nav-link-vertical" to="/import-products-json">Sync using JSON <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
                          </>}
                          <Link className="nav-link-vertical active-link" to="/import-products-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link> 
                        </Nav>
                      </Col>
                      <Col className="pl-md-1" sm="8">
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
                                <label htmlFor="payload" className="control-label">Select Excel file to upload</label>
                                <p className="text-danger">{this.state.invalidJsonText}</p>
                                <input type="file" id="fileUploader" name="fileUploader" onChange={this.handleFileSelect} accept=".xls, .xlsx" style={{ opacity: 1, position: 'relative' }}/>
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="12" sm="12">
                              <Button className="btn-fill btn-round" color="info" type="button" onClick={this.handleFileUpload}>
                                Upload Products
                              </Button>
                            </Col>
                          </Row>
                        </Form>          
                      </Col>
                    </Row>
                  </CardBody>
                </Card>
              </Col>
            </Row>
            <LoadingOverlay
              active={this.state.isUploading}
              spinner
              text='Uploading Products...'
              >
            </LoadingOverlay>
          </div>
        </>
      );
    }
  }
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps,
  {
    getPageById,
    merchantApiLogin,
    addProduct,
  }
)(ImportProducts);
