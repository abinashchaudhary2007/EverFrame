import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AnnouncementBar from './components/layout/AnnouncementBar';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import CustomFrame from './pages/CustomFrame';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import TrackOrder from './pages/TrackOrder';
import Categories from './pages/Categories';
import Admin from './pages/Admin';
import AuthCallback from './pages/AuthCallback';
import Contact from './pages/Contact';

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <AnnouncementBar />
              <Navbar />
              <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/customize" element={<CustomFrame />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/account" element={<Account />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/contact" element={<Contact />} />
                {/* Supabase Google OAuth redirect callback */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="*" element={
                  <div className="empty-state" style={{ minHeight: '60vh' }}>
                    <div className="empty-state-icon">🔍</div>
                    <h3>Page Not Found</h3>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="/" className="btn btn-primary">Go Home</a>
                  </div>
                } />
              </Routes>
            </main>
            <Footer />
            <Toaster
              position="bottom-right"
              toastOptions={{ duration: 3000 }}
            />
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);
}

export default App;
