import { nanoid } from "nanoid";
import QRCode from "qrcode";

export const createPrescriptionQr = async () => {
  const token = nanoid(24);
  const qrCode = await QRCode.toDataURL(token, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });

  return { token, qrCode };
};
