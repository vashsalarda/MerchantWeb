//import Dashboard from "views/Dashboard.jsx";
import Products from "components/Products/ProductList.js";
import AddProduct from "components/Products/Add.js";
import EditProduct from "components/Products/Edit.js";
import TourList from "components/Tours/TourList.js";
import TourDates from "components/TourDates/TourDateList.js";
import AddTour from "components/Tours/AddTour.js";
import EditTour from "components/Tours/EditTour.js";
import ImportProducts from "components/Products/ImportProducts.js";
import ImportProductsJson from "components/Products/ImportProductsJson.js";
import ImportProductsExcel from "components/Products/ImportProductsExcel.js";
import ProductCategories from "components/ProductCategory/ProductCategory.js";
import AddProductCategory from "components/ProductCategory/AddProductCategory.js";
import EditProductCategory from "components/ProductCategory/EditProductCategory.js"
import AddPage from "views/AddPage.js";
import EditPage from "views/EditPage.js";
import Settings from "views/Settings.js";
import ChangePassword from "views/ChangePassword.js";
import SalesReports from "components/Reports/SalesReports.js";
import OrderReports from "components/Reports/OrderReports.js";
import ProductReports from "components/Reports/ProductReports.js";
import OrdersList from "components/Orders/OrdersList.js";
import UploadProductImages from "components/Products/UploadProductImages.js";
import ImportCategoriesExcel from "components/ProductCategory/ImportCategoriesExcel.js";
import SyncProductCategories from "components/ProductCategory/SyncProductCategories.js";
import Activate from "views/Activate.js";
import Agreement from "views/Agreement.js";
import ProductVouchers from "components/Products/ProductVouchers.js";

var routes = [
  {
    path: "/add-page",
    name: "Add Store",
    rtlName: "",
    icon: "tim-icons icon-single-copy-04",
    component: AddPage,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/page",
    name: "Setup Store",
    rtlName: "",
    icon: "tim-icons icon-single-copy-04",
    component: EditPage,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/product-categories",
    name: "Categories",
    rtlName: "",
    icon: "tim-icons icon-bullet-list-67",
    component: ProductCategories,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/products",
    name: "Products",
    rtlName: "",
    icon: "tim-icons icon-app",
    component: Products,
    layout: "/admin",
    showOnSidebar: true,
    collapse: true,
  },
  {
    path: "/tours",
    name: "Tours",
    rtlName: "",
    icon: "tim-icons icon-app",
    component: TourList,
    layout: "/admin",
    showOnSidebar: true,
    collapse: true,
  },
  {
    path: "/tour-dates",
    name: "Tour Dates",
    rtlName: "",
    icon: "tim-icons icon-calendar-60",
    component: TourDates,
    layout: "/admin",
    showOnSidebar: true,
    collapse: true,
  },
  {
    path: "/products/new",
    name: "Add Product",
    rtlName: "",
    icon: "tim-icons icon-app",
    component: AddProduct,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/products/:_id/edit",
    name: "Edit Product",
    rtlName: "",
    icon: "tim-icons icon-app",
    component: EditProduct,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/tours/new",
    name: "Add Tour",
    rtlName: "",
    icon: "",
    component: AddTour,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/tours/:_id/edit",
    name: "Edit Tour",
    rtlName: "",
    icon: "",
    component: EditTour,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/order-list",
    name: "Orders",
    rtlName: "",
    icon: "tim-icons icon-notes",
    component: OrdersList,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/product-vouchers",
    name: "Product Vouchers",
    rtlName: "",
    icon: "tim-icons icon-tag",
    component: ProductVouchers,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/import-products",
    name: "Import Products",
    rtlName: "",
    icon: "tim-icons icon-cloud-download-93",
    component: ImportProducts,
    layout: "/ImportVoucherCodesExcel",
    showOnSidebar: true,
  },
  {
    path: "/import-products-excel",
    name: "Import Products - XLS",
    rtlName: "",
    icon: "tim-icons icon-cloud-download-93",
    component: ImportProductsExcel,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/product-categories/new",
    name: "Add Product Category",
    rtlName: "",
    icon: "",
    component: AddProductCategory,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/product-categories/:_id/edit",
    name: "Edit Product Category",
    rtlName: "",
    icon: "",
    component: EditProductCategory,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/reports/sales",
    name: "Sales Reports",
    rtlName: "",
    icon: "tim-icons icon-coins",
    component: SalesReports,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/reports/order",
    name: "Order Reports",
    rtlName: "",
    icon: "tim-icons icon-cart",
    component: OrderReports,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/reports/product",
    name: "Product Reports",
    rtlName: "",
    icon: "tim-icons icon-chart-bar-32",
    component: ProductReports,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/settings",
    name: "Account Settings",
    rtlName: "",
    icon: "tim-icons icon-settings",
    component: Settings,
    layout: "/admin",
    showOnSidebar: true,
  },
  {
    path: "/settings/change-password",
    name: "Change Password",
    rtlName: "",
    icon: "",
    component: ChangePassword,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/product-images/bulk-upload",
    name: "Products Images",
    rtlName: "",
    icon: "tim-icons icon-cloud-upload-94",
    component: UploadProductImages,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/import-products-json",
    name: "Import Products - JSON",
    rtlName: "",
    icon: "tim-icons icon-cloud-download-93",
    component: ImportProductsJson,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/import-categories-excel",
    name: "Import Categories - XLS",
    rtlName: "",
    icon: "tim-icons icon-cloud-download-93",
    component: ImportCategoriesExcel,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/sync-product-categories",
    name: "Sync Product Categories",
    rtlName: "",
    icon: "tim-icons icon-cloud-download-93",
    component: SyncProductCategories,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/statement-of-agreement",
    name: "Statement of Agreement",
    rtlName: "",
    icon: "tim-icons icon-paper",
    component: Agreement,
    layout: "/admin",
    showOnSidebar: false,
  },
  {
    path: "/activate-store",
    name: "Activate Store",
    rtlName: "",
    icon: "tim-icons icon-check-2",
    component: Activate,
    layout: "/admin",
    showOnSidebar: false,
  }
];
export default routes;