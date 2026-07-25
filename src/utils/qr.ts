import { nanoid } from "nanoid";
import QRCode from "qrcode";

export const createPrescriptionQr = async () => {
  const token = nanoid(24);
  const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
  const qrPayload = `${baseUrl}/api/public/prescriptions/qr/${token}/pdf`;
  const qrCode = await QRCode.toDataURL(qrPayload, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });

  return { token, qrCode };
};
