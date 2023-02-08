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
import NotificationAlert from "react-notification-alert";
import { PulseLoader } from "react-spinners";
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

class ImportCategories extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    super(props);
    this.state = {
      userExist: false,
      payload: "",
      invalidJsonText: "",
      categories: [],
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

  validatePayload = (e) => {
    let { name, value } = e.target;
    try  {
      const arr = (JSON.parse(value));
      if (arr) {
        const categories = arr;
        const totalItems = categories.length;
        this.setState({
          [name]: value,
          categories,
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
    if (!window.confirm("Do you want to continue uploading the categories?")){
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
            const categoriesArr = JSON.parse(jsonObject)
            const body = {
              categories: categoriesArr
            }
            if(sessionToken && categoriesArr && categoriesArr instanceof Array && categoriesArr.length > 0 ) {
              api(sessionToken).post(`/places/${pageId}/import-categories-from-excel`,body)
                .then(resp => {
                  if (resp.data) {
                    if(resp.data.status === 'ok' && resp.data.message) {
                      alert(resp.data.message);
                    }
                  } else {
                    alert('There is an error uploading the categories. No response from server.');
                  }
                })
                .catch(error => {
                  console.log({error});
                  if(typeof error === 'string') {
                    alert(error);
                  } else {
                    alert('There is an error uploading the categories. Please try again.');
                  }
                });
            }
          });
        };
        fileReader.readAsBinaryString(this.state.file);
        this.setState({isUploading:false});
      } else {
        this.setState({isUploading:false});
        this.showNotificationError('Invalid Excel file. Please select an .xls or .xlsx file only.');
      }
    } else {
      this.setState({isUploading:false});
      this.showNotificationError('No file selected. Please select an excel file.');
    }
  }

  renderVerticalNavBar() {
    const pageInfo = JSON.parse(getSession("pageInfo"));
    return(
      <Nav vertical >
        <Link className="nav-link-vertical active-link" to="/import-categories-excel">Import using Excel <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
        { pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb' &&
          <Link className="nav-link-vertical" to="/sync-product-categories">Sync Product Categories <span style={{float:"right"}}><Fa icon="chevron-right" /></span></Link>
        }
      </Nav>
    );
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
                    <h4 className="title">Import Categories from Excel</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        {this.renderVerticalNavBar()}
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
                    <h4 className="title">Import Categories from Excel file</h4>
                  </CardHeader>
                  <CardBody>
                    <Row>
                      <Col className="pr-md-1" sm="4">
                        {this.renderVerticalNavBar()}
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
                                Upload Categories
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
              text='Uploading categories...'
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
)(ImportCategories);
