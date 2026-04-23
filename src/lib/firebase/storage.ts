import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";
import { siteConfig } from "@/config/site";

const RESUME_TYPES = new Set(siteConfig.allowedResumeTypes);
const IMAGE_TYPES = new Set(siteConfig.allowedImageTypes);

function validateFile(file: File, allowedTypes: Set<string>, maxBytes: number, label: string) {
  if (!allowedTypes.has(file.type)) {
    throw new Error(`Invalid file type for ${label}. Allowed: ${[...allowedTypes].join(", ")}`);
  }
  if (file.size > maxBytes) {
    throw new Error(`${label} exceeds the ${Math.round(maxBytes / 1024 / 1024)}MB size limit.`);
  }
}

export async function uploadFile(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadResume(uid: string, file: File): Promise<string> {
  validateFile(file, RESUME_TYPES, siteConfig.maxResumeSize, "Resume");
  return uploadFile(`resumes/${uid}/${file.name}`, file);
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  validateFile(file, IMAGE_TYPES, siteConfig.maxImageSize, "Avatar");
  return uploadFile(`avatars/${uid}/${file.name}`, file);
}

export async function uploadCompanyLogo(uid: string, file: File): Promise<string> {
  validateFile(file, IMAGE_TYPES, siteConfig.maxImageSize, "Logo");
  return uploadFile(`logos/${uid}/${file.name}`, file);
}
