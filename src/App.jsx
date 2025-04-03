import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Checkout from "./pages/CheckOut.jsx";
import CreatePayment from "./pages/CreatePayment.jsx";
import Home from "./pages/Home.jsx";
import LinkGenerate from "./pages/LinkGenerate.jsx";

const App = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create-payment" element={<CreatePayment />} />
          <Route path="/link-generate" element={<LinkGenerate />} />
          <Route path="/checkout/:paymentId" element={<Checkout />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;
