import { useAuthStore } from "../../stores/authStore";
import { PHOTO_VISIBILITY_CHANGED } from "../../lib/userSafety";
import { useEffect, useState } from "react";
import { listSpotPhotos } from "../../lib/spotPhotos";
import type { SpotPhoto } from "../../lib/spotPhotos";
function Cover({ spotId, name }: { spotId: string; name: string }) {
  const [photo, setPhoto] = useState<SpotPhoto>();
  useEffect(() => {
    let active = true;
    let generation = 0;
    const load = () => {
      const request = ++generation;
      return listSpotPhotos(spotId, 0, true)
        .then((rows) => {
          if (active && request === generation) setPhoto(rows[0]);
        })
        .catch(() => {
          if (active && request === generation) setPhoto(undefined);
        });
    };
    const changed = () => {
      setPhoto(undefined);
      void load();
    };
    window.addEventListener(PHOTO_VISIBILITY_CHANGED, changed);
    void load();
    const timer = window.setInterval(load, 240_000);
    return () => {
      active = false;
      window.removeEventListener(PHOTO_VISIBILITY_CHANGED, changed);
      window.clearInterval(timer);
    };
  }, [spotId]);
  return photo?.spot_id === spotId && photo.url ? (
    <img
      className="spot-preview-photo"
      src={photo.url}
      alt={photo.caption || name}
      onError={() => setPhoto(undefined)}
    />
  ) : null;
}

export default function SpotPhotoCover(props: {
  spotId: string;
  name: string;
}) {
  const user = useAuthStore((s) => s.user);
  return <Cover key={`${props.spotId}:${user?.id ?? "guest"}`} {...props} />;
}
