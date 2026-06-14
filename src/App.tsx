import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./lib/supabase";
import { useAuthStore } from "./stores/authStore";
import MapPage from "./pages/MapPage";
import SpotListPage from "./pages/SpotListPage";
import SpotDetailPage from "./pages/SpotDetailPage";
import RouteNewPage from "./pages/RouteNewPage";
import MyPage from "./pages/MyPage";
import LoginPage from "./pages/LoginPage";

function App() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 認証状態の変化を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/spots" element={<SpotListPage />} />
        <Route path="/spots/:id" element={<SpotDetailPage />} />
        <Route path="/routes/new" element={<RouteNewPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
