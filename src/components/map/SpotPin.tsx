import { getMarkerAppearance, getPinColor } from "../../lib/mapMarker";
interface Props {
  name: string; categoryName: string; categoryLabel: string; sacred: boolean; manhole: boolean;
  checkedIn: boolean; favorite: boolean; showCheckins: boolean; routeMode: boolean;
  routeIndex: number; matched: boolean; selected: boolean; onClick: () => void;
}
export default function SpotPin(props: Props) {
  const appearance = getMarkerAppearance(props);
  return (
    <button type="button" className="spot-pin" aria-label={`${props.name} · ${props.categoryLabel}`}
      aria-pressed={props.selected} title={`${props.name} · ${props.categoryLabel}`} disabled={!props.matched}
      onClick={(event) => { event.stopPropagation(); props.onClick(); }} style={{ opacity: appearance.opacity }}>
      <svg aria-hidden="true" viewBox="0 0 36 44" width="34" height="42">
        <path d="M18 42C15 37 2 25 2 18a16 16 0 1 1 32 0c0 7-13 19-16 24Z"
          fill={getPinColor(props.sacred, props.manhole)} stroke={props.selected ? "#111827" : "white"} strokeWidth={props.selected ? 3 : 2} />
        <circle cx="18" cy="18" r="12" fill="white" />
      </svg>
      <span className="spot-pin-symbol" aria-hidden="true">{appearance.symbol}</span>
      {appearance.badge && <span className="spot-pin-badge" aria-hidden="true">{appearance.badge}</span>}
    </button>
  );
}
