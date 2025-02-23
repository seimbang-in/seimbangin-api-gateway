// import { createResponse } from "../utils/response";
// import { Request, Response } from "express";
// import { ITEM_CLASIFICATION_URL, OCR_URL } from "../static/url";
// import axios from "axios";
// import FormData from "form-data";

// const getOCR = async (image: Express.Multer.File) => {
//   try {
//     const formData = new FormData();
//     formData.append("file", image.buffer, image.originalname);

//     const response = await axios.post(`${OCR_URL}/predict-by-file`, formData, {
//       headers: {
//         ...formData.getHeaders(),
//       },
//     });

//     const { data } = response;
//     return data;
//   } catch (error) {
//     console.log(error, "ERROR");
//     return null;
//   }
// };

// const ocrController = {
//   post: async (req: Request, res: Response) => {
//     // get image data
//     const photo = req.file;

//     if (!photo) {
//       createResponse.error({
//         status: 400,
//         res,
//         message: "Please upload a file",
//       });
//       return;
//     }
//     const ocrData = await getOCR(photo);

//     if (!ocrData) {
//       createResponse.error({
//         status: 500,
//         res,
//         message: "An error occurred while processing the file",
//       });
//       return;
//     }
//     const items = ocrData.data.items;

//     try {
//       const clasifiedItems = await axios.post(
//         `${ITEM_CLASIFICATION_URL}/text/classify`,
//         { items },
//       );

//       createResponse.success({
//         res,
//         message: "OCR data retrieved successfully",
//         data: clasifiedItems.data,
//       });
//       return;
//     } catch (error) {
//       console.log("ERROR SAAT MENGIRIM DATA KE ITEM CLASIFICATION API");
//       createResponse.error({
//         status: 500,
//         res,
//         message: "An error occurred while processing the file",
//       });
//       return;
//     }
//   },
// };

// export default ocrController;

import { createResponse } from "../utils/response";
import { Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Menggunakan API key dari .env

const getMultimodalGPTResponse = async (image: Express.Multer.File) => {
  try {
    const base64Image = image.buffer.toString("base64");
    
    const requestData = {
      model: "gpt-4-vision-preview", // Model multimodal GPT
      messages: [
        {
          role: "system",
          content: "You are an AI specialized in extracting structured data from receipts or invoices. Identify and extract the following details: Store Name, Date, Items Purchased (name, quantity, price), Subtotal, Tax, and Total Amount. Return the extracted data in a structured JSON format."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract data from this receipt or invoice:" },
            { type: "image_url", image_url: `data:image/jpeg;base64,${base64Image}` }
          ]
        }
      ],
      max_tokens: 1000
    };

    const response = await axios.post(OPENAI_API_URL, requestData, {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error in GPT multimodal processing:", error);
    return null;
  }
};

const multimodalController = {
  post: async (req: Request, res: Response) => {
    const photo = req.file;

    if (!photo) {
      createResponse.error({
        status: 400,
        res,
        message: "Please upload a file",
      });
      return;
    }
    
    const gptData = await getMultimodalGPTResponse(photo);

    if (!gptData) {
      createResponse.error({
        status: 500,
        res,
        message: "An error occurred while processing the file",
      });
      return;
    }

    createResponse.success({
      res,
      message: "Receipt data extracted successfully",
      data: gptData,
    });
  },
  get: async (req: Request, res: Response) => {
    createResponse.success({
      res,
      message: "API Key fetched successfully",
      data: { apiKey: OPENAI_API_KEY ? "Loaded successfully" : "Not found" },
    });
  }
};

export default multimodalController;
