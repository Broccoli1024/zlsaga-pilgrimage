import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./stores/authStore";
import MapPage from "./pages/MapPage";
import SpotListPage from "./pages/SpotListPage";
import SpotDetailPage from "./pages/SpotDetailPage";
import RouteNewPage from "./pages/RouteNewPage";
import RouteResultPage from "./pages/RouteResultPage";
import MyPage from "./pages/MyPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import AboutPage from "./pages/AboutPage";
import FaqPage from "./pages/FaqPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import LicensePage from "./pages/LicensePage";
import NavDrawer from "./components/ui/NavDrawer";
import NavMenuButton from "./components/ui/NavMenuButton";

function AppRoutes() {
  const location = useLocation();
  const isMapPage = location.pathname === "/";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
