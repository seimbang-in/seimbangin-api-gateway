import { createResponse } from "../utils/response";
import { Request, Response } from "express";
import { ITEM_CLASIFICATION_URL, OCR_URL } from "../static/url";
import axios from "axios";
import FormData from "form-data";

const getOCR = async (image: Express.Multer.File) => {
  try {
    const formData = new FormData();
    formData.append("file", image.buffer, image.originalname);

    const response = await axios.post(`${OCR_URL}/predict-by-file`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const { data } = response;
    return data;
  } catch (error) {
    console.log(error, "ERROR");
    return null;
  }
};

const ocrController = {
  post: async (req: Request, res: Response) => {
    // get image data
    const photo = req.file;

    if (!photo) {
      createResponse.error({
        status: 400,
        res,
        message: "Please upload a file",
      });
      return;
    }
    const ocrData = await getOCR(photo);

    if (!ocrData) {
      createResponse.error({
        status: 500,
        res,
        message: "An error occurred while processing the file",
      });
      return;
    }
    const items = ocrData.data.items;

    try {
      const clasifiedItems = await axios.post(
        `${ITEM_CLASIFICATION_URL}/text/classify`,
        { items },
      );

      createResponse.success({
        res,
        message: "OCR data retrieved successfully",
        data: clasifiedItems.data,
      });
      return;
    } catch (error) {
      console.log("ERROR SAAT MENGIRIM DATA KE ITEM CLASIFICATION API");
      createResponse.error({
        status: 500,
        res,
        message: "An error occurred while processing the file",
      });
      return;
    }
  },
};

export default ocrController;
