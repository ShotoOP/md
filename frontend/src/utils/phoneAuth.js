import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase/config";

export const setupRecaptcha = (containerId) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
  });
};

export const sendPhoneOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );
    return confirmationResult;
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
};
