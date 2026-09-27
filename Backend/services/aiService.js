import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export const scanAnswerSheet = async ({
  filePath,
  originalName,
  mimeType
}) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("The uploaded PDF no longer exists on the server.");
  }

  const form = new FormData();

  form.append("answer_pdf", fs.createReadStream(filePath), {
    filename: originalName,
    contentType: mimeType || "application/pdf"
  });

  const response = await axios.post(
    `${AI_SERVICE_URL}/api/scan`,
    form,
    {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 10 * 60 * 1000
    }
  );

  return response.data;
};
