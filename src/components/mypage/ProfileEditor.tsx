import { useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/authStore";

interface ProfileEditorProps {
  user: User;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function ProfileEditor({ user }: ProfileEditorProps) {
  const { t } = useTranslation();
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDisplayName =
    (user.user_metadata?.display_name as string | undefined) ?? "";
  const currentAvatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ?? null;

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t("profile.invalidImageType"));
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(t("profile.imageTooLarge"));
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/icon.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-icons")
        .upload(filePath, file, {
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        setError(t("profile.uploadFailed", { message: uploadError.message }));
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-icons").getPublicUrl(filePath);

      // キャッシュ対策でタイムスタンプを付与
      const bustedUrl = `${publicUrl}?t=${Date.now()}`;
      setPreviewUrl(bustedUrl);

      const { error: updateError } = await updateProfile({
        avatarUrl: bustedUrl,
      });
      if (updateError) {
        setError(t("profile.profileUpdateFailed", { message: updateError }));
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveName = async () => {
    setError(null);
    const trimmed = displayName.trim();
    if (trimmed.length === 0) {
      setError(t("profile.nameRequired"));
      return;
    }
    if (trimmed.length > 30) {
      setError(t("profile.nameTooLong"));
      return;
    }

    setSaving(true);
    try {
      const { error: updateError } = await updateProfile({
        displayName: trimmed,
      });
      if (updateError) {
        setError(t("profile.saveFailed", { message: updateError }));
        return;
      }
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = previewUrl ?? currentAvatarUrl;

  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}
    >
      <div style={{ position: "relative" }}>
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: avatarSrc
              ? `center / cover no-repeat url(${avatarSrc})`
              : "var(--color-bg)",
            border: "2px solid var(--color-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "24px",
            flexShrink: 0,
            opacity: uploading ? 0.5 : 1,
          }}
          title={t("profile.changeImage")}
        >
          {!avatarSrc && "👤"}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        {uploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "var(--font-size-xs)",
            }}
          >
            ...
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("profile.usernamePlaceholder")}
              maxLength={30}
              style={{
                fontSize: "var(--font-size-md)",
                padding: "4px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                width: "160px",
              }}
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              style={{
                fontSize: "var(--font-size-xs)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--color-primary)",
                color: "#fff",
                cursor: saving ? "default" : "pointer",
              }}
            >
              {t("profile.save")}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setDisplayName(currentDisplayName);
                setError(null);
              }}
              style={{
                fontSize: "var(--font-size-xs)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                cursor: "pointer",
              }}
            >
              {t("profile.cancel")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "var(--font-size-lg)",
                fontWeight: "500",
                color: "var(--color-text-main)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {currentDisplayName || user.email}
            </h1>
            <button
              onClick={() => setIsEditing(true)}
              style={{
                fontSize: "var(--font-size-xs)",
                padding: "2px 8px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {t("profile.edit")}
            </button>
          </div>
        )}
        {error && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
