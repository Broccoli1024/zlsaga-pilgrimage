import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type SnapPoint = "min" | "mid" | "full";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  snap: SnapPoint;
  onSnapChange: (snap: SnapPoint) => void;
  header: ReactNode;
  children: ReactNode;
  /** 各スナップ位置の高さ（vh単位、0-100） */
  heights?: { min: number; mid: number; full: number };
  /** 重なり順。値が大きいほど手前に表示される */
  zIndex?: number;
}

const DEFAULT_HEIGHTS = { min: 12, mid: 45, full: 88 };

export default function BottomSheet({
  isOpen,
  snap,
  onSnapChange,
  header,
  children,
  heights = DEFAULT_HEIGHTS,
  zIndex = 5,
}: BottomSheetProps) {
  const [dragOffsetVh, setDragOffsetVh] = useState(0);
  const dragOffsetVhRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startHeightVhRef = useRef(0);

  const snapToHeight = (s: SnapPoint) => heights[s];

  const currentHeightVh = Math.min(
    heights.full,
    Math.max(4, snapToHeight(snap) + dragOffsetVh),
  );

  const vhFromPx = (px: number) => (px / window.innerHeight) * 100;

  const handleDragStart = (clientY: number) => {
    setIsDragging(true);
    startYRef.current = clientY;
    startHeightVhRef.current = snapToHeight(snap);
    dragOffsetVhRef.current = 0;
  };

  const handleDragMove = (clientY: number) => {
    const deltaPx = startYRef.current - clientY;
    const offset = vhFromPx(deltaPx);
    dragOffsetVhRef.current = offset;
    setDragOffsetVh(offset);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    const finalHeight = Math.min(
      heights.full,
      Math.max(4, startHeightVhRef.current + dragOffsetVhRef.current),
    );
    setDragOffsetVh(0);
    dragOffsetVhRef.current = 0;

    // 一番近いスナップポイントを選ぶ
    const distances: [SnapPoint, number][] = [
      ["min", Math.abs(finalHeight - heights.min)],
      ["mid", Math.abs(finalHeight - heights.mid)],
      ["full", Math.abs(finalHeight - heights.full)],
    ];
    distances.sort((a, b) => a[1] - b[1]);
    onSnapChange(distances[0][0]);
  };

  // タッチイベント
  useEffect(() => {
    if (!isDragging) return;

    const onTouchMove = (e: TouchEvent) => {
      handleDragMove(e.touches[0].clientY);
    };
    const onTouchEnd = () => handleDragEnd();
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientY);
    const onMouseUp = () => handleDragEnd();

    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  if (!isOpen) return null;

  return (
    <div
      className="bottom-sheet"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex,
        height: `${currentHeightVh}vh`,
        background: "var(--color-bg)",
        borderTopLeftRadius: "var(--radius-lg, 16px)",
        borderTopRightRadius: "var(--radius-lg, 16px)",
        boxShadow: "var(--shadow-lg)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: isDragging ? "none" : "height 0.25s ease-out",
        touchAction: "none",
      }}
    >
      {/* ドラッグハンドル */}
      <div
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        style={{
          padding: "10px 0 6px",
          display: "flex",
          justifyContent: "center",
          cursor: "grab",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "40px",
            height: "4px",
            borderRadius: "2px",
            background: "var(--color-border)",
          }}
        />
      </div>

      {/* ヘッダー（常に見える部分） */}
      <div
        onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
        onMouseDown={(e) => handleDragStart(e.clientY)}
        style={{ flexShrink: 0, cursor: "grab" }}
      >
        {header}
      </div>

      {/* 詳細コンテンツ（スクロール可能） */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
          touchAction: "pan-y",
        }}
      >
        {children}
      </div>
    </div>
  );
}
