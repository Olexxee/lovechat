import {
  uploadAvatar as uploadAvatarRequest,
  type MediaAsset,
} from "../../services/api";

export type UploadAvatarPayload = {
  uri: string;
  filename: string;
  mimeType: string;
};

export const uploadProfileAvatar = (
  payload: UploadAvatarPayload,
): Promise<MediaAsset> =>
  uploadAvatarRequest(payload.uri, payload.filename, payload.mimeType);
