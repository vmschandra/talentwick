import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";
import { siteConfig } from "@/config/site";

function validateFile(file: File, allowedTypes: string[], maxBytes: number, label: string) {
  if (!allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type for ${label}. Allowed: ${allowedTypes.join(", ")}`);
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
  validateFile(file, siteConfig.allowedResumeTypes, siteConfig.maxResumeSize, "Resume");
  return uploadFile(`resumes/${uid}/${file.name}`, file);
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  validateFile(file, siteConfig.allowedImageTypes, siteConfig.maxImageSize, "Avatar");
  return uploadFile(`avatars/${uid}/${file.name}`, file);
}

export async function uploadCompanyLogo(uid: string, file: File): Promise<string> {
  validateFile(file, siteConfig.allowedImageTypes, siteConfig.maxImageSize, "Logo");
  return uploadFile(`logos/${uid}/${file.name}`, file);
}
