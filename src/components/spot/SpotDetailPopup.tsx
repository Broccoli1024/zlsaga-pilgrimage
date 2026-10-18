import SpotPhotoCover from "../photos/SpotPhotoCover";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Spot, SignificanceTag } from "../../types";
interface Props {
  spot: Spot; areaName: string; categoryName: string; isSacred: boolean; tags: SignificanceTag[];
  checkedIn: boolean; isFavorite: boolean; checkingIn: boolean; canCheckin: boolean;
  onCheckin: () => void; onUnCheckin: () => void; onToggleFavorite: () => void;
}
export default function SpotDetailPopup({ spot, areaName, categoryName, isSacred,
  checkedIn, isFavorite, checkingIn, canCheckin, onCheckin, onUnCheckin, onToggleFavorite }: Props) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language.startsWith("en");
  const name = isEn ? (spot.name_en ?? spot.name) : spot.name;
  const description = isEn ? (spot.description_en ?? spot.description) : spot.description;
  return (
    <article className="spot-preview">
      <SpotPhotoCover key={spot.id} spotId={spot.id} name={name} />
      <strong className="spot-preview-name">{name}</strong>
      <div className="spot-preview-meta">{[areaName, categoryName, isSacred ? t("detail.sacred") : ""].filter(Boolean).join(" · ")}</div>
      {description && <p className="spot-preview-description">{description}</p>}
      <Link className="spot-preview-details" to={`/spots/${spot.id}`}>{isEn ? "View details" : "詳しく見る"} →</Link>
      {canCheckin ? <div className="spot-preview-actions">
        {checkedIn && <button type="button" onClick={onToggleFavorite} disabled={checkingIn}
          aria-pressed={isFavorite} aria-label={t("detail.favorite")}>{isFavorite ? "★" : "☆"}</button>}
        <button type="button" onClick={checkedIn ? onUnCheckin : onCheckin} disabled={checkingIn}>
          {checkingIn ? t("map.processing") : checkedIn ? `✓ ${t("map.uncheckin")}` : t("map.checkin")}
        </button>
      </div> : <Link className="spot-preview-login" to="/login">{t("map.loginRequired")}</Link>}
    </article>
  );
}
