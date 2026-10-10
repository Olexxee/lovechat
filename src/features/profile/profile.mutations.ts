import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import type { MediaAsset } from "../../services/api";
import {
  uploadProfileAvatar,
  type UploadAvatarPayload,
} from "./profile.api";

export function useUploadAvatar() {
  const { updateUser } = useAuth();

  return useMutation<MediaAsset, Error, UploadAvatarPayload>({
    mutationFn: uploadProfileAvatar,

    onSuccess: (asset) => {
      updateUser({
        avatar_url: asset.secure_url,
      });
    },
  });
}
