import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/** Androidの戻るボタンをReact Routerの履歴と同期する。 */
export default function NativeAppLifecycle() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;

    let disposed = false;
    let removeListener: (() => Promise<void>) | undefined;

    void CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (location.pathname !== "/") {
        if (canGoBack) navigate(-1);
        else navigate("/", { replace: true });
        return;
      }

      void CapacitorApp.exitApp();
    }).then((handle) => {
      if (disposed) void handle.remove();
      else removeListener = handle.remove;
    });

    return () => {
      disposed = true;
      if (removeListener) void removeListener();
    };
  }, [location.pathname, navigate]);

  return null;
}
