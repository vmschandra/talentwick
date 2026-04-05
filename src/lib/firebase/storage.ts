import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./config";

export async function uploadFile(
  path: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadResume(uid: string, file: File): Promise<string> {
  return uploadFile(`resumes/${uid}/${file.name}`, file);
}

export async function uploadAvatar(uid: string, file: File): Promise<string> {
  return uploadFile(`avatars/${uid}/${file.name}`, file);
}

export async function uploadCompanyLogo(uid: string, file: File): Promise<string> {
  return uploadFile(`logos/${uid}/${file.name}`, file);
}
