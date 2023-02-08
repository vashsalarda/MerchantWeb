import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import { getSession, setSession } from "../../config/session";
import api from "../../config/api";
import {
  getProductsByPageId,
  getProductsGroceryByPageId,
  getProductsByProviderId,
  updateProduct,
  deleteProduct
} from "../../layouts/Admin/actions/ProductActions";
import { getProductCategoriesAll, getProductCategoriesAllV2 } from "../../layouts/Admin/actions/ProductCategoryActions";
import { getProviderPlaces } from "../../layouts/User/UserActions";
import queryString from "query-string";
import Switch from "react-toggle-switch";
import { FontAwesomeIcon as Fa } from "@fortawesome/react-fontawesome";
import Pagination from "react-js-pagination";
import { PulseLoader } from "react-spinners";
import NotificationAlert from "react-notification-alert";
import LoadingOverlay from 'react-loading-overlay';
import Select from 'react-select'
import { format } from 'date-fns'

import defaultProductImage from "assets/img/product-image-default.png";

import {
  Alert,
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Table,
  Row,
  Col,
  Media,
  FormGroup,
  Input,
} from "reactstrap";

class Products extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      products: [],
      places: [],
      productTypes: [],
      productCategoriesAll: [],
      productCategories: [],
      productCategoriesSub: [],
      checked: [],
      defaultPage: "",
      pagination: {},
      activePage: 1,
      selectedPage: "",
      selectedAvailability: "",
      selectedProductCategory: "",
      selectedProductCategorySub: "",
      pageName: "",
      sortBy: "",
      sort: "",
      status: "",
      keyword: "",
      size: 25,
      isLoading: true,
      isProcessing: false,
      isGeneratingXls: false,
      isGrocery: false,
      hideTutorials: false
    };
  }

  componentDidMount() {
    const userData = JSON.parse(getSession("userData"));
    let pageInfo = JSON.parse(getSession("pageInfo"));
    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') {
      this.setState({isGrocery:true});
    }

    if (userData !== null) {
      let defaultPage = JSON.parse(getSession("defaultPage"));
      const sessionToken = userData.sessionToken;
    
      if (defaultPage) {
        if (defaultPage !== "") {
          let url = this.props.location.search;
          let query = queryString.parse(url);
          let activePage = query.page ? Number(query.page) : 1;
          let status = query.status ? query.status : "";
          let sortBy = query.sortBy ? query.sortBy : "created";
          let sort = query.sort ? query.sort : "desc";
          let keyword = query.keyword ? query.keyword : "";
          let size = query.size ? query.size : 25;
          let category = query.category ? query.category : "";
          let subCategory = "";
          if(query.category) {
            subCategory = query.subCategory ? query.subCategory : "";
          } else {
            delete query.subCategory;
          }
          let queryStr = "?" + queryString.stringify(query);
          this.setState({
            activePage: activePage,
            selectedPage: defaultPage,
            status: status,
            sort: sort,
            sortBy: sortBy,
            keyword: keyword,
            size: size,
            selectedProductCategory: category,
            selectedProductCategorySub: subCategory,
            pageName: pageInfo && pageInfo.name ? pageInfo.name : '',
            hideTutorials: (pageInfo && pageInfo.hideTutorials && pageInfo.hideTutorials === true) ? true : false
          });
          if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') {
            this.setState({isGrocery:true});
          }
          this.refreshProductList(queryStr, defaultPage);
          this.getCategories(pageInfo, defaultPage, sessionToken);
        } else {
          this.props.getProviderPlaces(sessionToken, (error, result) => {
            if (!error && result) {
              if(result.places && result.places instanceof Array && result.places.length > 0 ) {
                const defaultPlace = result.places.find(item => item.isDefault);
                if(defaultPlace && defaultPlace._id) {
                  defaultPage = defaultPlace._id;
                  pageInfo = defaultPlace;
                } else {
                  defaultPage = result.places[0]._id;
                  pageInfo = result.places[0];
                }
              }
              setSession('pageInfo',JSON.stringify(pageInfo));
              let url = this.props.location.search;
              let query = queryString.parse(url);
              let activePage = query.page ? Number(query.page) : 1;
              let status = query.status ? query.status : "";
              let sortBy = query.sortBy ? query.sortBy : "created";
              let sort = query.sort ? query.sort : "desc";
              let keyword = query.keyword ? query.keyword : "";
              let size = query.size ? query.size : 25;
              let category = query.category ? query.category : "";
              let subCategory = "";
              if(query.category) {
                subCategory = query.subCategory ? query.subCategory : "";
              } else {
                delete query.subCategory;
              }
              let queryStr = "?" + queryString.stringify(query);
              this.setState({
                activePage: activePage,
                selectedPage: defaultPage,
                status: status,
                sort: sort,
                sortBy: sortBy,
                keyword: keyword,
                size: size,
                selectedProductCategory: category,
                selectedProductCategorySub: subCategory,
                pageName: pageInfo && pageInfo.name ? pageInfo.name : ''
              });
              if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') {
                this.setState({isGrocery:true});
              }
              this.refreshProductList(queryStr, defaultPage);
              this.getCategories(pageInfo, defaultPage, sessionToken);
            } else {
              this.setState({ isLoading: false });
            }
          });
        }
      } else {
        this.props.getProviderPlaces(sessionToken, (error, result) => {
          if (!error && result) {
            if(result.places && result.places instanceof Array && result.places.length > 0 ) {
              const defaultPlace = result.places.find(item => item.isDefault);
              if(defaultPlace && defaultPlace._id) {
                defaultPage = defaultPlace._id;
                pageInfo = defaultPlace;
              } else {
                defaultPage = result.places[0]._id;
                pageInfo = result.places[0];
              }
              setSession('pageInfo',JSON.stringify(pageInfo));
              let url = this.props.location.search;
              let query = queryString.parse(url);
              let activePage = query.page ? Number(query.page) : 1;
              let status = query.status ? query.status : "";
              let sortBy = query.sortBy ? query.sortBy : "created";
              let sort = query.sort ? query.sort : "desc";
              let keyword = query.keyword ? query.keyword : "";
              let size = query.size ? query.size : 25;
              let category = query.category ? query.category : "";
              let subCategory = "";
              if(query.category) {
                subCategory = query.subCategory ? query.subCategory : "";
              } else {
                delete query.subCategory;
              }
              let queryStr = "?" + queryString.stringify(query);
              this.setState({
                activePage: activePage,
                selectedPage: defaultPage,
                status: status,
                sort: sort,
                sortBy: sortBy,
                keyword: keyword,
                size: size,
                selectedProductCategory: category,
                selectedProductCategorySub: subCategory,
                pageName: pageInfo.name
              });
              if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') {
                this.setState({isGrocery:true});
              }
              this.refreshProductList(queryStr, defaultPage);
              this.getCategories(pageInfo, defaultPage, sessionToken);
            } else {
              this.setState({ isLoading: false });
            }
          } else {
            this.setState({ isLoading: false });
          }
        });
      }
    } else {
      this.props.history.push("/login");
      window.location.reload();
    }
    this._isMount = true;
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  renderRows(products) {
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let colSpan = 12;
    if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') {
      colSpan = 13;
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
        products instanceof Array &&
        products.length > 0
      ) {
        return products.map((item, index, productsArr) => (
          <tr key={index}>
            <td>
              <Input
                style={{position: 'inherit', margin: '0'}}
                className="form-control"
                type="checkbox"
                name="product"
                value={item._id}
                onClick={this.handleCheck}
              />
            </td>
            <td width="50">{this.renderImage(item)}</td>
            <td width="500">
              <Link 
                to={ "/products/" + item._id + "/edit" +
                  ((this.state.activePage > 0 ||
                    this.state.keyword !== '' ||
                    this.state.status !== '' ||
                    this.state.keyword !== '' ||
                    this.state.selectedAvailability !== '' ||
                    this.state.selectedProductCategory !== '' ||
                    this.state.selectedProductCategorySub !== '')
                    ? '?' : '') +
                    (this.state.activePage > 0 ? '&page=' + this.state.activePage : '') +
                    (this.state.keyword !== '' ? '&keyword=' + this.state.keyword : '') +
                    (this.state.status !== ''  ? '&status=' + this.state.status : '') +
                    (this.state.selectedAvailability !== '' ? '&availability=' + this.state.selectedAvailability : '') +
                    (this.state.selectedProductCategory !== '' ? '&category=' + this.state.selectedProductCategory : '') +
                    (this.state.selectedProductCategorySub !== '' ? '&subCategory=' + this.state.selectedProductCategorySub : '')
                  }
                alt={item.name}
                title={item.name}
              >
                {item.name}
              </Link>
            </td>
            <td width="150">{format(new Date(item.createdAt),'MMM/dd/yyyy hh:mm a')}</td>
            <td width="150">{format(new Date(item.updatedAt),'MMM/dd/yyyy hh:mm a')}</td>
            <td width="150">{item.itemCode}</td>
            <td width="150">{item.barcode}</td>
            { pageInfo && pageInfo.useCreatedProductCategory 
              ? <td width="150">{this.renderCategories(item.productCategories)}</td>
              : <td width="150">{this.renderCategories(item.categories)}</td>
            }
            <td align="right">&#8369;{item.price ? numberWithCommas(item.price) : "0.00"}</td>
            <td align="center">
              <Link to={ "/products/" + item._id + "/edit" +
                ((this.state.activePage > 0 ||
                  this.state.keyword !== '' ||
                  this.state.status !== '' ||
                  this.state.keyword !== '' ||
                  this.state.selectedAvailability !== '' ||
                  this.state.selectedProductCategory !== '' ||
                  this.state.selectedProductCategorySub !== '')
                  ? '?' : '') +
                (this.state.activePage > 0 ? '&page=' + this.state.activePage : '') +
                (this.state.keyword !== '' ? '&keyword=' + this.state.keyword : '') +
                (this.state.status !== ''  ? '&status=' + this.state.status : '') +
                (this.state.selectedAvailability !== '' ? '&availability=' + this.state.selectedAvailability : '') +
                (this.state.selectedProductCategory !== '' ? '&category=' + this.state.selectedProductCategory : '') +
                (this.state.selectedProductCategorySub !== '' ? '&subCategory=' + this.state.selectedProductCategorySub : '')
              }>
                <Fa icon="edit" />
              </Link>
              <Link to="#" className="text-danger" onClick={this.handleDelete} data-item={item._id}>
                <Fa icon="trash-alt"/>
              </Link>
              <Link to="#" data-id={item._id} onClick={this.copyToClipboard} style={{cursor:"pointer"}} alt="Copy Product ID" title="Copy Product ID">
                <Fa icon="copy" />
              </Link>
            </td>
            <td>
              <Switch
                onClick={() => {
                  const nextStatus = !item.forSale;
                  this.toggleSwitchForSale(item);
                  productsArr[index].forSale = nextStatus;
                  this.setState({
                    products: productsArr
                  });
                }}
                on={item.forSale}
              />
            </td>
            <td>
              <Switch
                onClick={() => {
                  const nextStatus = !item.isActive;
                  this.toggleSwitchIsActive(item);
                  productsArr[index].isActive = nextStatus;
                  this.setState({
                    products: productsArr
                  });
                }}
                on={item.isActive}
              />
            </td>
            { pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb' &&
              <td>
                <Switch
                  onClick={() => {
                    const nextStatus = !item.isLocked;
                    this.toggleSwitchIsLocked(item);
                    productsArr[index].isLocked = nextStatus;
                    this.setState({
                      products: productsArr
                    });
                  }}
                  on={item.isLocked ? item.isLocked : false}
                />
              </td>
            }
          </tr>
        ));
      } else {
        return (
          <tr>
            <td colSpan={colSpan}>
              <h5 className="text-danger">
                <em>No products found.</em>
              </h5>
            </td>
          </tr>
        );
      }
    }
  }

  renderCategories(categories) {
    if(categories instanceof Array && categories.length > 0) {
      if(categories.length === 1) {
        return categories.map(cat => cat.name);
      } else {
        return categories.map(cat => cat.name + ", ");
      }
    }
  }

  renderImage(item) {
    const {
      name,
      photos,
    } = item;

    let primaryPhoto;
    if (photos[0] !== undefined || photos[0] != null) {
      primaryPhoto = photos[0];
    } else {
      primaryPhoto = {
        thumb: defaultProductImage,
      }
    }
    return (
      <Media className="mt-1">
        { primaryPhoto && primaryPhoto.thumb &&
          <Media left middle>
            <Media
              object
              data-src={primaryPhoto.thumb}
              src={primaryPhoto.thumb}
              alt={name}
              title={name}
            />
          </Media>
        }
      </Media>
    );
  }

  renderPlaces() {
    if (this.state.places !== undefined || this.state.places != null) {
      return this.state.places.map((item, index) => (
        <option key={index} value={item._id.toString()}>
          {item.name}
        </option>
      ));
    }
  }

  toggleSwitchIsActive(product) {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const productId = product._id;
    if (product) {
      this.props.updateProduct(
        product,
        productId,
        sessionToken,
        (error, result) => {
          if (result) {
            this.showNotification('Product successfully updated.');
          } else {
            if (error) {
              this.showNotificationError(error.response);
            } else {
              this.showNotificationError('Product not updated.');
            }
          }
        }
      );
    }
  }

  toggleSwitchIsLocked(product) {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const productId = product._id;
    if (product) {
      this.props.updateProduct(
        product,
        productId,
        sessionToken,
        (error, result) => {
          if (result) {
            this.showNotification('Product successfully updated.');
          } else {
            if (error) {
              this.showNotificationError(error.response);
            }
          }
        }
      );
    }
  }

  toggleSwitchForSale(product) {
    const userData = JSON.parse(getSession("userData"));
    const sessionToken = userData.sessionToken;
    const productId = product._id;
    if (product) {
      this.props.updateProduct(
        product,
        productId,
        sessionToken,
        (error, result) => {
          if (result) {
            this.showNotification('Product successfully updated.');
          } else {
            if (error) {
              this.showNotificationError(error.response);
            }
          }
        }
      );
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
    if(message && typeof message === 'string') {
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
        autoDismiss: 2
      }
      if(notification && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      }
    }
  }

  showNotificationError(message) {
    if(message && typeof message === 'string') {
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
        autoDismiss: 2
      }
      if(notification && this.refs.notify && this.refs.notify.notificationAlert) {
        this.refs.notify.notificationAlert(notification);
      }
    }
  }

  handleChangeKeyword = (e) => {
    let { value } = e.target;
    this.setState({keyword: value});
  }

  handleEnter = (e) => {
    let { key } = e;
    if (key === 'Enter') {
      this.setState({ isLoading:true, activePage:1 });
      let { keyword } = this.state;

      let defaultPage = JSON.parse(getSession("defaultPage"));
      let url = this.props.location.search;
      let query = queryString.parse(url);
      delete query.message;
      delete query.page;
      if (keyword !== "") {
        query.keyword = keyword.trim();
      } else {
        delete query.keyword;
      }
      let queryStr = "?" + queryString.stringify(query);
      this.refreshProductList(queryStr, defaultPage);
    }
  }

  handleDelete = (e) => {
    if (!window.confirm("Do you want to delete this product?")){
      return false;
    }
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    const message = "Product has been deleted successfully.";
    let queryStr = "?" + queryString.stringify(query);
    const productId = e.currentTarget.dataset.item;
    if(productId) {
      const userData = JSON.parse(getSession("userData"));
      if(userData) {
        const sessionToken = userData.sessionToken;
        this.props.deleteProduct(
          productId,
          sessionToken,
          (error, result) => {
            if (!error && result) {
              if(result.status==="Deleted") {
                this.showNotification(message);
                this.refreshProductList(queryStr, defaultPage);
              }
            } else {
              if (error) {
                if(error.response && error.response.status && error.response.status === 403) {
                  setTimeout(() => { 
                    this.setState({isLoading:true});
                    let defaultPage = JSON.parse(getSession("defaultPage"));
                    let url = this.props.location.search;
                    let query = queryString.parse(url);
                    delete query.message;
                    delete query.page;
                    let queryStr = "?" + queryString.stringify(query);
                    this.setState({ activePage: 1 });
                    this.refreshProductList(queryStr, defaultPage);
                  }, 1000);
                  this.showNotificationError('You are not allowed to delete this product.');
                } else {
                  this.showNotificationError(error.response);
                }
              }
            }
          }
        );
      } else {
        this.props.history.push("/login");
        window.location.reload();
      }
    }
  }

  handleChangeAvailability = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;

    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    delete query.page;
    if (value !== "") {
      query.availability = value;
    } else {
      delete query.availability;
    }
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ selectedAvailability: value, activePage: 1 });
    this.refreshProductList(queryStr, defaultPage);
  }

  handleChangeProductCategory = (e) => {
    this.setState({isLoading:true});
    let value = "";
    const productCategoriesAll = this.state.productCategoriesAll;
    let productCategoriesSub = [];
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    delete query.page;
    delete query.subCategory;
    if (e && e.value) {
      value = e.value;
      productCategoriesSub = productCategoriesAll.filter(item => item.parent && item.parent.id.toString() === value);
      query.category = value;
    } else {
      delete query.category;
      this.setState({ selectedProductCategorySub: "" });
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ selectedProductCategory: value, productCategoriesSub: productCategoriesSub, activePage: 1 });
    this.refreshProductList(queryStr, defaultPage);
  }

  handleChangeProductCategorySub = (e) => {
    this.setState({isLoading:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    delete query.page;
    let value = "";
    if (e && e.value) {
      value = e.value;
      query.subCategory = value;
    } else {
      delete query.subCategory;
    }
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ selectedProductCategorySub: value , activePage: 1});
    this.refreshProductList(queryStr, defaultPage);
  }

  handleChangeProductStatus = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;

    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    delete query.page;
    if (value !== "") {
      query.status = value;
    } else {
      delete query.status;
    }
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ status: value, activePage: 1 });
    this.refreshProductList(queryStr, defaultPage);
  }

  handlePageChange = (pageNumber) => {
    this.setState({isLoading:true});
    let defaultPage = JSON.parse(getSession("defaultPage"));

    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.page = pageNumber;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ activePage: pageNumber });
    this.refreshProductList(queryStr, defaultPage);
  }

  handleChangePerPage = (e) => {
    this.setState({isLoading:true});
    let { value } = e.target;

    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    delete query.page;
    if (value !== "") {
      query.size = value;
    } else {
      delete query.size;
    }
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ size: value, activePage: 1 });
    this.refreshProductList(queryStr, defaultPage);
  }

  handleCheckAll = (e) => {
    let { checked: isChecked } = e.target;
    const checkboxes = document.querySelectorAll('input[name="product"]');
    const checkboxesArr = Array.from(checkboxes);
    if(isChecked) {
      const checked = checkboxesArr.map(item => item.value );
      this.setState({checked:checked});
    } else {
      this.setState({checked:[]});
    }
    checkboxes.forEach(checkbox => {
      if (isChecked) {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }
    });
  }

  handleCheck = (e) => {
    let { value, checked: isChecked } = e.target;
    if(isChecked) {
      this.setState({checked: [...this.state.checked, value]});
    } else {
      const checked = this.state.checked.filter((item) => value !== item);
      this.setState({checked:checked});
    }
  }

  handleDeleteChecked = () => {
    let items = 0;
    let deletedItems = 0;
    let hasError = false;
    const checked = this.state.checked;
    if(checked instanceof Array && checked.length > 0) {
      if (!window.confirm("Are you sure you want to delete this product(s)?")){
        return false;
      }
      this.setState({isProcessing:true});
      let defaultPage = JSON.parse(getSession("defaultPage"));
      let url = this.props.location.search;
      let query = queryString.parse(url);
      if(query.message) {
        delete query.message;
      }
      checked.forEach((productId, index, array) => {
        const userData = JSON.parse(getSession("userData"));
        const sessionToken = userData.sessionToken;
        this.props.deleteProduct(
          productId,
          sessionToken,
          (error, result) => {
            if(result.status==="Deleted") {
              deletedItems++;
            } else {
              if (error) {
                hasError = true;
              }
            }
            items++;
            if(items === array.length) {
              this.setState({isProcessing:false});
              const checkAll = document.getElementById('check-all');
              checkAll.checked = false;
              const checkboxes = document.querySelectorAll('input[name="product"]');
              checkboxes.forEach(checkbox => {
                checkbox.checked = false;
              });
              if(deletedItems > 0) {
                const message = "Products has been deleted successfully.";
                this.showNotification(message);
                let queryStr = "?" + queryString.stringify(query);
                this.refreshProductList(queryStr, defaultPage);
              } else {
                if(hasError) {
                  this.showNotificationError('There is a error in deleting the product(s)!');
                }
              }
            }
          }
        );
      });
    } else {
      this.showNotificationError('Please select a product!');
    }
  }

  handlePublishChecked = () => {
    const checked = this.state.checked;
    let items = 0;
    let updatedItems = 0;
    let hasError = false;
    if(checked instanceof Array && checked.length > 0) {
      if (!window.confirm("Are you sure you want to publish this product(s)?")){
        return false;
      }
      this.setState({isProcessing:true});
      checked.forEach((productId, index, array) => {
        const userData = JSON.parse(getSession("userData"));
        const sessionToken = userData.sessionToken;
        let product = this.state.products.find(item => item._id === productId );
        product.isActive = true;
        this.props.updateProduct(
          product,
          productId,
          sessionToken,
          (error, result) => {
            if (result) {
              this.setState(prevState => {
                const list = prevState.products.map((item) => checkedItems(item,prevState.products));
                return {
                  list,
                };
              });
              updatedItems++;
            } else {
              if (error) {
                hasError = true;
              }
            }
            items++;
            if(items === array.length) {
              this.setState({isProcessing:false});
              if(updatedItems > 0) {
                this.showNotification('Products has been published!');
              }
              if(hasError) {
                this.showNotificationError('There is a error in updating the product(s)!');
              }
            }
          }
        );
      });
    } else {
      this.showNotificationError('Please select a product!');
      return false;
    }
  }

  handleUnpublishChecked = () => {
    const checked = this.state.checked;
    let items = 0;
    let updatedItems = 0;
    let hasError = false;
    if(checked instanceof Array && checked.length > 0) {
      if (!window.confirm("Are you sure you want to unpublish this product(s)?")){
        return false;
      }
      this.setState({isProcessing:true});
      checked.forEach((productId, index, array) => {
        const userData = JSON.parse(getSession("userData"));
        const sessionToken = userData.sessionToken;
        let product = this.state.products.find(item => item._id === productId );
        product.isActive = false;
        this.props.updateProduct(
          product,
          productId,
          sessionToken,
          (error, result) => {
            if (result) {
              this.setState(prevState => {
                const list = prevState.products.map(item => checkedItems(item,prevState.products));
                return {
                  list,
                };
              });
              updatedItems++;
            } else {
              if (error) {
                hasError = true;
              }
            }
            items++;
            if(items === array.length) {
              this.setState({isProcessing:false});
              if(updatedItems > 0) {
                this.showNotification('Products has been unpublished!');
              }
              if(hasError) {
                this.showNotificationError('There is a error in updating the product(s)!');
              }
            }
          }
        );
      });
    } else {
      this.showNotificationError('Please select a product!');
      return false;
    }
  }

  sortCreated = () => {
    let sort = "";
    if (this.state.sortBy === "created") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "created";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr, defaultPage);
  }

  sortUpdated = () => {
    let sort = "";
    if (this.state.sortBy === "updated") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "updated";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);
    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr, defaultPage);
  }

  sortPrice = () => {
    let sort = "";
    if (this.state.sortBy === "price") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "price";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr, defaultPage);
  }

  sortName = () => {
    let sort = "";
    if (this.state.sortBy === "name") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "name";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr, defaultPage);
  }

  sortItemCode = () => {
    let sort = "";
    if (this.state.sortBy === "itemCode") {
      if (this.state.sort !== "desc") {
        sort = "desc";
      } else {
        sort = "asc";
      }
    } else {
      sort = "desc";
    }
    let sortBy = "itemCode";
    let defaultPage = JSON.parse(getSession("defaultPage"));
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.message;
    query.sort = sort;
    query.sortBy = sortBy;
    let queryStr = "?" + queryString.stringify(query);

    this.setState({ sort: sort });
    this.setState({ sortBy: sortBy });
    this.refreshProductList(queryStr, defaultPage);
  }

  copyToClipboard = (e) => {
    const productId = e.currentTarget.dataset.id;
    navigator.clipboard.writeText(productId)
      .then(() => {
        this.showNotification("Product ID copied to clipboard!");
      })
      .catch(err => {
        this.showNotificationError("Error in copying Product ID!");
      });
  }

  refreshProductList(queryStr, pageId) {
    const query = queryString.parse(queryStr);
    const message = query.message
    const checkAll = document.getElementById('check-all');
    if(checkAll) {
      checkAll.checked = false;
    }
    const checkboxes = document.querySelectorAll('input[name="product"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });

    if(message) {
      delete query.message;
      this.showNotification(message);
    }

    this.props.history.push("/products" + queryStr);
    const userData = JSON.parse(getSession("userData"));
    const pageInfo = JSON.parse(getSession("pageInfo"));
    const { sessionToken } = userData;
    if (userData !== null && pageInfo ) {
      if(pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb') {
        this.setState({ isGrocery: true });
        this.props.getProductsGroceryByPageId(
          pageId,
          query,
          sessionToken,
          (error, result) => {
            if (!error && result) {
              const places = result.places;
              if(result.pagination && result.pagination.total && result.pagination.total > 0) {
                setSession('hasProducts',true);
              } else {
                setSession('hasProducts',false);
              }
              if(this._isMount) {
                this.setState({
                  places: places,
                  products: result.products,
                  pagination: result.pagination
                });
              }
            }
            this.setState({isLoading:false});
          }
        );
      } else if(pageInfo && pageInfo.pageType === '58b5180adaa07f5b2b0281ba') {
          this.props.getProductsGroceryByPageId(
            pageId,
            query,
            sessionToken,
            (error, result) => {
              if (!error && result) {
                const places = result.places;
                if(result.pagination && result.pagination.total && result.pagination.total > 0) {
                  setSession('hasProducts',true);
                } else {
                  setSession('hasProducts',false);
                }
                this.setState({
                  places: places,
                  products: result.products,
                  pagination: result.pagination
                });
              }
              this.setState({isLoading:false});
            }
          ); 
      } else {
        this.props.getProductsByPageId(
          pageId,
          query,
          sessionToken,
          (error, result) => {
            if (!error && result) {
              const places = result.places;
              if(result.pagination && result.pagination.total && result.pagination.total > 0) {
                setSession('hasProducts',true);
              } else {
                setSession('hasProducts',false);
              }
              this.setState({
                places: places,
                products: result.products,
                pagination: result.pagination
              });
            }
            this.setState({isLoading:false});
          }
        );
      }
    } else {
      this.setState({isLoading:false});
    }
  }

  exportProducts = () => {
    let url = this.props.location.search;
    let query = queryString.parse(url);
    delete query.sort;
    delete query.sortBy;
    delete query.page;
    delete query.size;
    delete query.message;
    
    const checkAll = document.getElementById('check-all');
    if(checkAll) {
      checkAll.checked = false;
    }
    const checkboxes = document.querySelectorAll('input[name="product"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = false;
    });
    let pageId = JSON.parse(getSession("defaultPage"));
    const userData = JSON.parse(getSession("userData"));
    const { sessionToken } = userData;

    if (userData != null && pageId ) {
      this.setState({ isGeneratingXls: true });
      if(sessionToken) {
        api(sessionToken).get(`/provider/places/${pageId}/export-products`, { params: query })
          .then(resp => {
            if(resp && resp.data && resp.data.status === 'success' && resp.data.filename) {
              const fileName = resp.data.filename;
              this.setState({ isGeneratingXls: false });
              window.open(fileName);
            } else {
              this.setState({isGeneratingXls:false});
              this.showNotificationError('No products found.');
            }
          })
          .catch(error => {
            this.setState({isGeneratingXls:false});
            this.showNotificationError('There is a problem exporting! Please try again!');
          })
      }
    } else {
      this.setState({isLoading:false});
    }
  }

  getCategories(pageInfo,defaultPage,sessionToken) {
    if(pageInfo && pageInfo.useCreatedProductCategory) {
      let pageId = defaultPage;
      const GAISANO_CDO_MAIN = '5ccfe6aeb99ae3280fd246dc';
      const GAISANO_BRANCHES = [
        '5e6c8ee3a5ac68a35e071e07', // Malaybalay
        '5e6c8ed7a5ac68a35e071e05', // Gensan
        '5e6c8edda5ac68a35e071e06', // Iligan
        '5e6c8ecea5ac68a35e071e04', // Tagum
        '5e9e50973c47b363587eb3d9' // Davao
      ]
      const gaisanoBranch = GAISANO_BRANCHES.find(item => item === defaultPage);
      if(gaisanoBranch) {
        pageId = GAISANO_CDO_MAIN;
      }
      this.props.getProductCategoriesAllV2(
        {},
        pageId,
        sessionToken,
        (error, result) => {
          if (!error && result) {
            const categoriesAll = result;
            if(categoriesAll instanceof Array && categoriesAll.length > 0) {
              let productCategoriesAll = [];
              let productCategoriesMain = [];
              let productCategoriesSub = [];
              categoriesAll.forEach(item => {
                const category = {
                  value: item._id,
                  label: (item.isActive === true) ? item.name : item.name + " - INACTIVE",
                  parent: item.parent,
                }
                productCategoriesAll.push(category);
              });
              productCategoriesMain = productCategoriesAll.filter(item => !item.parent);
              const categoryFirst = [
                {
                  value: "",
                  label: "All",
                  parent: "",
                },
                {
                  value: "no-category",
                  label: "No category",
                  parent: "",
                }
              ]
              productCategoriesMain = [...categoryFirst,...productCategoriesMain];
              if(this.state.selectedProductCategory) {
                productCategoriesSub = productCategoriesAll.filter(item => item.parent && item.parent.id.toString() === this.state.selectedProductCategory);
              }
              this.setState({
                productCategoriesAll: productCategoriesAll,
                productCategories: productCategoriesMain,
                productCategoriesSub: productCategoriesSub,
              });
              
            } else {
              this.setState({
                productCategories: [],
              });
            }
          }
        }
      );
    } else {
      this.props.getProductCategoriesAll(
        {},
        sessionToken,
        (error, result) => {
          if (!error && result) {
            const categoriesAll = result;
            if(categoriesAll instanceof Array && categoriesAll.length > 0) {
              let productCategoriesAll = [];
              let productCategoriesMain = [];
              let productCategoriesSub = [];
              categoriesAll.forEach(item => {
                const category = {
                  value: item._id,
                  label: (item.isActive === true) ? item.name : item.name + " - INACTIVE",
                  parent: item.parent,
                }
                productCategoriesAll.push(category);
              });
              productCategoriesMain = productCategoriesAll.filter(item => !item.parent);
              const categoryFirst = [
                {
                  value: "",
                  label: "All",
                  parent: "",
                },
                {
                  value: "no-category",
                  label: "No category",
                  parent: "",
                }
              ]
              productCategoriesMain = [...categoryFirst,...productCategoriesMain];
              if(this.state.selectedProductCategory) {
                productCategoriesSub = productCategoriesAll.filter(item => item.parent && item.parent.id.toString() === this.state.selectedProductCategory);
              }
              this.setState({
                productCategoriesAll: productCategoriesAll,
                productCategories: productCategoriesMain,
                productCategoriesSub: productCategoriesSub,
              });
              
            } else {
              this.setState({
                productCategories: [],
              });
            }
          }
        }
      );
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

  render() {
    let pageInfo = JSON.parse(getSession("pageInfo"));
    let hasCategories = JSON.parse(getSession("hasCategories"));
    let hasProducts = JSON.parse(getSession("hasProducts"));
    if(pageInfo) {
      if (pageInfo.pageType === '5dea2304f6bba08323a3ddce') {
        this.props.history.push("/tours");
        window.location.reload();
      }
    }
    if(pageInfo && pageInfo._id) {
      if(pageInfo.isVerified === true) {
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
                      <h4 className="title">Products - <em>{pageInfo.name}</em></h4>
                      <Row>
                        {!hasCategories && 
                          <Col sm="12">
                            <Row>
                              <Col md="12">
                                <Alert color="warning">
                                  <p className="mb-0">
                                    You have not added a category yet. Click{" "} <Link to="/product-categories/new">here</Link> {" "}to add a product category.
                                  </p>
                                </Alert>
                              </Col>
                            </Row>
                          </Col>
                        }
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
                        {!pageInfo.hideTutorials &&
                          <Col sm="12">
                            <Row>
                              <Col md="12">
                                <Alert className="alert-compact" color="primary" isOpen={!this.state.hideTutorials} toggle={this.onDismiss} fade={false}>
                                  <h4 className="alert-heading">New on Products?</h4>
                                  <hr />
                                  <p className="mb-0">
                                    Check our videos here on how to manage your products.<br /> 
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
                        }
                        <Col md="6">
                          <Row>
                            <Col md="12">
                              <FormGroup>
                                <label htmlFor="keyword" className="control-label">Search:</label>
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="6">
                              <FormGroup>
                                <Input
                                  id="keyword"
                                  name="keyword"
                                  type="text"
                                  placeholder="Search product..."
                                  onChange={this.handleChangeKeyword}
                                  onKeyPress={this.handleEnter}
                                  value={this.state.keyword}
                                >
                                </Input>
                              </FormGroup>
                            </Col>
                          </Row>
                        </Col>
                        <Col md="6">
                          <Row>
                            <Col className="pull-right" md="12">
                              <FormGroup style={{textAlign:'right'}}>
                                <label className="control-label">Filter:</label>
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="6">
                              <FormGroup>
                                <Select
                                  className="react-select"
                                  styles={{fontSize:'13px !important'}}
                                  options={this.state.productCategories}
                                  onChange={this.handleChangeProductCategory}
                                  placeholder="Select main category"
                                  value={this.state.productCategories.filter(item => item.value === this.state.selectedProductCategory)}
                                />
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Select
                                  className="react-select"
                                  styles={{fontSize:'13px !important'}}
                                  isClearable={true}
                                  options={this.state.productCategoriesSub}
                                  onChange={this.handleChangeProductCategorySub}
                                  placeholder="Select sub category"
                                  value={this.state.productCategoriesSub.filter(item => item.value === this.state.selectedProductCategorySub)}
                                />
                              </FormGroup>
                            </Col>
                          </Row>
                          <Row>
                            <Col md="6">
                              <FormGroup>
                                <Input
                                  id="availability"
                                  name="availability"
                                  type="select"
                                  onChange={this.handleChangeAvailability}
                                  value={this.state.selectedAvailability}
                                >
                                  <option value="">For Sale/Availability</option>
                                  <option value="available">Available</option>
                                  <option value="notAvailable">Not Available</option>
                                </Input>
                              </FormGroup>
                            </Col>
                            <Col md="6">
                              <FormGroup>
                                <Input
                                  id="productStatus"
                                  name="productStatus"
                                  type="select"
                                  onChange={this.handleChangeProductStatus}
                                  value={this.state.status}
                                >
                                  <option value="">Status</option>
                                  <option value="active">Active</option>
                                  <option value="inActive">Inactive</option>
                                </Input>
                              </FormGroup>
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                      <Row>
                        <Col style={{textAlign:'right'}} md="12">
                          {pageInfo && /* (pageInfo.pageType === '5cd141d10d437be772373ddb' || pageInfo.pageType === '58b5180adaa07f5b2b0281ba') && */
                            <Link
                              to="/product-images/bulk-upload"
                              alt="Add New Product"
                              title="Add New Product"
                              className="btn btn-sm btn-round btn-info"
                            >
                              <Fa icon="images" />&nbsp;Images - Bulk Upload
                            </Link>
                          }
                          <Link
                            to="/products/new"
                            alt="Add New Product"
                            title="Add New Product"
                            className="btn btn-sm btn-round btn-info"
                          >
                            <Fa icon="plus" />&nbsp;Add New
                          </Link>
                          <Button
                            alt="Delete"
                            title="Delete"
                            className="btn btn-sm btn-round btn-info"
                            onClick={this.handleDeleteChecked}
                          >
                            <Fa icon="archive" />&nbsp;Delete
                          </Button>
                          <Button
                            alt="Publish"
                            title="Publish"
                            className="btn btn-sm btn-round btn-info"
                            onClick={this.handlePublishChecked}
                          >
                            <Fa icon="eye" />&nbsp;Publish
                          </Button>
                          <Button
                            alt="Unpublish"
                            title="Unpublish"
                            className="btn btn-sm btn-round btn-info"
                            onClick={this.handleUnpublishChecked}
                          >
                            <Fa icon="eye-slash" />&nbsp;Unpublish
                          </Button>
                          <Button
                            alt="Export"
                            title="Export"
                            className="btn btn-sm btn-round btn-info"
                            onClick={this.exportProducts}
                          >
                            <Fa icon="file-excel" />&nbsp;Export
                          </Button>
                        </Col>
                      </Row>
                    </CardHeader>
                    <CardBody>
                      <Table className="tablesorter table-striped" responsive>
                        <thead className="text-primary">
                          <tr>
                            <th>
                              <Input
                                style={{position: 'inherit', margin: '0'}}
                                type="checkbox"
                                id="check-all"
                                onClick={this.handleCheckAll}
                              />
                            </th>
                            <th>&nbsp;</th>
                            <th style={{whiteSpace:"nowrap"}} onClick={this.sortName}>
                              Item{" "}
                              {this.state.sortBy === "name" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "name" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "name" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th style={{whiteSpace:"nowrap"}} onClick={this.sortCreated}>
                              Added{" "}
                              {this.state.sortBy === "created" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "created" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "created" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th style={{whiteSpace:"nowrap"}} onClick={this.sortUpdated}>
                              Updated{" "}
                              {this.state.sortBy === "updated" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "updated" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "updated" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th style={{whiteSpace:"nowrap"}} onClick={this.sortItemCode}>
                              Item Code{" "}
                              {this.state.sortBy === "itemCode" &&
                                this.state.sort === "desc" && (
                                  <Fa icon="arrow-down" className="text-info" />
                                )}{" "}
                              {this.state.sortBy === "itemCode" &&
                                this.state.sort === "asc" && (
                                  <Fa icon="arrow-up" className="text-info" />
                                )}{" "}
                              {this.state.sortBy !== "itemCode" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                            </th>
                            <th style={{whiteSpace:"nowrap"}}>Barcode</th>
                            <th style={{whiteSpace:"nowrap"}}>Category</th>
                            <th style={{whiteSpace:"nowrap"}} className="text-right" onClick={this.sortPrice}>
                              <span style={{ display: "block" }}>
                                Price{" "}
                                {this.state.sortBy === "price" &&
                                  this.state.sort === "desc" && (
                                    <Fa icon="arrow-down" className="text-info" />
                                  )}{" "}
                                {this.state.sortBy === "price" &&
                                  this.state.sort === "asc" && (
                                    <Fa icon="arrow-up" className="text-info" />
                                  )}{" "}
                                {this.state.sortBy !== "price" && (
                                  <Fa icon="arrow-down" className="text-disabled" />
                                )}{" "}
                              </span>
                            </th>
                            <th>&nbsp;</th>
                            <th style={{whiteSpace:"nowrap"}}>For Sale</th>
                            <th style={{whiteSpace:"nowrap"}}>Publish</th>
                            { pageInfo && pageInfo.pageType === '5cd141d10d437be772373ddb' &&
                              <th style={{whiteSpace:"nowrap", textAlign:'center'}}><Fa icon="lock"/></th>
                            }
                          </tr>
                        </thead>
                        <tbody>{this.renderRows(this.state.products)}</tbody>
                      </Table>
                    </CardBody>
                    <CardFooter>
                      <Row>
                        <Col md="12">
                          <Row>
                            <Col md="12" lg="12">
                              {this.state.pagination && this.state.pagination.total > 0 && (
                                <>
                                  <Pagination
                                    innerClass="pagination"
                                    activePage={this.state.activePage}
                                    itemsCountPerPage={this.state.pagination.limit}
                                    totalItemsCount={this.state.pagination.total}
                                    pageRangeDisplayed={5}
                                    onChange={this.handlePageChange}
                                  />
                                  <p>Page <em>{this.state.activePage}</em> of <em>{Math.ceil(this.state.pagination.total/this.state.pagination.limit)}</em> of <em>{numberWithCommasOnly(this.state.pagination.total)}</em> products.</p>
                                  <Input
                                    style={{marginBottom:'5px',width:'auto'}}
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
                                </>
                              )}
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </CardFooter>
                  </Card>
                </Col>
              </Row>
            </div>
            <LoadingOverlay
              active={this.state.isProcessing}
              spinner
              text='Processing...'
              >
            </LoadingOverlay>
            <LoadingOverlay
              active={this.state.isGeneratingXls}
              spinner
              text='Processing...'
              >
            </LoadingOverlay>
          </>
        );
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

const numberWithCommasOnly = x => {
  return priceRound(x,0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const checkedItems = (item,product) => {
  if (item._id === product._id) {
    return item = product;
  }
}

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
    getProductsByPageId,
    getProductsGroceryByPageId,
    getProductsByProviderId,
    getProviderPlaces,
    getProductCategoriesAll,
    getProductCategoriesAllV2,
    updateProduct,
    deleteProduct
  }
)(Products);
