import React from "react";
import { getSession } from "../../config/session";
import { connect } from "react-redux";
import { getPageById } from "../../layouts/Admin/actions/PageActions";
import {
  merchantApiLogin,
  importProductsFromApi,
  syncProductsFromAPI,
  addProduct,
  uploadPhotoByProductName,
} from "../../layouts/Admin/actions/ProductActions";
import { PulseLoader } from "react-spinners";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';

import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  FormGroup,
  Form,
  Input,
  Row,
  Col
} from "reactstrap";

class UploadProductImages extends React.Component {
  constructor(props) {
    const userData = JSON.parse(getSession("userData"));
    super(props);
    this.state = {
      userExist: false,
      loginUrl: "",
      apiUsername: "",
      apiPassword: "",
      productsUrl: "",
      apiKey: "",
      payload: "",
      isLoading: true,
      submitted: false,
      isUploading: false,
      userData: userData,
      totalImages: 0,
      files: null,
      images: [],
    };
    
    this.handleFileSelect = this.handleFileSelect.bind(this);
    this.handleFileUpload = this.handleFileUpload.bind(this);
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    const pageId = JSON.parse(getSession("defaultPage"));
    const sessionToken = userData.sessionToken;
  
    if (userData != null && pageId) {
      this.props.getPageById(pageId, sessionToken, (error, result) => {
        if (result) {
          const pageObj = result.page;
          setTimeout(() => {
            this.setState({
              pageExists: true,
              loginUrl: (pageObj.privateApiInfo && pageObj.privateApiInfo.loginUrl) ? pageObj.privateApiInfo.loginUrl : "",
              apiUsername: (pageObj.privateApiInfo && pageObj.privateApiInfo.username) ? pageObj.privateApiInfo.username : "",
              apiPassword: (pageObj.privateApiInfo && pageObj.privateApiInfo.password) ? pageObj.privateApiInfo.password : "",
              productsUrl: (pageObj.privateApiInfo && pageObj.privateApiInfo.productsUrl) ? pageObj.privateApiInfo.productsUrl : "",
              apiKey: (pageObj.privateApiInfo && pageObj.privateApiInfo.apiKey) ? pageObj.privateApiInfo.apiKey : "",
              isLoading: false
            });
          }, 2000);
          
        } else {
          if(error) {
            setTimeout(() => {
              this.setState({ isLoading: false });
            }, 2000);
          }
        }
      });
    } else {
      setTimeout(() => {
        this.setState({ isLoading: false });
      }, 2000);
    }
  }

  handleFileSelect = (e) => {
    const files = e.target.files;
    const filesArr = Array.from(files);
    this.setState({files:files,totalImages:filesArr.length});
  }

  handleFileUpload = (e) => {
    if (!window.confirm("Do you want to continue uploading?")){
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
    let files;
    let images = [];
    if(this.state.files) {
      files = this.state.files;
      images = this.state.images;
      const filesArr = Array.from(files);
      let itemsProcessed = 0;
      
      filesArr.forEach(file => {
        const productName = file.name.split('.').slice(0, -1).join('.');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('place', pageId);
        this.props.uploadPhotoByProductName(productName, formData, sessionToken, (error, result) => {
          if (!error && result) {
            const photo = result;
            if(photo._id) {
              images.push(photo);
              this.setState({images: images});
            }
          } else {
            if (error) {
              console.error(error.response);
            }
          }
          itemsProcessed++;
          if(itemsProcessed === filesArr.length) {
            this.setState({files:null});
            this.setState({images:[]});
            this.setState({isUploading:false});
            this.setState({totalImages:0});
            this.showNotification('Image upload complete.');
          }
        });
      });
    } else {
      this.setState({isUploading:false});
      this.showNotificationError('No image(s) added. Please select and image.');
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
    const divStyle = {
      position: 'relative',
      height: 200,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: '#666',
      borderStyle: 'solid',
      borderRadius: 5
    };

    if(this.state.isLoading) {
      return (
        <>
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">Products Images - Bulk Upload</h4>
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
      if(this.state.pageExists) {
        return (
          <>
            <div className="content">
              <div className="react-notification-alert-container">
                <NotificationAlert ref="notify" />
              </div>
              <Row>
                <Col lg="12">
                  <Card>
                    <CardHeader>
                      <h4 className="title">Products Images - Bulk Upload</h4>
                    </CardHeader>
                    <CardBody>
                      <Form>
                        <Row>
                          <Col md="12" lg="8">
                          <FormGroup>
                            <label htmlFor="images">Select image(s)</label>
                            <div style={{ margin: '10px auto', border: '1px solid #ccc', 'backgroundColor': '#efefef' }}>
                              <Input name="images" label='upload file' type='file' onChange={this.handleFileSelect} style={divStyle} multiple />
                            </div>
                            <label>{this.state.totalImages} image(s) selected</label>
                          </FormGroup>
                        </Col>
                        </Row>
                      </Form>
                    </CardBody>
                    <CardFooter>
                      <Button className="btn-fill" color="info" type="button" onClick={this.handleFileUpload}>
                        Upload Photos
                      </Button>
                    </CardFooter>
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
      } else {
        return(
          <div className="content">
            <Row>
              <Col sm="12" md="12" lg="12">
                <Card>
                  <CardHeader>
                    <h4 className="title">No Page Added</h4>
                  </CardHeader>
                  <CardBody>
                    <p>You have not added a page yet. Please signup as a Provider/Merchant</p>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          </div>
        );
      }
    }
  }
}

const mapStateToProps = () => ({});

export default connect(mapStateToProps,
  {
    getPageById,
    merchantApiLogin,
    importProductsFromApi,
    syncProductsFromAPI,
    addProduct,
    uploadPhotoByProductName,
  }
)(UploadProductImages);