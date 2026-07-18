import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./stores/authStore";
import MapPage from "./pages/MapPage";
import SpotListPage from "./pages/SpotListPage";
import SpotDetailPage from "./pages/SpotDetailPage";
import RouteNewPage from "./pages/RouteNewPage";
import RouteResultPage from "./pages/RouteResultPage";
import MyPage from "./pages/MyPage";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import FaqPage from "./pages/FaqPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import LicensePage from "./pages/LicensePage";
import NavDrawer from "./components/ui/NavDrawer";
import NavMenuButton from "./components/ui/NavMenuButton";
import { HelmetProvider } from "react-helmet-async";

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMapPage = location.pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // パスワード再設定メールのリンクを踏んだ際、Redirect URLsの設定漏れ等で
    // Site URL（"/"）にフォールバックしてしまっても、確実に
    // /reset-password へ遷移させる保険
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <>
      {/* MapPageでは画面右端に固定表示 */}
      {isMapPage && (
        <NavMenuButton
          onClick={() => setIsMenuOpen(true)}
          style={{ position: "fixed", top: 70, right: 10 }}
        />
      )}
      <NavDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/spots" element={<SpotListPage />} />
        <Route path="/spots/:id" element={<SpotDetailPage />} />
        <Route path="/routes/new" element={<RouteNewPage />} />
        <Route path="/routes/:id" element={<RouteResultPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/about"
          element={<AboutPage onMenuOpen={() => setIsMenuOpen(true)} />}
        />
        <Route
          path="/faq"
          element={<FaqPage onMenuOpen={() => setIsMenuOpen(true)} />}
        />
        <Route
          path="/privacy"
          element={<PrivacyPolicyPage onMenuOpen={() => setIsMenuOpen(true)} />}
        />
        <Route
          path="/terms"
          element={<TermsPage onMenuOpen={() => setIsMenuOpen(true)} />}
        />
        <Route
          path="/license"
          element={<LicensePage onMenuOpen={() => setIsMenuOpen(true)} />}
        />
      </Routes>
    </>
  );
}

function App() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <HelmetProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
